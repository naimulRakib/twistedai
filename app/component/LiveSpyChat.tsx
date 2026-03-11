'use client';

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useFingerprint } from '../utils/useFingerprint';
import { generateClientMasterId } from '../utils/clientMasterId';

interface ChatMessage {
  id: number;
  created_at: string;
  content: string;
  master_id: string;
  sender_name: string;
  creator_user_id: string | null;
}

interface Props {
  masterId: string;
  creatorId: string;
}

export default function SecureSpyChat({ masterId, creatorId }: Props) {

  const [accessStatus, setAccessStatus] = useState<'SCANNING' | 'GRANTED' | 'DENIED'>('SCANNING');
  const [isCreator, setIsCreator] = useState(false);
  const [adminUserId, setAdminUserId] = useState<string | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [onlineUsers, setOnlineUsers] = useState(0);
  const [debugLog, setDebugLog] = useState<string[]>([]);
  // Chat history: show/hide older messages
  const [showHistory, setShowHistory] = useState(false);
  const [historyMessages, setHistoryMessages] = useState<ChatMessage[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const { visitorId } = useFingerprint();
  const bottomRef = useRef<HTMLDivElement>(null);
  const isSendingRef = useRef(false); // Prevents double send

  const log = (msg: string) => setDebugLog(prev => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`]);

  // --- 1. ACCESS CONTROL ---
  useEffect(() => {
    if (!masterId || !creatorId) return;

    const verifyAccess = async () => {
      // A. Admin check
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        if (user.id.trim() === creatorId.trim()) {
          log('✅ Admin verified.');
          setIsCreator(true);
          setAdminUserId(user.id);
          setAccessStatus('GRANTED');
          return;
        } else {
          log('❌ Not admin.');
        }
      }

      // B. Target hardware check
      if (!visitorId || visitorId === 'Loading...') return;

      const nav = navigator as any;
      const getGPU = () => {
        try {
          const c = document.createElement('canvas');
          const gl = c.getContext('webgl') as WebGLRenderingContext | null;
          if (!gl) return 'Unknown GPU';
          const dbg = gl.getExtension('WEBGL_debug_renderer_info');
          return dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : 'Generic';
        } catch { return 'Blocked'; }
      };

      const rawData = {
        os_platform: nav.platform || 'Unknown',
        cpu_cores: nav.hardwareConcurrency || 0,
        ram_gb: nav.deviceMemory ? `~${nav.deviceMemory} GB` : 'Unknown',
        gpu: getGPU(),
        screen_res: `${window.screen.width}x${window.screen.height}`,
        pixel_ratio: window.devicePixelRatio || 1,
        city: 'Unknown', lat: '0', lon: '0', fingerPrint: visitorId,
        ip: 'Unknown', country: 'Unknown', isp: 'Unknown',
        battery_level: 'Unknown', is_charging: false,
        window_res: `${window.innerWidth}x${window.innerHeight}`,
        user_agent: nav.userAgent, browser_lang: nav.language,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        connection_type: 'Unknown', downlink_speed: 'Unknown',
        cookies_enabled: navigator.cookieEnabled,
        do_not_track: navigator.doNotTrack || 'No',
        color_depth: window.screen.colorDepth || 0,
        orientation: screen.orientation?.type || 'Unknown',
      };

      try {
        const currentDeviceHash = await generateClientMasterId(rawData);
        if (currentDeviceHash === masterId) {
          log('✅ Hardware match.');
          setAccessStatus('GRANTED');
        } else {
          log('❌ Hash mismatch.');
          setTimeout(() => setAccessStatus('DENIED'), 1500);
        }
      } catch {
        log('❌ Hash error.');
        setAccessStatus('DENIED');
      }
    };

    verifyAccess();
  }, [visitorId, masterId, creatorId]);

  // --- 2. REALTIME CHAT ---
  useEffect(() => {
    if (accessStatus !== 'GRANTED') return;

    const fetchMessages = async () => {
      const { data } = await supabase
        .from('live_chat')
        .select('*')
        .eq('master_id', masterId)
        .order('created_at', { ascending: false })
        .limit(50);
      if (data) setMessages(data.reverse() as ChatMessage[]);
    };
    fetchMessages();

    const channel = supabase.channel(`room:${masterId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'live_chat', filter: `master_id=eq.${masterId}`
      }, (payload) => {
        setMessages(prev => [...prev, payload.new as ChatMessage]);
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      })
      .on('presence', { event: 'sync' }, () => {
        setOnlineUsers(Object.keys(channel.presenceState()).length);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ online_at: new Date().toISOString() });
        }
      });

    return () => { supabase.removeChannel(channel); };
  }, [accessStatus, masterId]);

  // --- 3. LOAD CHAT HISTORY ---
  const loadHistory = async () => {
    if (loadingHistory) return;
    setLoadingHistory(true);
    try {
      const { data } = await supabase
        .from('live_chat')
        .select('*')
        .eq('master_id', masterId)
        .order('created_at', { ascending: false })
        .range(50, 200); // Messages beyond the first 50
      if (data) setHistoryMessages(data.reverse() as ChatMessage[]);
      setShowHistory(true);
    } catch (err) {
      console.error('History load error:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  // --- 4. SEND MESSAGE ---
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSendingRef.current || !newMessage.trim() || accessStatus !== 'GRANTED') return;

    isSendingRef.current = true;
    setIsSending(true);
    const text = newMessage.trim();
    setNewMessage('');

    try {
      await supabase.from('live_chat').insert([{
        content: text,
        master_id: masterId,
        sender_name: isCreator ? 'ADMIN' : 'TARGET',
        creator_user_id: isCreator ? adminUserId : null,
      }]);
    } catch (err) {
      console.error('Send error:', err);
      setNewMessage(text); // Restore on failure
    } finally {
      isSendingRef.current = false;
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSend(e as any);
  };

  // --- DENIED ---
  if (accessStatus === 'DENIED') return (
    <div className="min-h-screen bg-yellow-300 flex flex-col items-center justify-center p-4 font-sans">
      <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 sm:p-8 rounded-[30px] text-center max-w-sm w-full">
        <div className="text-5xl sm:text-6xl mb-4 animate-bounce">🚫</div>
        <h1 className="text-3xl sm:text-4xl font-black text-black mb-2 uppercase italic tracking-tighter">NOPE!</h1>
        <p className="text-black font-bold text-sm bg-red-300 border-2 border-black px-3 py-1 rounded-lg inline-block mb-4">
          Wrong Device Signature
        </p>
        <div className="bg-gray-100 border-2 border-dashed border-gray-400 p-3 rounded-xl text-left max-h-28 overflow-auto">
          <p className="text-[10px] font-bold text-gray-500 mb-1">LOGS:</p>
          {debugLog.map((l, i) => (
            <p key={i} className="text-[10px] text-red-500 font-mono leading-tight">{l}</p>
          ))}
        </div>
      </div>
    </div>
  );

  // --- SCANNING ---
  if (accessStatus === 'SCANNING') return (
    <div className="min-h-screen bg-blue-300 flex flex-col items-center justify-center font-sans">
      <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-8 sm:p-10 rounded-[40px] text-center animate-pulse">
        <div className="w-16 h-16 sm:w-20 sm:h-20 border-8 border-black border-t-blue-500 rounded-full animate-spin mx-auto mb-5" />
        <h2 className="text-xl sm:text-2xl font-black text-black uppercase tracking-tighter">Scanning...</h2>
        <p className="text-xs font-bold text-blue-600 mt-2 bg-blue-100 px-3 py-1 rounded-full border-2 border-blue-200">
          CHECKING BIOMETRICS
        </p>
      </div>
    </div>
  );

  // --- CHAT (GRANTED) ---
  return (
    <div className="fixed inset-0 h-[100dvh] w-full bg-[#fff0f5] flex flex-col font-sans overflow-hidden selection:bg-yellow-300 selection:text-black">

      {/* Dot Pattern */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

      {/* HEADER */}
      <div className="h-16 sm:h-20 bg-white border-b-4 border-black flex items-center justify-between px-4 sm:px-6 z-10 shrink-0">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full border-2 border-black shrink-0 ${onlineUsers > 1 ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
          <div className="min-w-0">
            <h1 className="text-lg sm:text-2xl font-black italic tracking-tighter text-black leading-none truncate">
              SECRET<span className="text-purple-500">CHAT</span>
            </h1>
            <div className="flex items-center gap-1 mt-0.5">
              <span className={`text-[9px] sm:text-[10px] font-black border-2 border-black px-2 py-0.5 rounded-full ${isCreator ? 'bg-black text-white' : 'bg-yellow-300 text-black'}`}>
                {isCreator ? 'BOSS' : 'TARGET'}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* History Button */}
          <button
            onClick={showHistory ? () => setShowHistory(false) : loadHistory}
            disabled={loadingHistory}
            className="text-[10px] font-black border-2 border-black px-3 py-1.5 rounded-full bg-purple-100 hover:bg-purple-200 transition active:scale-95 disabled:opacity-50"
          >
            {loadingHistory ? '...' : showHistory ? 'HIDE HISTORY' : '📜 HISTORY'}
          </button>
          <div className="text-right hidden sm:block">
            <p className="text-[10px] font-bold text-gray-400 uppercase">Online</p>
            <p className="text-lg font-black text-black">{onlineUsers}</p>
          </div>
        </div>
      </div>

      {/* MESSAGES AREA */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4 overscroll-contain">

        {/* History messages */}
        {showHistory && historyMessages.length > 0 && (
          <div className="space-y-4 border-b-2 border-dashed border-gray-300 pb-4 mb-2">
            <p className="text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">— Chat History —</p>
            {historyMessages.map((msg) => {
              const isMe = isCreator ? msg.sender_name === 'ADMIN' : msg.sender_name !== 'ADMIN';
              return (
                <div key={`h-${msg.id}`} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} opacity-60`}>
                  <div className={`max-w-[85%] px-4 py-2.5 text-sm font-bold border-2 border-black shadow-[3px_3px_0_rgba(0,0,0,0.5)] ${isMe ? 'bg-blue-300 text-black rounded-l-2xl rounded-tr-2xl rounded-br-none' : 'bg-gray-200 text-black rounded-r-2xl rounded-tl-2xl rounded-bl-none'}`}>
                    {msg.content}
                  </div>
                  <span className="text-[8px] font-bold text-gray-400 mt-0.5 mx-2">
                    {new Date(msg.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              );
            })}
            {historyMessages.length === 0 && (
              <p className="text-center text-xs text-gray-400 font-mono">No older messages found.</p>
            )}
          </div>
        )}

        {/* Live messages */}
        {messages.length === 0 && !showHistory && (
          <div className="h-full flex flex-col items-center justify-center opacity-50 min-h-[200px]">
            <div className="text-5xl sm:text-6xl mb-2">👻</div>
            <p className="font-black text-xl text-gray-400 uppercase tracking-widest">Ghost Town</p>
          </div>
        )}

        {messages.map((msg) => {
          const isMe = isCreator ? msg.sender_name === 'ADMIN' : msg.sender_name !== 'ADMIN';
          return (
            <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} animate-in slide-in-from-bottom-3 fade-in duration-200`}>
              <div className={`flex items-center gap-2 mb-1 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 border-black overflow-hidden shrink-0 ${isMe ? 'bg-blue-200' : 'bg-pink-200'}`}>
                  <img src={`https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${isMe ? 'me' : 'them'}`} alt="av" />
                </div>
                <span className="text-[10px] font-black text-gray-500 uppercase">{msg.sender_name}</span>
              </div>
              <div className={`
                max-w-[85%] px-4 py-2.5 text-sm font-bold border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
                ${isMe
                  ? 'bg-blue-400 text-white rounded-l-2xl rounded-tr-2xl rounded-br-none mr-2'
                  : 'bg-white text-black rounded-r-2xl rounded-tl-2xl rounded-bl-none ml-2'}
              `}>
                {msg.content}
              </div>
              <span className="text-[8px] font-bold text-gray-400 mt-1 mx-2">
                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* INPUT */}
      <div className="p-3 sm:p-4 bg-white border-t-4 border-black z-10 shrink-0">
        <form onSubmit={handleSend} className="flex gap-2 sm:gap-3">
          <input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isCreator ? 'Type...' : 'Type secret...'}
            disabled={isSending}
            className="flex-1 bg-gray-100 border-2 border-black rounded-xl px-4 py-3 font-bold text-black placeholder-gray-400 focus:outline-none focus:bg-yellow-100 focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-50 text-sm"
          />
          <button
            type="submit"
            disabled={isSending || !newMessage.trim()}
            className="px-4 sm:px-6 py-3 bg-black text-white font-black rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_#8b5cf6] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#8b5cf6] active:translate-y-[4px] active:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm whitespace-nowrap"
          >
            SEND
          </button>
        </form>
      </div>
    </div>
  );
}
