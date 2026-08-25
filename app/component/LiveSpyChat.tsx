'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useFingerprint } from '../utils/useFingerprint';
import { generateClientMasterId } from '../utils/clientMasterId';
import { generateSlug } from '../utils/generateSlug';

// ─── Types ────────────────────────────────────────────────────────────────────
interface ChatMessage {
  id: number;
  created_at: string;
  content: string;
  master_id: string;
  sender_name: string;
  creator_user_id: string | null;
}

interface Props {
  messageId: string;
  creatorId: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Detect FB / Messenger / Instagram in-app browser */
function isInAppBrowser(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  return /FBAN|FBAV|Instagram|LinkedInApp|Musical_ly|FB_IAB|FBIOS/i.test(ua);
}

/** True if running on Android */
function isAndroidDevice(): boolean {
  return /android/i.test(navigator.userAgent || '');
}

/** Build an Android intent: URL that forces Chrome */
function buildChromeIntent(url: string): string {
  const clean = url.replace(/^https?:\/\//, '');
  return `intent://${clean}#Intent;scheme=https;package=com.android.chrome;end`;
}

/** Render text with clickable hyperlinks */
function renderLinks(text: string): React.ReactNode[] {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  // re-create the regex to avoid stale lastIndex
  const testRegex = /(https?:\/\/[^\s]+)/;
  return parts.map((part, i) => {
    if (testRegex.test(part)) {
      return (
        <a
          key={i}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="underline text-cyan-400 hover:text-cyan-300 break-all"
          onClick={e => e.stopPropagation()}
        >
          {part}
        </a>
      );
    }
    return part;
  });
}

// ─── In-App Browser Wall (no bypass) ─────────────────────────────────────────
function BrowserWall() {
  const [url, setUrl] = useState('');
  const android = isAndroidDevice();

  useEffect(() => { setUrl(window.location.href); }, []);

  return (
    <div className="fixed inset-0 z-[9999] bg-[#030303] flex flex-col items-center justify-center p-6 text-center font-sans">
      <div className="w-20 h-20 bg-white/10 rounded-3xl flex items-center justify-center mb-6 animate-bounce shadow-lg shadow-emerald-500/20">
        <span className="text-4xl">{android ? '🌏' : '🧭'}</span>
      </div>
      <h1 className="text-3xl font-black text-white mb-3 tracking-tight">Open in Browser</h1>
      <p className="text-gray-400 mb-8 max-w-xs text-sm leading-relaxed">
        This feature requires a real browser.<br />
        FB / Messenger browser is <strong className="text-red-400">not supported</strong>.
      </p>
      {android ? (
        <a
          href={buildChromeIntent(url)}
          className="w-full max-w-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-xl shadow-xl shadow-emerald-900/20 transition-transform active:scale-95 flex items-center justify-center gap-3 border border-emerald-400/20"
        >
          <span>Open in Chrome</span>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
          </svg>
        </a>
      ) : (
        <div className="bg-[#111] p-6 rounded-2xl border border-white/10 space-y-4 max-w-sm w-full text-left shadow-2xl">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center font-bold text-sm shrink-0 text-white">1</div>
            <p className="text-sm text-gray-300">Tap the <span className="font-bold text-white">3 dots (...)</span> in the top corner.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center font-bold text-sm shrink-0 text-white">2</div>
            <p className="text-sm text-gray-300">Select <span className="font-bold text-white">&quot;Open in Browser&quot;</span>.</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Chat Component ───────────────────────────────────────────────────────
export default function SecureSpyChat({ messageId, creatorId }: Props) {

  // ── State ──────────────────────────────────────────────────────────────────
  const [browserBlocked, setBrowserBlocked]         = useState(false);
  const [accessStatus, setAccessStatus]             = useState<'SCANNING' | 'GRANTED' | 'DENIED'>('SCANNING');
  const [isCreator, setIsCreator]                   = useState(false);
  const [adminUserId, setAdminUserId]               = useState<string | null>(null);
  const [creatorUsername, setCreatorUsername]       = useState<string>('CREATOR');
  const [senderName, setSenderName]                 = useState<string>('SENDER');
  const [masterId, setMasterId]                     = useState<string>(''); // Extracted from message
  const [messages, setMessages]                     = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage]                 = useState('');
  const [onlineUsers, setOnlineUsers]               = useState(0);
  const [debugLog, setDebugLog]                     = useState<string[]>([]);
  const [showHistory, setShowHistory]               = useState(false);
  const [historyMessages, setHistoryMessages]       = useState<ChatMessage[]>([]);
  const [loadingHistory, setLoadingHistory]         = useState(false);
  const [isSending, setIsSending]                   = useState(false);
  const [shortLink, setShortLink]                   = useState('');
  const [creatingShortLink, setCreatingShortLink]   = useState(false);
  const [shortLinkCopied, setShortLinkCopied]       = useState(false);

  const { visitorId } = useFingerprint();
  const bottomRef     = useRef<HTMLDivElement>(null);
  const isSendingRef  = useRef(false);

  const log = useCallback((msg: string) =>
    setDebugLog(prev => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`]), []);

  // ── 0. Detect in-app browser immediately ──────────────────────────────────
  useEffect(() => {
    if (isInAppBrowser()) setBrowserBlocked(true);
  }, []);

  // ── 1. Fetch creator's real username from profiles ─────────────────────────
  useEffect(() => {
    const fetchCreator = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', creatorId)
        .single();
      if (data?.username) setCreatorUsername(data.username);
    };
    fetchCreator();
  }, [creatorId]);

  // ── 2. ACCESS CONTROL (hard lock, no bypass) ───────────────────────────────
  useEffect(() => {
    if (!messageId || !creatorId) return;

    const verifyAccess = async () => {
      // Step 1: Fetch the original message to get the device hash (master_id) and alias
      const { data: msgRow, error: msgError } = await supabase
        .from('messages')
        .select('spy, author_name')
        .eq('id', messageId)
        .single();
      
      if (msgError || !msgRow || !msgRow.spy?.masterId) {
        log('❌ Message or device hash not found.');
        setAccessStatus('DENIED');
        return;
      }
      
      const targetMasterId = msgRow.spy.masterId;
      setMasterId(targetMasterId);
      if (msgRow.author_name) setSenderName(msgRow.author_name);

      // Step 2: Creator check — must be authenticated AND match creatorId
      const { data: { user } } = await supabase.auth.getUser();
      if (user && user.id.trim() === creatorId.trim()) {
        log('✅ Creator identity confirmed.');
        setIsCreator(true);
        setAdminUserId(user.id);
        setAccessStatus('GRANTED');
        return; // Creator bypasses biometric check
      }

      // Step 3: Sender biometric check — wait for FingerprintJS
      if (!visitorId || visitorId === 'Loading...') return;

      const nav = navigator as Navigator & {
        hardwareConcurrency?: number;
        deviceMemory?: number;
      };

      const getGPU = (): string => {
        try {
          const c = document.createElement('canvas');
          const gl = c.getContext('webgl') as WebGLRenderingContext | null;
          if (!gl) return 'Unknown GPU';
          const dbg = gl.getExtension('WEBGL_debug_renderer_info');
          return dbg ? String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL)) : 'Generic';
        } catch { return 'Blocked'; }
      };

      const rawData = {
        os_platform: navigator.platform || 'Unknown',
        cpu_cores:   nav.hardwareConcurrency || 0,
        ram_gb:      nav.deviceMemory ? `~${nav.deviceMemory} GB` : 'Unknown',
        gpu:         getGPU(),
        screen_res:  `${window.screen.width}x${window.screen.height}`,
        pixel_ratio: window.devicePixelRatio || 1,
        fingerPrint: visitorId,
      };

      try {
        const currentDeviceHash = await generateClientMasterId(rawData);
        if (currentDeviceHash === targetMasterId) {
          log('✅ Biometric fingerprint matched — access granted.');
          setAccessStatus('GRANTED');
        } else {
          log(`❌ Hash mismatch. Expected: ${targetMasterId.substring(0, 8)}... Got: ${currentDeviceHash.substring(0, 8)}...`);
          setAccessStatus('DENIED');
        }
      } catch (err) {
        log('❌ Hash error: ' + String(err));
        setAccessStatus('DENIED');
      }
    };

    verifyAccess();
  }, [visitorId, messageId, creatorId, log]);

  // ── 3. REALTIME CHAT ──────────────────────────────────────────────────────
  useEffect(() => {
    if (accessStatus !== 'GRANTED') return;

    const fetchMessages = async () => {
      const { data } = await supabase
        .from('live_chat')
        .select('*')
        .eq('master_id', messageId) // use messageId as the chat room identifier
        .order('created_at', { ascending: false })
        .limit(50);
      if (data) setMessages(data.reverse() as ChatMessage[]);
    };
    fetchMessages();

    const channel = supabase.channel(`room:${messageId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'live_chat',
        filter: `master_id=eq.${messageId}`,
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
  }, [accessStatus, messageId]);

  // ── 4. LOAD HISTORY ───────────────────────────────────────────────────────
  const loadHistory = async () => {
    if (loadingHistory) return;
    setLoadingHistory(true);
    try {
      const { data } = await supabase
        .from('live_chat')
        .select('*')
        .eq('master_id', messageId)
        .order('created_at', { ascending: false })
        .range(50, 200);
      if (data) setHistoryMessages(data.reverse() as ChatMessage[]);
      setShowHistory(true);
    } catch (err) {
      console.error('History load error:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  // ── 5. SEND MESSAGE ───────────────────────────────────────────────────────
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSendingRef.current || !newMessage.trim() || accessStatus !== 'GRANTED') return;

    isSendingRef.current = true;
    setIsSending(true);
    const text = newMessage.trim();
    setNewMessage('');

    try {
      await supabase.from('live_chat').insert([{
        content:         text,
        master_id:       messageId,
        sender_name:     isCreator ? creatorUsername.toUpperCase() : senderName.toUpperCase(),
        creator_user_id: isCreator ? adminUserId : null,
      }]);
    } catch (err) {
      console.error('Send error:', err);
      setNewMessage(text);
    } finally {
      isSendingRef.current = false;
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSend(e as unknown as React.FormEvent);
  };

  // ── 6. CREATE SHORT LINK FOR THIS CHATROOM ────────────────────────────────
  const handleCreateShortLink = async () => {
    if (creatingShortLink || shortLink) return;
    setCreatingShortLink(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const slug = generateSlug(6);
      const fullChatroomUrl = `${window.location.origin}/live/${messageId}/${creatorId}`;

      await supabase.from('short_links').insert({
        slug,
        original_url: fullChatroomUrl,
        creator_id:   user?.id ?? null,
      });

      setShortLink(`${window.location.origin}/s/${slug}`);
    } catch (err) {
      console.error('Short link error:', err);
    } finally {
      setCreatingShortLink(false);
    }
  };

  const copyShortLink = () => {
    navigator.clipboard.writeText(shortLink).catch(() => {});
    setShortLinkCopied(true);
    setTimeout(() => setShortLinkCopied(false), 2000);
  };

  // ── RENDER GUARDS ─────────────────────────────────────────────────────────

  if (browserBlocked) return <BrowserWall />;

  if (accessStatus === 'DENIED') return (
    <div className="min-h-screen bg-[#030303] flex flex-col items-center justify-center p-6 font-sans">
      <div className="bg-[#0a0a0a] border-2 border-red-500/30 shadow-[0_0_60px_rgba(239,68,68,0.1)] p-8 rounded-3xl text-center max-w-sm w-full animate-in zoom-in-95 duration-300">
        <div className="text-5xl mb-5 animate-bounce">🚫</div>
        <h1 className="text-2xl font-black text-white mb-2 uppercase italic tracking-tighter">Access Denied</h1>
        <p className="text-red-400 font-bold text-sm bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-lg inline-block mb-5">
          Device fingerprint mismatch
        </p>
        <p className="text-gray-500 text-xs leading-relaxed mb-5">
          This room is locked to a specific device. Only the original message sender can enter.
        </p>
        <div className="bg-black/60 border border-white/5 p-3 rounded-xl text-left max-h-28 overflow-auto">
          <p className="text-[10px] font-bold text-gray-600 mb-1 uppercase tracking-widest">Debug Log:</p>
          {debugLog.map((l, i) => (
            <p key={i} className="text-[10px] text-red-500 font-mono leading-tight">{l}</p>
          ))}
        </div>
      </div>
    </div>
  );

  if (accessStatus === 'SCANNING') return (
    <div className="min-h-screen bg-[#030303] flex flex-col items-center justify-center font-sans">
      <div className="bg-[#0a0a0a] border border-white/10 shadow-2xl p-10 rounded-[40px] text-center animate-in fade-in zoom-in-95 duration-500">
        <div className="relative w-16 h-16 mx-auto mb-6">
          <div className="absolute inset-0 rounded-full border-2 border-emerald-500/20 border-t-emerald-500 animate-[spin_1.5s_linear_infinite]" />
          <div className="absolute inset-2 rounded-full border-2 border-cyan-500/20 border-b-cyan-500 animate-[spin_1s_linear_infinite_reverse]" />
          <div className="absolute inset-0 flex items-center justify-center text-xl">🔬</div>
        </div>
        <h2 className="text-xl font-black text-white uppercase tracking-tighter mb-2">Scanning Device</h2>
        <p className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20">
          Verifying biometric fingerprint…
        </p>
        <p className="text-[10px] text-gray-600 mt-3 font-mono">This may take 2–3 seconds</p>
      </div>
    </div>
  );

  // ── CHAT (GRANTED) ────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 h-[100dvh] w-full bg-[#0b0b0f] flex flex-col font-sans overflow-hidden selection:bg-yellow-300 selection:text-black">

      {/* Subtle dot pattern */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

      {/* ── HEADER ──────────────────────────────────────────────────────── */}
      <div className="relative z-10 bg-[#0f0f14]/95 backdrop-blur-md border-b border-white/10 px-4 py-3 flex items-center justify-between gap-3 shrink-0">

        {/* Left: identity */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="shrink-0 relative">
            <img
              src={`https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${isCreator ? creatorUsername : senderName}`}
              alt="avatar"
              className="w-10 h-10 rounded-xl border-2 border-white/10 bg-black"
            />
            <span className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-[#0f0f14] ${onlineUsers > 1 ? 'bg-green-400 animate-pulse' : 'bg-yellow-400'}`} />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-black text-white leading-none tracking-tight truncate">
              {isCreator ? (
                <><span className="text-emerald-400">@{creatorUsername}</span>&nbsp;<span className="text-gray-500 text-xs font-normal">(You)</span></>
              ) : (
                <><span className="text-yellow-300">{senderName}</span>&nbsp;<span className="text-gray-500 text-xs font-normal">(Sender)</span></>
              )}
            </h1>
            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
              <span className={`text-[9px] font-black border px-1.5 py-0.5 rounded-full ${isCreator ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-yellow-300/20 text-yellow-300 border-yellow-300/30'}`}>
                {isCreator ? '👑 CREATOR' : '🎭 SENDER'}
              </span>
              <span className="text-[9px] text-gray-600 font-mono hidden sm:block">
                {masterId.substring(0, 8)}…
              </span>
            </div>
          </div>
        </div>

        {/* Right: online + history */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 bg-black/40 border border-white/10 px-2.5 py-1.5 rounded-xl">
            <span className={`w-2 h-2 rounded-full shrink-0 ${onlineUsers > 1 ? 'bg-green-400 animate-pulse' : 'bg-gray-600'}`} />
            <span className="text-[10px] font-black text-white">{onlineUsers}</span>
            <span className="text-[9px] text-gray-500 uppercase tracking-wider">online</span>
          </div>
          <button
            onClick={showHistory ? () => setShowHistory(false) : loadHistory}
            disabled={loadingHistory}
            className="text-[10px] font-black border border-white/10 px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 transition active:scale-95 disabled:opacity-50 text-gray-300"
          >
            {loadingHistory ? '…' : showHistory ? '✕' : '📜'}
          </button>
        </div>
      </div>

      {/* ── Short Link Bar (creator only) ─────────────────────────────── */}
      {isCreator && (
        <div className="relative z-10 bg-[#09090e] border-b border-white/5 px-4 py-2 flex items-center gap-3 shrink-0">
          <span className="text-[9px] text-gray-600 uppercase tracking-widest font-bold whitespace-nowrap shrink-0">⚡ Share Room:</span>
          {shortLink ? (
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <code className="text-[10px] text-emerald-400 font-mono truncate flex-1">{shortLink}</code>
              <button
                onClick={copyShortLink}
                className={`shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-lg border transition ${
                  shortLinkCopied
                    ? 'bg-emerald-500 text-black border-emerald-500'
                    : 'bg-white/5 hover:bg-white/10 border-white/10 text-gray-300'
                }`}
              >
                {shortLinkCopied ? '✓ Copied' : 'Copy'}
              </button>
            </div>
          ) : (
            <button
              onClick={handleCreateShortLink}
              disabled={creatingShortLink}
              className="text-[10px] font-bold text-cyan-400 border border-cyan-500/20 bg-cyan-500/5 hover:bg-cyan-500/15 px-3 py-1 rounded-lg transition disabled:opacity-50"
            >
              {creatingShortLink ? 'Creating…' : 'Generate Short Link'}
            </button>
          )}
        </div>
      )}

      {/* ── MESSAGES AREA ────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 overscroll-contain">

        {/* History */}
        {showHistory && (
          <div className="space-y-3 border-b border-dashed border-white/10 pb-4 mb-2">
            <p className="text-center text-[10px] font-bold text-gray-600 uppercase tracking-widest">— Older Messages —</p>
            {historyMessages.length === 0
              ? <p className="text-center text-xs text-gray-600 font-mono">No older messages found.</p>
              : historyMessages.map((msg) => {
                const isMe = isCreator ? !!msg.creator_user_id : !msg.creator_user_id;
                return (
                  <div key={`h-${msg.id}`} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} opacity-50`}>
                    <div className={`max-w-[85%] px-4 py-2.5 text-sm font-medium border border-white/10 rounded-2xl ${isMe ? 'bg-emerald-900/30 text-emerald-200 rounded-br-none' : 'bg-white/5 text-gray-300 rounded-bl-none'}`}>
                      {renderLinks(msg.content)}
                    </div>
                    <span className="text-[8px] font-bold text-gray-600 mt-0.5 mx-2">
                      {new Date(msg.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                );
              })
            }
          </div>
        )}

        {/* Empty state */}
        {messages.length === 0 && !showHistory && (
          <div className="h-full flex flex-col items-center justify-center opacity-40 min-h-[200px]">
            <div className="text-5xl mb-3">👻</div>
            <p className="font-black text-lg text-gray-500 uppercase tracking-widest">Ghost Town</p>
            <p className="text-xs text-gray-600 mt-1">No messages yet. Say something.</p>
          </div>
        )}

        {/* Live messages */}
        {messages.map((msg) => {
          const isMe = isCreator ? !!msg.creator_user_id : !msg.creator_user_id;

          return (
            <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} animate-in slide-in-from-bottom-3 fade-in duration-200`}>
              <div className={`flex items-center gap-1.5 mb-1 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                <img
                  src={`https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${msg.sender_name}`}
                  alt="av"
                  className="w-5 h-5 rounded-full border border-white/10 bg-black"
                />
                <span className="text-[9px] font-black text-gray-500 uppercase">{msg.sender_name}</span>
              </div>
              <div className={`
                max-w-[85%] px-4 py-2.5 text-sm font-medium leading-relaxed break-words
                border shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)]
                ${isMe
                  ? 'bg-emerald-500 text-black border-emerald-400 rounded-l-2xl rounded-tr-2xl rounded-br-none mr-2'
                  : 'bg-[#1a1a25] text-gray-100 border-white/10 rounded-r-2xl rounded-tl-2xl rounded-bl-none ml-2'
                }
              `}>
                {renderLinks(msg.content)}
              </div>
              <span className="text-[8px] font-bold text-gray-600 mt-1 mx-2">
                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          );
        })}

        <div ref={bottomRef} />
      </div>

      {/* ── INPUT ────────────────────────────────────────────────────────── */}
      <div className="relative z-10 p-3 bg-[#0f0f14]/95 backdrop-blur-md border-t border-white/10 shrink-0">
        <form onSubmit={handleSend} className="flex gap-2">
          <input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isCreator ? `Reply as @${creatorUsername}…` : 'Type your message…'}
            disabled={isSending}
            autoComplete="off"
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 font-medium text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/50 focus:bg-white/10 transition-all disabled:opacity-50 text-sm"
          />
          <button
            type="submit"
            disabled={isSending || !newMessage.trim()}
            className="px-5 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-black rounded-xl border-2 border-emerald-400 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)] hover:translate-y-[-1px] active:translate-y-[2px] active:shadow-none transition-all disabled:opacity-40 disabled:cursor-not-allowed text-sm whitespace-nowrap"
          >
            {isSending ? '…' : 'SEND ↑'}
          </button>
        </form>
      </div>
    </div>
  );
}


