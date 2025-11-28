'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import LinkGenerator from '../LinkGenerator/page';
import LinkPage from '@/app/(protected)/linkhistory/page';
import LinkViewPage from '../../messages/page';
import { supabase } from '@/lib/supabaseClient';
import SpyReportViewer from '@/app/component/Spy';
import AvatarUpload from '@/app/component/AvatarUpload';
import ProfileImage from '@/app/component/ProfileImage';
import ShareCard from '@/app/component/ShareCard';
import TargetInterceptor from '@/app/component/TargetInterceptor';
import DashboardOverview from '@/app/component/Overview';
import UrlShortener from '@/app/component/UrlShortener';
// --- MOCK DATA (Fallback) ---
const stats = [
  { label: 'Total Views', value: '0', change: '+0%', icon: '👁️' },
  { label: 'Messages', value: '0', change: '+0%', icon: '📩' },
  { label: 'Active Links', value: '0', change: '+0%', icon: '🔗' },
];

export default function DashboardPage() {

   const handleToLogOut = async () => {
        console.log('=== LOGOUT ATTEMPT ===');
        const { error } = await supabase.auth.signOut();
        console.log('Logout error:', error);
        
        if (error) {
            console.error('❌ Logout failed:', error.message);
        } else {
            console.log('✅ Logout successful!');
        }
    };

    const [username, setUsername] = useState("");
    const [Hi, setHi] = useState(true);
    const [profile, setProfile] = useState<any>(null);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [id, setId]= useState('');
    
    // --- NEW STATE FOR OVERVIEW ---
    const [recentMessages, setRecentMessages] = useState<any[]>([]);
    const [realStats, setRealStats] = useState(stats); // Holds live data

    // 1. Get Current User & Profile & Dashboard Data
    useEffect(() => {
        const getProfile = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            
            if (user) {
                setCurrentUser(user);
                // Fetch FULL profile
                const { data, error } = await supabase
                    .from('profiles')
                    .select('*') 
                    .eq('id', user.id)
                    .single();

                if (data) {
                    console.log("Found Profile:", data);
                    setUsername(data.username);
                    setId(data.id);
                    setProfile(data); 
                }

                // --- FETCH REAL DASHBOARD STATS ---
                // 1. Get Links & Views
                const { data: links } = await supabase
                    .from('links')
                    .select('id, views')
                    .eq('creator_user_id', user.id);

                const totalLinks = links?.length || 0;
                const totalViews = links?.reduce((acc, curr) => acc + (curr.views || 0), 0) || 0;
                const linkIds = links?.map(l => l.id) || [];

                let totalMessages = 0;
                let recentMsgs: any[] = [];

                // 2. Get Messages if links exist
                if (linkIds.length > 0) {
                     // Count Total
                     const { count } = await supabase
                        .from('messages')
                        .select('*', { count: 'exact', head: true })
                        .in('link_id', linkIds);
                     totalMessages = count || 0;

                     // Get Recent 5 for Overview
                     const { data: msgs } = await supabase
                        .from('messages')
                        .select('*')
                        .in('link_id', linkIds)
                        .order('created_at', { ascending: false })
                        .limit(5);
                     
                     recentMsgs = msgs || [];
                }

                setRecentMessages(recentMsgs);
                setRealStats([
                  { label: 'Total Views', value: totalViews.toLocaleString(), change: 'Live', icon: '👁️' },
                  { label: 'Messages', value: totalMessages.toLocaleString(), change: 'Live', icon: '📩' },
                  { label: 'Active Links', value: totalLinks.toString(), change: 'Active', icon: '🔗' },
                ]);
            }
        } catch (error) {
            console.error("Error fetching profile:", error);
        } finally {
            setHi(false);
        }
        };

        getProfile();
    }, []);


  const [activeTab, setActiveTab] = useState('Overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleNavClick = (tabName: string) => {
    setActiveTab(tabName);
    setIsMobileMenuOpen(false);
  };

  // --- CONTENT RENDERER ---
  const renderContent = () => {
    switch (activeTab) {
      case 'Overview':
        return (
            <DashboardOverview 
                profile={profile}
                // Parse numbers from the RealStats state
                totalMessages={parseInt(realStats.find(s => s.label.includes('Messages'))?.value.replace(/,/g, '') || '0')}
                totalLinks={parseInt(realStats.find(s => s.label.includes('Active'))?.value || '0')}
                recentMessages={recentMessages}
                onNavigate={handleNavClick}
            />
        );

      case 'Create Link':
        return <LinkGenerator />;

      case 'Link History':
        return <LinkPage />;

      case 'Inbox':
       return <LinkViewPage/>;

      case 'Smart Reply':
        return <SpyReportViewer/>;
        case 'Share Card':
        return  <ShareCard />; 
        case 'Anonymous Chat':
          return <TargetInterceptor/>;
          case 'Shorten URL':
            return <UrlShortener/>;
             case 'Settings':
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] animate-in fade-in space-y-10">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-white">Agent Profile</h2>
                    <p className="text-gray-500 text-sm">Update your visual signature.</p>
                </div>

                {/* --- AVATAR UPLOAD COMPONENT --- */}
                {currentUser && (
                    <AvatarUpload 
                        uid={currentUser.id} 
                        url={profile?.avatar_url} 
                        onUploadComplete={(newUrl) => {
                            // Update local state to reflect change immediately
                            setProfile((prev: any) => ({ ...prev, avatar_url: newUrl }));
                        }}
                    />
                )}

                <div className="w-full max-w-md border-t border-white/10 pt-6 text-center">
                     <p className="text-xs text-gray-600 font-mono uppercase tracking-widest">
                        ID: <span className="text-emerald-500">{username || "Classified"}</span>
                     </p>
                </div>
               
            </div>
        );


      default:
        return (
          <div className="flex items-center justify-center h-[50vh] text-gray-500 animate-in fade-in">
            Work in progress...
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-[#050505] text-white font-sans selection:bg-emerald-500 selection:text-black overflow-hidden relative">
      
      {/* --- BACKGROUND FX --- */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-emerald-900/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-purple-900/10 rounded-full blur-[120px]" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10"></div>
      </div>

      {/* --- MOBILE OVERLAY --- */}
      {isMobileMenuOpen && (
        <div 
            className="fixed inset-0 bg-black/80 z-40 md:hidden backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}

      {/* --- SIDEBAR --- */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-[#0a0a0a] md:bg-black/40 md:backdrop-blur-xl border-r border-white/5 flex flex-col 
        transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] 
        ${isMobileMenuOpen ? 'translate-x-0 shadow-2xl shadow-emerald-900/20' : '-translate-x-full'}
        md:translate-x-0 md:static md:h-screen
      `}>
        
        {/* Mobile Close Button */}
        <button 
            onClick={() => setIsMobileMenuOpen(false)}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white md:hidden active:bg-white/10 rounded-lg"
        >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>

        {/* Profile Header */}
        <div className="p-8 flex flex-col items-center border-b border-white/5 mt-8 md:mt-0">
          <div className="relative w-24 h-24 mb-4 group cursor-pointer">
            <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500 to-cyan-500 rounded-full blur opacity-40 group-hover:opacity-60 transition-opacity"></div>
            <div className="relative w-full h-full rounded-full p-[2px] bg-gradient-to-tr from-emerald-500 to-cyan-500 overflow-hidden">
              <ProfileImage uid={id}/>
            </div>
            <div className="absolute bottom-0 right-0 w-6 h-6 bg-black rounded-full flex items-center justify-center border-2 border-[#0a0a0a]">
                <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
            </div>
          </div>
          <h2 className="text-xl font-bold text-white">{Hi ? "Hi there..." : '@'+username}</h2>
          <p className="text-xs text-gray-500 font-mono mt-1">PRO MEMBER</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {[
                { name: 'Overview', icon: '📊' },
                { name: 'Inbox', icon: '📨', badge: 3 },
              
                { name: 'Create Link', icon: '➕' },

                 { name: 'Share Card', icon: '👀' },
                 { name: 'Anonymous Chat', icon: '💬' },
                  { name: 'Shorten URL', icon: ' ✂️' },
                    { name: 'Link History', icon: '🔗' },
                                  { name: 'Settings', icon: '⚙️' },
            ].map((item) => (
                <button 
                    key={item.name}
                    onClick={() => handleNavClick(item.name)}
                    className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-sm font-medium transition-all active:scale-[0.98] ${
                        activeTab === item.name 
                        ? 'bg-white/10 text-white border border-white/10' 
                        : 'text-gray-400 hover:bg-white/5 hover:text-white'
                    }`}
                >
                    <div className="flex items-center gap-3">
                        <span className="text-lg">{item.icon}</span>
                        {item.name}
                    </div>
                    {item.badge && (
                        <span className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                            {item.badge}
                        </span>
                    )}
                </button>
            ))}

            {/* SPACER */}
            <div className="my-4 border-t border-white/5"></div>

            {/* AI OPTION */}
            <button 
                onClick={() => handleNavClick('Smart Reply')}
                className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-sm font-medium transition-all group relative overflow-hidden active:scale-[0.98] ${
                    activeTab === 'Smart Reply' ? 'bg-purple-500/20 border border-purple-500/30' : 'hover:bg-white/5'
                }`}
            >
                <div className="flex items-center gap-3 relative z-10 text-white">
                    <span className="group-hover:animate-spin text-lg">⚡</span>
                    SPY
                </div>
                <span className="relative z-10 text-[9px] font-black uppercase tracking-wider bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-1 rounded shadow-lg">
                    AI Empowered
                </span>
            </button>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-white/5 mb-safe md:mb-0">
            <Link href="/">
                <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-500 hover:text-red-400 transition-colors text-sm font-medium" onClick={handleToLogOut}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                    Logout
                </button>
            </Link>
        </div>
      </aside>

      {/* --- MAIN CONTENT AREA --- */}
      <main className="flex-1 flex flex-col relative z-10 overflow-hidden h-screen w-full">
        
        {/* Header (Responsive) */}
        <header className="h-16 md:h-20 border-b border-white/5 bg-black/20 backdrop-blur-md flex items-center justify-between px-4 md:px-8 shrink-0 w-full z-30">
            <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
                
                {/* 3-Dot/Hamburger Menu Button */}
                <button 
                    onClick={() => setIsMobileMenuOpen(true)}
                    className="md:hidden p-2 -ml-2 text-gray-300 hover:text-white rounded-lg active:bg-white/10 transition-colors"
                >
                    {/* Menu Icon */}
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
                </button>

                <div className="min-w-0">
                    <h1 className="text-lg md:text-2xl font-bold text-white truncate">{activeTab}</h1>
                    <p className="hidden md:block text-xs text-gray-500 mt-1">Welcome back, Detective.</p>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <button className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center border border-white/5 transition-colors relative active:scale-95">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
                </button>
            </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
            {renderContent()}
        </div>

      </main>
    </div>
  );
}