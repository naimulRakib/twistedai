'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useParams } from 'next/navigation'; 
import { useFingerprint } from '../utils/useFingerprint';
import { generateClientMasterId } from '../utils/clientMasterId'; 
import { supabase } from '@/lib/supabaseClient';
 
// --- TYPES ---
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
  
  // --- STATE ---
  const [accessStatus, setAccessStatus] = useState<'SCANNING' | 'GRANTED' | 'DENIED'>('SCANNING');
  const [isCreator, setIsCreator] = useState(false);
  const [adminUserId, setAdminUserId] = useState<string | null>(null);
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [onlineUsers, setOnlineUsers] = useState(0);
  const [debugLog, setDebugLog] = useState<string[]>([]); 

  const { visitorId } = useFingerprint();
  const bottomRef = useRef<HTMLDivElement>(null);

  const log = (msg: string) => setDebugLog(prev => [...prev, msg]);

  // --- 1. ACCESS CONTROL LOGIC ---
  useEffect(() => {
    if (!masterId || !creatorId) return;

    const verifyAccess = async () => {
      // A. ADMIN CHECK
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        if (user.id.trim() === creatorId.trim()) {
            log("✅ Admin ID Match.");
            setIsCreator(true);
            setAdminUserId(user.id);
            setAccessStatus('GRANTED');
            return;
        } else {
            log("❌ ID Mismatch.");
        }
      }

      // B. TARGET CHECK
      if (!visitorId || visitorId === 'Loading...') return;
      
      if (typeof window !== 'undefined') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const nav = navigator as any;

        const getGPU = () => {
          try {
            const c = document.createElement('canvas');
            const gl = c.getContext('webgl');
            if(!gl) return 'Unknown GPU';
            // @ts-ignore
            const dbg = gl.getExtension('WEBGL_debug_renderer_info');
            // @ts-ignore
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
          window_res: '0x0', color_depth: 0, orientation: 'Unknown', 
          user_agent: nav.userAgent, browser_lang: nav.language, 
          timezone: 'Unknown', cookies_enabled: false, do_not_track: 'No', 
          connection_type: 'Unknown', downlink_speed: 'Unknown'
        };

        try {
          const currentDeviceHash = await generateClientMasterId(rawData);
          
          if (currentDeviceHash === masterId) {
            log("✅ Hardware Match.");
            setAccessStatus('GRANTED');
          } else {
            log("❌ Hash Mismatch.");
            setTimeout(() => setAccessStatus('DENIED'), 2000);
          }
        } catch (e: any) {
          log("❌ Error.");
          setAccessStatus('DENIED');
        }
      }
    };

    verifyAccess();
  }, [visitorId, masterId, creatorId, supabase]);


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
            event: 'INSERT', 
            schema: 'public', 
            table: 'live_chat', 
            filter: `master_id=eq.${masterId}` 
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


  // --- 3. SEND MESSAGE ---
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || accessStatus !== 'GRANTED') return;

    const text = newMessage;
    setNewMessage("");

    await supabase.from('live_chat').insert([{
        content: text,
        master_id: masterId,
        sender_name: isCreator ? "ADMIN" : "TARGET",
        creator_user_id: isCreator ? adminUserId : null 
    }]);
  };

  // --- 4. CARTOON UI RENDER ---

  // STATE: DENIED
  if (accessStatus === 'DENIED') return (
    <div className="min-h-screen bg-yellow-300 flex flex-col items-center justify-center p-4 font-sans">
        <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-8 rounded-[30px] text-center max-w-md transform rotate-1">
            <div className="text-6xl mb-4 animate-bounce">🚫</div>
            <h1 className="text-4xl font-black text-black mb-2 uppercase italic tracking-tighter">NOPE!</h1>
            <p className="text-black font-bold text-sm bg-red-300 border-2 border-black px-3 py-1 rounded-lg inline-block mb-4">
                Wrong Device Signature
            </p>
            <div className="bg-gray-100 border-2 border-dashed border-gray-400 p-3 rounded-xl text-left max-h-32 overflow-auto">
                <p className="text-[10px] font-bold text-gray-500 mb-1">LOGS:</p>
                {debugLog.map((l, i) => (
                    <p key={i} className="text-[10px] text-red-500 font-mono leading-tight">{l}</p>
                ))}
            </div>
        </div>
    </div>
  );

  // STATE: SCANNING
  if (accessStatus === 'SCANNING') return (
    <div className="min-h-screen bg-blue-300 flex flex-col items-center justify-center font-sans">
        <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-10 rounded-[40px] text-center animate-pulse">
            <div className="w-20 h-20 border-8 border-black border-t-blue-500 rounded-full animate-spin mx-auto mb-6"></div>
            <h2 className="text-2xl font-black text-black uppercase tracking-tighter">Scanning...</h2>
            <p className="text-xs font-bold text-blue-600 mt-2 bg-blue-100 px-3 py-1 rounded-full border-2 border-blue-200">
                CHECKING BIOMETRICS
            </p>
        </div>
    </div>
  );

  // STATE: CHAT (GRANTED)
  return (
    // FIX: Changed from h-screen to fixed inset-0 h-[100dvh] to lock scrolling on mobile
    <div className="fixed inset-0 h-[100dvh] w-full bg-[#fff0f5] flex flex-col font-sans overflow-hidden relative selection:bg-yellow-300 selection:text-black">
        
        {/* Fun Background Pattern */}
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '20px 20px'}}></div>

        {/* HEADER */}
        <div className="h-20 bg-white border-b-4 border-black flex items-center justify-between px-6 z-10 shadow-sm shrink-0">
            <div className="flex items-center gap-3">
                <div className={`w-4 h-4 rounded-full border-2 border-black ${onlineUsers > 1 ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
                <div>
                    <h1 className="text-2xl font-black italic tracking-tighter text-black leading-none">
                        SECRET<span className="text-purple-500">CHAT &nbsp; <sup className='text-black'>twst.fun</sup></span>
                    </h1>
                    <div className="flex items-center gap-1 mt-1">
                        <span className={`text-[10px] font-black border-2 border-black px-2 py-0.5 rounded-full ${isCreator ? 'bg-black text-white' : 'bg-yellow-300 text-black'}`}>
                            {isCreator ? 'BOSS MODE' : 'TARGET MODE'}
                        </span>
                    </div>
                </div>
            </div>
            <div className="text-right hidden sm:block">
                <p className="text-[10px] font-bold text-gray-400 uppercase">Active Users</p>
                <p className="text-xl font-black text-black">{onlineUsers}</p>
            </div>
        </div>

        {/* MESSAGES AREA */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 relative z-0 overscroll-contain">
            {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center opacity-50">
                    <div className="text-6xl mb-2">👻</div>
                    <p className="font-black text-xl text-gray-400 uppercase tracking-widest">Ghost Town</p>
                </div>
            )}
            
            {messages.map((msg) => {
                const isMe = isCreator ? msg.sender_name === 'ADMIN' : msg.sender_name !== 'ADMIN';
                return (
                    <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} animate-in slide-in-from-bottom-4 fade-in duration-300`}>
                        <div className={`flex items-center gap-2 mb-1 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                            <div className={`w-6 h-6 rounded-full border-2 border-black overflow-hidden ${isMe ? 'bg-blue-200' : 'bg-pink-200'}`}>
                                <img src={`https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${isMe ? 'me' : 'them'}`} alt="av" />
                            </div>
                            <span className="text-[10px] font-black text-gray-500 uppercase">{msg.sender_name}</span>
                        </div>
                        <div className={`
                            relative max-w-[85%] px-5 py-3 text-sm font-bold border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
                            ${isMe 
                                ? 'bg-blue-400 text-white rounded-l-2xl rounded-tr-2xl rounded-br-none mr-2' 
                                : 'bg-white text-black rounded-r-2xl rounded-tl-2xl rounded-bl-none ml-2'}
                        `}>
                            {msg.content}
                        </div>
                        <span className="text-[8px] font-bold text-gray-400 mt-1 mx-2">
                            {new Date(msg.created_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                        </span>
                    </div>
                );
            })}
            <div ref={bottomRef} />
        </div>

        {/* INPUT AREA */}
        <div className="p-4 bg-white border-t-4 border-black z-10 shrink-0 pb-safe">
            <form onSubmit={handleSend} className="flex gap-3">
                <input 
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={isCreator ? "Type..." : "Type secret..."}
                    className="flex-1 bg-gray-100 border-2 border-black rounded-xl px-5 py-3 font-bold text-black placeholder-gray-400 focus:outline-none focus:bg-yellow-100 focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
                />
                <button 
                    className="px-6 bg-black text-white font-black rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_#8b5cf6] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#8b5cf6] active:translate-y-[4px] active:shadow-none transition-all"
                >
                    SEND
                </button>
            </form>
        </div>
    </div>
  );
}