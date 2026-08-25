'use client';

import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

const THEMES = [
  { id: 'classic', name: 'Twisted', background: 'linear-gradient(to bottom, #0f172a, #312e81, #4c1d95)' },
  { id: 'cyber', name: 'Cyberpunk', background: 'linear-gradient(135deg, #2b033d, #8a0b5c, #e51d45)' },
  { id: 'neon', name: 'Neon Glow', background: 'linear-gradient(135deg, #001f18, #005a49, #00b388)' },
  { id: 'ruby', name: 'Ruby', background: 'linear-gradient(135deg, #300609, #86101c, #ec2633)' },
  { id: 'minimal', name: 'Dark Mode', background: '#050505' },
];

// --- PROPS INTERFACE ---
interface ShareCardProps {
  username?: string;
  avatarUrl?: string | null;
}

export default function ShareCardGenerator({ username, avatarUrl }: ShareCardProps) {
  
  // --- STATE ---
  const [displayName, setDisplayName] = useState(username || "");
  const [linkUrl, setLinkUrl] = useState("");
  const [profileImage, setProfileImage] = useState(avatarUrl || "");
  const [coverImage, setCoverImage] = useState(""); 
  const [activeTheme, setActiveTheme] = useState(THEMES[0]);
  const [loading, setLoading] = useState(false);
  const [copyStatus, setCopyStatus] = useState("Copy Link");

  const cardRef = useRef<HTMLDivElement>(null);
  const fileInputRefProfile = useRef<HTMLInputElement>(null);
  const fileInputRefCover = useRef<HTMLInputElement>(null);

  // --- ⚡ AUTO-FETCH REAL USER DATA ---
  useEffect(() => {
    const fetchUserData = async () => {
      // 1. Get Logged In User
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // 2. Fetch Profile (Real Name & Avatar)
        const { data: profile } = await supabase
          .from('profiles')
          .select('username, avatar_url')
          .eq('id', user.id)
          .single();

        if (profile) {
          if (profile.username) setDisplayName(profile.username);
          if (profile.avatar_url) setProfileImage(profile.avatar_url);
        }
      }
    };

    // If props are missing, try to fetch. If props exist, rely on the useEffect below.
    if (!username && !avatarUrl) {
        fetchUserData();
    }
  }, [username, avatarUrl]);

  // --- AUTO-UPDATE IF PROPS CHANGE (For parent component updates) ---
  useEffect(() => {
      if (username) setDisplayName(username);
      if (avatarUrl) setProfileImage(avatarUrl);
  }, [username, avatarUrl]);

  // --- HANDLERS ---

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'profile' | 'cover') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (type === 'profile') setProfileImage(e.target?.result as string);
        else setCoverImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCopyLink = () => {
    if (!linkUrl) return alert("No link found. Create one first!");
    navigator.clipboard.writeText(linkUrl);
    setCopyStatus("COPIED! ✅");
    setTimeout(() => setCopyStatus("Copy Link"), 2000);
  };

  const generateBlob = async () => {
    if (!cardRef.current) return null;
    const html2canvas = (await import('html2canvas-pro')).default;
    const canvas = await html2canvas(cardRef.current, {
      scale: 3, 
      useCORS: true,
      backgroundColor: '#050505',
    });
    return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
  };

  const handleNativeShare = async () => {
    setLoading(true);
    try {
      const blob = await generateBlob();
      if (!blob) return;

      const file = new File([blob], 'twisted-story.png', { type: 'image/png' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        if (linkUrl) navigator.clipboard.writeText(linkUrl);
        await navigator.share({
          files: [file],
          title: 'Twisted Share',
          text: 'Send me an anonymous message! 🤫',
        });
      } else {
        alert("Sharing not supported on this device. Downloading image instead.");
        handleDownload();
      }
    } catch (e) {
      console.error("Share Error:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setLoading(true);
    try {
      const html2canvas = (await import('html2canvas-pro')).default;
      const canvas = await html2canvas(cardRef.current, {
        scale: 3,
        useCORS: true,
        backgroundColor: '#050505',
      });
      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = image;
      link.download = `twisted-story-${Date.now()}.png`;
      link.click();
    } catch (e) {
      console.error(e);
      alert("Failed to generate image");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4 grid grid-cols-1 lg:grid-cols-2 gap-12 items-start animate-in fade-in slide-in-from-bottom-4 duration-500 ">
      
      {/* --- LEFT: CONTROL PANEL --- */}
      <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl p-8 shadow-2xl order-2 lg:order-1">
        
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
          <span className="p-2 bg-emerald-500/20 rounded-xl text-emerald-400 text-xl">🎨</span>
          Story Studio
        </h2>

        <div className="space-y-6">
            
          {/* Link Input (Manual Mode) */}
            <div className="space-y-2">
                <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Paste Your Link</label>
                <div className="grid gap-2">
                    <input 
                        type="text" 
                        value={linkUrl}
                        onChange={(e) => setLinkUrl(e.target.value)} /* 👈 Allows manual typing */
                        placeholder="twst.fun/p/..."
                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-emerald-500/50 outline-none transition-all placeholder-gray-700 font-mono text-sm"
                    />
                    <button 
                        onClick={handleCopyLink}
                        className="bg-white/10 hover:bg-white/20 text-white font-bold px-4 p-4 rounded-xl transition-colors text-xs uppercase tracking-wider border border-white/5"
                    >
                        {copyStatus}
                    </button>
                </div>
                <p className="text-[10px] text-emerald-500/80">* Link auto-copied when you click Share.</p>
            </div>

            {/* Name Input */}
            <div className="space-y-2">
                <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Display Name</label>
                <input 
                    type="text" 
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Anonymous"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-emerald-500/50 outline-none transition-all placeholder-gray-700"
                />
            </div>

            {/* Upload Buttons */}
            <div className="grid grid-cols-2 gap-4">
                <div 
                    onClick={() => fileInputRefProfile.current?.click()}
                    className="cursor-pointer border border-dashed border-white/20 rounded-xl p-6 hover:bg-white/5 transition flex flex-col items-center justify-center gap-3 group bg-black/20"
                >
                    <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center group-hover:scale-110 transition shadow-lg shadow-purple-500/10 overflow-hidden relative">
                        {profileImage ? (
                          <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                          <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                        )}
                    </div>
                    <span className="text-xs text-gray-400 font-bold uppercase tracking-wide group-hover:text-white">Edit Profile</span>
                    <input type="file" ref={fileInputRefProfile} className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'profile')} />
                </div>

                <div 
                    onClick={() => fileInputRefCover.current?.click()}
                    className="cursor-pointer border border-dashed border-white/20 rounded-xl p-6 hover:bg-white/5 transition flex flex-col items-center justify-center gap-3 group bg-black/20"
                >
                    <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center group-hover:scale-110 transition shadow-lg shadow-blue-500/10 overflow-hidden relative">
                         {coverImage ? (
                          <img src={coverImage} alt="Cover" className="w-full h-full object-cover" />
                        ) : (
                          <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                         )}
                    </div>
                    <span className="text-xs text-gray-400 font-bold uppercase tracking-wide group-hover:text-white">Edit BG</span>
                    <input type="file" ref={fileInputRefCover} className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'cover')} />
                </div>
            </div>

            {/* Theme Selector */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Card Theme</label>
                    {coverImage && (
                        <button onClick={() => setCoverImage("")} className="text-[10px] text-red-400 hover:text-red-300">
                            Clear Background Image
                        </button>
                    )}
                </div>
                <div className="flex flex-wrap gap-2">
                    {THEMES.map((theme) => (
                        <button
                            key={theme.id}
                            onClick={() => { setActiveTheme(theme); setCoverImage(""); }}
                            style={{ background: theme.background }}
                            className={`px-4 py-2 rounded-xl text-xs font-bold text-white shadow-lg transition-all ${
                                activeTheme.id === theme.id && !coverImage
                                    ? 'ring-2 ring-emerald-500 ring-offset-2 ring-offset-[#0a0a0a] scale-105'
                                    : 'opacity-70 hover:opacity-100 hover:scale-105 border border-white/10'
                            }`}
                        >
                            {theme.name}
                        </button>
                    ))}
                </div>
            </div>

            <div className="h-px bg-white/10 my-4"></div>

            {/* Share Buttons */}
            <div className="space-y-3">
                <button 
                    onClick={handleNativeShare}
                    disabled={loading}
                    className="w-full py-4 bg-gradient-to-r from-[#FE2C55] to-[#25F4EE] rounded-xl font-bold text-white hover:shadow-[0_0_25px_rgba(254,44,85,0.4)] transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3 group"
                >
                    {loading ? (
                        <>
                           <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                           <span>Processing...</span>
                        </>
                    ) : (
                        <>
                           {/* INSTAGRAM ICON */}
                           <svg className="w-6 h-6 text-white group-hover:-rotate-12 transition-transform" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                           
                           {/* FACEBOOK ICON */}
                           <svg className="w-6 h-6 text-white group-hover:rotate-12 transition-transform" viewBox="0 0 24 24" fill="currentColor"><path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/></svg>
                           
                           <span>Share to Insta / FB</span>
                        </>
                    )}
                </button>
                
                <button 
                    onClick={handleDownload}
                    disabled={loading}
                    className="w-full py-3 bg-white/5 border border-white/10 rounded-xl font-bold text-gray-300 hover:bg-white/10 hover:text-white transition-all text-sm flex items-center justify-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                    Save to Gallery
                </button>
            </div>

            {/* Instagram Instructions */}
            <div className="mt-8 bg-blue-900/10 border border-blue-500/20 rounded-2xl p-5">
                <h3 className="text-blue-400 font-bold text-sm mb-3 flex items-center gap-2">
                    📱 How to post on Instagram Story
                </h3>
                <ul className="text-xs text-gray-400 space-y-2 font-medium">
                    <li className="flex items-start gap-2">
                        <span className="text-blue-500 font-bold">1.</span>
                        <span>Click <strong className="text-white">Save to Gallery</strong> to download your card.</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-blue-500 font-bold">2.</span>
                        <span>Open Instagram Story and select the saved card image.</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-blue-500 font-bold">3.</span>
                        <span>Tap the <strong>Sticker</strong> icon at the top and select <strong>🔗 Link</strong>.</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-blue-500 font-bold">4.</span>
                        <span>Paste your <strong>anonymous link</strong> and place it on the top box.</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-blue-500 font-bold">5.</span>
                        <span>Paste your <strong>public inbox link (twst.fun/p/...)</strong> and place it on the bottom box!</span>
                    </li>
                </ul>
            </div>

        </div>
      </div>


      {/* --- RIGHT: LIVE PREVIEW --- */}
      <div className="flex justify-center relative top-10 order-1 lg:order-2">
        
        <div className="relative group">
            {/* Ambient Glow */}
            <div className="absolute -inset-4 bg-gradient-to-b from-purple-900 to-indigo-900 rounded-[50px] blur-2xl opacity-30 group-hover:opacity-50 transition duration-700"></div>

            {/* --- ACTUAL CARD TO CAPTURE --- */}
            <div 
                ref={cardRef}
                className="relative w-[320px] h-[568px] bg-black rounded-[32px] overflow-hidden flex flex-col items-center text-center shadow-2xl border border-white/10"
                style={{
                    // --- THEME OR CUSTOM BACKGROUND ---
                    background: coverImage 
                      ? `url(${coverImage})` 
                      : activeTheme.background, 
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                }}
            >
                {/* Subtle Grain Overlay */}
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-30"></div>

                {/* Content Layer */}
                <div className="relative z-10 flex flex-col h-full w-full p-8">
                    
                    {/* Branding - Top */}
                    <div className="text-center mb-auto pt-2">
                        <h1 className="text-2xl font-black italic tracking-tighter text-white drop-shadow-md">
                            TWST.FUN
                        </h1>
                        <p className="text-[8px] font-mono text-white/70 tracking-[0.4em] uppercase mt-1">
                            Anonymous Inbox
                        </p>
                    </div>

                    {/* Center Content */}
                    <div className="flex flex-col items-center gap-3 my-auto w-full">
                        
                        {/* Profile Pic with Glow */}
                        <div className="relative mt-2">
                            <div className="w-20 h-20 rounded-full p-[3px] bg-white/90 relative z-10 shadow-xl">
                                <img 
                                    src={profileImage || `https://api.dicebear.com/9.x/identicon/svg?seed=${displayName || 'Twisted'}`} 
                                    className="w-full h-full rounded-full object-cover bg-black"
                                    crossOrigin="anonymous"
                                    alt="Profile"
                                />
                            </div>
                        </div>

                        {/* Name Tag */}
                        <div className="bg-white/10 px-5 py-1.5 rounded-full border border-white/10 shadow-lg backdrop-blur-md -mt-2 relative z-20">
                            <p className="text-xs font-bold text-white">
                                @{displayName || "Twisted Agent"}
                            </p>
                        </div>

                        {/* Glass Question Box */}
                        <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-5 rounded-3xl w-full shadow-lg relative overflow-hidden mt-1">
                            <h2 className="text-lg font-bold text-white leading-tight drop-shadow-md">
                                Send me a <br/> <span className="font-black text-xl text-emerald-300">SECRET MESSAGE</span>
                            </h2>
                            <p className="text-[9px] text-white/70 mt-2 font-bold tracking-wide uppercase bg-black/20 inline-block px-2 py-1 rounded">
                                🕵️ I won't know it's you
                            </p>
                        </div>

                    </div>

                    {/* Bottom CTA (TWO STICKER BOXES) */}
                    <div className="mt-auto pt-4 relative z-20 w-full flex flex-col items-center gap-3">
                         {/* Send Message Area */}
                         <div className="w-full flex flex-col items-center gap-1">
                             <p className="text-[9px] font-bold text-white uppercase tracking-widest drop-shadow-md">👇 Send Message Here</p>
                             <div className="bg-white/80 backdrop-blur-sm border-2 border-dashed border-white/50 rounded-xl shadow-lg w-full max-w-[240px] h-11 flex items-center justify-center">
                                 <span className="text-black/30 font-bold text-[10px] uppercase tracking-wider">Paste Link Sticker</span>
                             </div>
                         </div>
                            
                         {/* View Replies Area */}
                         <div className="w-full flex flex-col items-center gap-1">
                             <p className="text-[9px] font-bold text-emerald-300 uppercase tracking-widest drop-shadow-md">👇 View Replies Here</p>
                             <div className="bg-emerald-500/80 backdrop-blur-sm border-2 border-dashed border-emerald-300 rounded-xl shadow-lg w-full max-w-[240px] h-11 flex items-center justify-center">
                                 <span className="text-black/40 font-bold text-[10px] uppercase tracking-wider">Paste Link Sticker</span>
                             </div>
                         </div>
                    </div>

                </div>
            </div>
        </div>

      </div>
    </div>
  );
}