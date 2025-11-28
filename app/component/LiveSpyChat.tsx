'use client';

import React, { useState, useEffect, useRef } from 'react';

import { useParams } from 'next/navigation'; 
import { useFingerprint } from '../utils/useFingerprint';
import { generateClientMasterId } from '../utils/clientMasterId'; 
import { supabase } from '@/lib/supabaseClient';

interface ExtendedNavigator {
  connection?: { effectiveType: string; downlink?: number; };
  deviceMemory?: number;
  getBattery?: () => Promise<{ level: number; charging: boolean }>;
}

interface ChatMessage {
  id: number;
  created_at: string;
  content: string;
  master_id: string;
  sender_name: string;
  creator_user_id: string | null; // Added to match the DB
}

export default function SecureSpyChat() {

  const params = useParams();
  const targetId = params.targetId as string; 

  // --- STATE ---
  const [accessStatus, setAccessStatus] = useState<'SCANNING' | 'GRANTED' | 'DENIED'>('SCANNING');
  const [isCreator, setIsCreator] = useState(false);
  const [adminUserId, setAdminUserId] = useState<string | null>(null); // Holds Admin's UUID if logged in
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [onlineUsers, setOnlineUsers] = useState(0);
  
  const { visitorId } = useFingerprint();
  const bottomRef = useRef<HTMLDivElement>(null);

  
  // --- 1. THE GATEKEEPER (Security Check) ---
  useEffect(() => {
    if (!targetId || visitorId === 'Loading...') return;

    const checkAccess = async () => {
      
      const { data: { user } } = await supabase.auth.getUser();
      
      // Data needed for hash comparison
      const nav = navigator as any
      const getGPU = () => { /* ... */ return 'Generic'; }; // Simplified
      const rawData = { /* ... full spy data structure ... */ gpu: getGPU(), cpu_cores: nav.hardwareConcurrency || 0, ram_gb: nav.deviceMemory ? `~${nav.deviceMemory} GB` : 'Unknown', screen_res: `${window.screen.width}x${window.screen.height}`, pixel_ratio: window.devicePixelRatio || 1, os_platform: nav.platform || 'Unknown' };

      // Generate the Master ID for THIS device
      const myCalculatedId = await generateClientMasterId(rawData);

      // 2. DUAL ACCESS CHECK
      
      // A. Check 1: Is the user logged in as the Admin (Creator)?
      if (user) {
        setIsCreator(true);
        setAdminUserId(user.id);
        setAccessStatus('GRANTED');
        return;
      }
      
      // B. Check 2: Does my calculated hardware hash match the required target ID?
      if (myCalculatedId === targetId) {
        setAccessStatus('GRANTED');
        return;
      } 
      
      // C. Deny
      setTimeout(() => setAccessStatus('DENIED'), 2000);
    };

    checkAccess();
  }, [visitorId, targetId, supabase]);


  // --- 2. REALTIME CHAT & PRESENCE ---
  useEffect(() => {
    if (accessStatus !== 'GRANTED' || !targetId) return;

    // Load History
    const loadHistory = async () => {
      const { data } = await supabase
        .from('live_chat')
        .select('*')
        .eq('master_id', targetId)
        .order('created_at', { ascending: false })
        .limit(50);
      if (data) setMessages(data.reverse() as ChatMessage[]);
    };
    loadHistory();

    const channel = supabase.channel(`room:${targetId}`);

    channel
      .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'live_chat',
          filter: `master_id=eq.${targetId}` 
      }, (payload) => {
        const newMsg = payload.new as ChatMessage;
        setMessages((prev) => [...prev, newMsg]);
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
      })
      .on('presence', { event: 'sync' }, () => {
         const state = channel.presenceState();
         setOnlineUsers(Object.keys(state).length);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ online_at: new Date().toISOString() });
        }
      });

    return () => { supabase.removeChannel(channel); };
  }, [accessStatus, targetId]);


  // --- 3. SEND MESSAGE (FIXED INSERT) ---
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || accessStatus !== 'GRANTED') return;

    const senderRole = isCreator ? "ADMIN" : "TARGET";
    
    // 🛑 The Fix: Insert Admin UUID only if they are the Creator
    const { error } = await supabase.from('live_chat').insert([{
        content: newMessage,
        master_id: targetId,
        sender_name: senderRole,
        creator_user_id: isCreator ? adminUserId : null, // <--- Correctly sets Admin UUID or NULL
    }]);

    if (error) console.error("Send failed:", error);
    setNewMessage("");
  };


  // --- RENDER STATES (Unchanged UI) ---

  if (accessStatus === 'DENIED') {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center font-mono text-red-500 p-6 text-center animate-in fade-in duration-1000">
        <div className="w-24 h-24 border-4 border-red-600 rounded-full flex items-center justify-center mb-8 animate-pulse shadow-[0_0_50px_rgba(220,38,38,0.5)]">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
        </div>
        <h1 className="text-4xl font-black mb-2 tracking-tighter">ACCESS DENIED!</h1>
        <p className="text-xs text-red-400/50 font-bold tracking-[0.3em] mb-8">GO BACK, NEVER COME AGAIN</p>
        <div className="bg-red-900/10 border border-red-900/50 p-4 rounded-xl max-w-xs">
            <p className="text-[10px] text-gray-500">
               SYSTEM NOTE: Your Device ID does not match the authorized target signature for this secure channel. This attempt has been logged.
            </p>
        </div>
      </div>
    );
  }

  if (accessStatus === 'SCANNING') {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center font-mono">
        <div className="relative w-16 h-16 mb-6">
             <div className="absolute inset-0 rounded-full border-2 border-green-500 border-t-transparent animate-spin"></div>
             <div className="absolute inset-3 rounded-full border-2 border-green-800 border-b-transparent animate-[spin_1s_linear_infinite_reverse]"></div>
        </div>
        <p className="text-green-500 text-xs tracking-[0.3em] animate-pulse">VERIFYING BIOMETRICS...</p>
      </div>
    );
  }

  // --- CHAT INTERFACE ---
  return (
    <div className="min-h-screen bg-[#050505] text-green-500 font-mono flex flex-col">
        
        {/* Header */}
        <header className="h-16 border-b border-green-900/30 bg-black/50 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-20">
            <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_#22c55e]"></div>
                <div>
                    <h2 className="font-bold text-sm tracking-wider">SECURED CHAT</h2>
                    <p className="text-[8px] text-green-800">CHANNEL ON</p>
                </div>
            </div>
            <div className="text-right">
                <p className="text-[9px] text-gray-500">STATUS</p>
                <p className="text-[10px] text-green-400 font-bold">
                    {onlineUsers > 1 ? `${onlineUsers} ONLINE` : 'WAITING FOR TARGET...'}
                </p>
            </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
            {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center opacity-30">
                    <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
                    <p className="text-xs">EMPTY</p>
                </div>
            )}

            {messages.map((msg) => {
                // Determine if message is mine: True if Admin sending, OR if Target sending (sender_name !== 'ADMIN')
                const isMe = isCreator ? msg.sender_name === 'ADMIN' : msg.sender_name !== 'ADMIN';
                
                return (
                    <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} animate-in slide-in-from-bottom-2 duration-300`}>
                        <div className={`
                            max-w-[85%] px-4 py-3 rounded-lg text-xs border shadow-lg
                            ${isMe 
                                ? 'bg-green-900/20 border-green-500/40 text-green-100 rounded-tr-none' 
                                : 'bg-[#111] border-gray-800 text-gray-400 rounded-tl-none'}
                        `}>
                            {msg.content}
                        </div>
                        <span className="text-[8px] text-gray-700 mt-1 uppercase tracking-wider">
                            {msg.sender_name} • {new Date(msg.created_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                        </span>
                    </div>
                );
            })}
            <div ref={bottomRef} />
        </div>

        {/* Input Area */}
        <form onSubmit={handleSend} className="p-4 bg-black border-t border-green-900/30 sticky bottom-0 z-20">
            <div className="flex gap-2 relative group">
                <div className="absolute -inset-0.5 bg-green-500/20 rounded-lg blur opacity-0 group-focus-within:opacity-100 transition duration-500"></div>
                <input 
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={isCreator ? "Send text..." : "Type message..."}
                    className="relative flex-1 bg-[#0a0a0a] border border-green-900/50 rounded-lg px-4 py-3 text-green-400 font-mono text-sm focus:outline-none focus:border-green-500 transition-all placeholder-green-900/50"
                />
                <button 
                    type="submit"
                    className="relative px-6 bg-green-900/20 border border-green-500/50 text-green-400 font-bold rounded-lg hover:bg-green-500 hover:text-black transition-all uppercase text-xs tracking-widest"
                >
                    SEND
                </button>
            </div>
        </form>

    </div>
  );
}