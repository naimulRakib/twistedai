"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import PrivateRoute from "@/app/component/PrivateRoute";
import PremiumBackButton from "@/app/component/PremiumBackButton";
import { useToast } from "@/app/context/ToastContext";

interface Message {
  id: number;
  created_at: string;
  content: string;
  author_name: string;
  reply: string | null;
  link_id: string;
  is_public: boolean | null;
}

interface LinkData {
  is_public_inbox: boolean;
  view_count?: number;
  name?: string;
  creator_user_id: string;
}

const getMessageDetails = (content: string) => {
  if (content.startsWith("[ROAST]"))    return { label: "ROAST",    color: "text-orange-500 bg-orange-500/10 border-orange-500/20" };
  if (content.startsWith("[LAUGH]"))    return { label: "LAUGH",    color: "text-purple-400 bg-purple-400/10 border-purple-400/20" };
  if (content.startsWith("[QUESTION]")) return { label: "QUESTION", color: "text-cyan-400 bg-cyan-400/10 border-cyan-400/20" };
  if (content.startsWith("[IDEA]"))     return { label: "IDEA",     color: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20" };
  if (content.startsWith("[LETTER]"))   return { label: "LETTER",   color: "text-pink-400 bg-pink-400/10 border-pink-400/20" };
  return { label: "SECRET", color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" };
};

const cleanContent = (content: string) =>
  content.replace(/^\[(ROAST|LAUGH|QUESTION|IDEA|LETTER)\]\s*/, "");

// ─── Three-dot dropdown (click-outside aware) ──────────────────────────────
interface DropdownMenuProps {
  msgId: number;
  isHiddenFromPublic: boolean;
  hasReply: boolean;
  msgContent: string;
  msgReply: string | null;
  deletingMsgId: number | null;
  onTogglePublic: () => void;
  onDelete: () => void;
  onClose: () => void;
}
const DropdownMenu: React.FC<DropdownMenuProps> = ({
  msgId, isHiddenFromPublic, hasReply, msgContent, msgReply,
  deletingMsgId, onTogglePublic, onDelete, onClose,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  return (
    <div ref={ref} className="absolute right-0 top-9 z-50 bg-[#111] border border-white/15 rounded-xl shadow-2xl overflow-hidden min-w-[168px]">
      <button
        onClick={onTogglePublic}
        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-gray-300 hover:bg-white/10 hover:text-white transition text-left"
      >
        {isHiddenFromPublic ? (
          <>
            <svg className="w-3.5 h-3.5 shrink-0 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
            </svg>
            Show in Public
          </>
        ) : (
          <>
            <svg className="w-3.5 h-3.5 shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
            </svg>
            Hide from Public
          </>
        )}
      </button>

      <Link
        href={`/cardgenerator?msg=${encodeURIComponent(msgContent)}&reply=${encodeURIComponent(msgReply || "")}`}
        onClick={onClose}
        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-gray-300 hover:bg-white/10 hover:text-white transition"
      >
        <svg className="w-3.5 h-3.5 shrink-0 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"/>
        </svg>
        Generate Card
      </Link>

      <div className="border-t border-white/5" />

      <button
        onClick={onDelete}
        disabled={deletingMsgId === msgId}
        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition text-left disabled:opacity-50"
      >
        <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
        </svg>
        {deletingMsgId === msgId ? "Deleting…" : "Delete Message"}
      </button>
    </div>
  );
};

// ─── Main Page ──────────────────────────────────────────────────────────────
const MessageViewPage = () => {
  const toast    = useToast();
  const router   = useRouter();
  const params   = useParams();
  const linkId   = params.linkId as string;

  const [messages,       setMessages]       = useState<Message[]>([]);
  const [linkData,       setLinkData]       = useState<LinkData | null>(null);
  const [replyContent,   setReplyContent]   = useState<{ [key: number]: string }>({});
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState<string | null>(null);
  const [unauthorized,   setUnauthorized]   = useState(false);
  const [submittingId,   setSubmittingId]   = useState<number | null>(null);
  const [editingId,      setEditingId]      = useState<number | null>(null);
  const [isToggling,     setIsToggling]     = useState(false);
  const [newCount,       setNewCount]       = useState(0);
  const [openMenuId,     setOpenMenuId]     = useState<number | null>(null);
  const [deletingMsgId,  setDeletingMsgId]  = useState<number | null>(null);
  const [showDeleteInbox,setShowDeleteInbox]= useState(false);
  const [deletingInbox,  setDeletingInbox]  = useState(false);

  // ── Fetch ────────────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    if (!linkId) return;
    try {
      // 1. Verify current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setError("Not authenticated."); setLoading(false); return; }

      // 2. Fetch link (includes creator for ownership check)
      const { data: lData, error: lError } = await supabase
        .from("links")
        .select("is_public_inbox, view_count, name, creator_user_id")
        .eq("id", linkId)
        .single();

      if (lError) throw lError;

      // 🔒 SECURITY: Reject if this inbox belongs to a different user
      if (lData.creator_user_id !== user.id) {
        setUnauthorized(true);
        setLoading(false);
        return;
      }

      setLinkData(lData);

      // 3. Fetch messages
      const { data: msgData, error: msgError } = await supabase
        .from("messages")
        .select("*")
        .eq("link_id", linkId)
        .order("created_at", { ascending: false });

      if (msgError) throw msgError;
      const msgs = msgData || [];
      setMessages(msgs);

      // 4. New-message badge
      const lastSeenKey = `last_seen_${linkId}`;
      const lastSeen = localStorage.getItem(lastSeenKey);
      if (lastSeen) {
        setNewCount(msgs.filter(m => new Date(m.created_at) > new Date(lastSeen)).length);
      } else {
        setNewCount(msgs.length);
      }
      localStorage.setItem(lastSeenKey, new Date().toISOString());
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Failed to decrypt inbox.");
    } finally {
      setLoading(false);
    }
  }, [linkId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Real-time new-message listener ──────────────────────────────────────
  useEffect(() => {
    if (!linkId) return;
    const channel = supabase
      .channel(`inbox:${linkId}`)
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `link_id=eq.${linkId}` },
        (payload) => {
          setMessages(prev => [payload.new as Message, ...prev]);
          setNewCount(c => c + 1);
          toast.success("📬 New message received!");
        }
      ).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [linkId, toast]);

  // ── Actions ──────────────────────────────────────────────────────────────
  const handleTogglePublic = async () => {
    if (!linkData || isToggling) return;
    setIsToggling(true);
    const next = !linkData.is_public_inbox;
    setLinkData(p => p ? { ...p, is_public_inbox: next } : p);
    try {
      const { error } = await supabase.from("links").update({ is_public_inbox: next }).eq("id", linkId);
      if (error) throw error;
      toast.success(next ? "Inbox is now Public 🌍" : "Inbox is now Private 🔒");
    } catch {
      setLinkData(p => p ? { ...p, is_public_inbox: !next } : p);
      toast.error("Toggle failed.");
    } finally {
      setIsToggling(false);
    }
  };

  const copyPublicPageLink = () => {
    const url = `${window.location.origin}/p/${linkId}`;
    navigator.clipboard.writeText(url).catch(() => {});
    toast.success("Public Link Copied!");
  };

  const handleToggleMessagePublic = async (msg: Message) => {
    setOpenMenuId(null);
    const next = !(msg.is_public ?? true);
    setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, is_public: next } : m));
    try {
      const { error } = await supabase.from("messages").update({ is_public: next }).eq("id", msg.id);
      if (error) throw error;
      toast.success(next ? "Visible in public view 👁️" : "Hidden from public view 🔒");
    } catch {
      setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, is_public: !next } : m));
      toast.error("Update failed.");
    }
  };

  const handleDeleteMessage = async (msgId: number) => {
    setOpenMenuId(null);
    setDeletingMsgId(msgId);
    try {
      const { error } = await supabase.from("messages").delete().eq("id", msgId);
      if (error) throw error;
      setMessages(prev => prev.filter(m => m.id !== msgId));
      toast.success("Message deleted.");
    } catch {
      toast.error("Delete failed.");
    } finally {
      setDeletingMsgId(null);
    }
  };

  const handleDeleteInbox = async () => {
    setDeletingInbox(true);
    try {
      await supabase.from("messages").delete().eq("link_id", linkId);
      await supabase.from("linkhistory").delete().eq("id", linkId);
      const { error } = await supabase.from("links").delete().eq("id", linkId);
      if (error) throw error;
      toast.success("Inbox deleted.");
      router.push("/messages");
    } catch {
      toast.error("Delete failed.");
      setDeletingInbox(false);
      setShowDeleteInbox(false);
    }
  };

  const handleReplyChange = (id: number, val: string) =>
    setReplyContent(p => ({ ...p, [id]: val }));

  const startEditing = (msg: Message) => {
    setEditingId(msg.id);
    setReplyContent(p => ({ ...p, [msg.id]: msg.reply || "" }));
  };
  const cancelEditing = () => setEditingId(null);

  const handlePostReply = async (messageId: number) => {
    const content = replyContent[messageId];
    if (!content?.trim()) return toast.error("Cannot send empty reply.");
    setSubmittingId(messageId);
    try {
      const { data, error } = await supabase
        .from("messages").update({ reply: content }).eq("id", messageId).select();
      if (error) throw error;
      if (data?.length > 0) {
        setMessages(prev => prev.map(m => m.id === messageId ? { ...m, reply: data[0].reply } : m));
        setEditingId(null);
        toast.success("Reply sent!");
      }
    } catch { toast.error("Reply failed."); }
    finally { setSubmittingId(null); }
  };

  // ── Render guards ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#030303] flex flex-col items-center justify-center relative overflow-hidden font-sans">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-emerald-900/10 rounded-full blur-[100px] animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-cyan-900/10 rounded-full blur-[100px] animate-pulse" />
        </div>
        <div className="relative z-10 flex flex-col items-center gap-6">
          <div className="relative w-20 h-20">
            <div className="absolute inset-0 rounded-full border-2 border-emerald-500/20 border-t-emerald-500 animate-[spin_3s_linear_infinite]" />
            <div className="absolute inset-2 rounded-full border-2 border-cyan-500/20 border-b-cyan-500 animate-[spin_1.5s_linear_infinite_reverse]" />
          </div>
          <h2 className="text-emerald-500 font-bold tracking-[0.2em] text-sm animate-pulse">DECRYPTING INBOX</h2>
        </div>
      </div>
    );
  }

  if (unauthorized) {
    return (
      <div className="min-h-screen bg-[#030303] flex flex-col items-center justify-center px-4 text-center">
        <div className="text-5xl mb-4">🔐</div>
        <h2 className="text-white text-xl font-black mb-2">Access Denied</h2>
        <p className="text-gray-500 text-sm mb-6 max-w-xs">
          This inbox belongs to a different account.
        </p>
        <Link
          href="/messages"
          className="text-xs font-bold text-black bg-white px-5 py-2.5 rounded-xl hover:bg-gray-200 transition"
        >
          Go Back
        </Link>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#030303] flex items-center justify-center text-red-500 font-mono text-sm px-4 text-center">
        {error}
      </div>
    );
  }

  // ── Full page ─────────────────────────────────────────────────────────────
  return (
    <PrivateRoute>

      {/* ── Delete Inbox Confirmation Modal ── */}
      {showDeleteInbox && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#111] border border-red-500/30 rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="text-3xl mb-3 text-center">⚠️</div>
            <h3 className="text-white font-black text-center text-lg mb-1">Delete Entire Inbox?</h3>
            <p className="text-gray-400 text-sm text-center mb-6 leading-relaxed">
              This permanently deletes all messages and removes this link channel. It cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteInbox(false)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-bold hover:bg-white/10 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteInbox}
                disabled={deletingInbox}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-bold transition disabled:opacity-50"
              >
                {deletingInbox ? "Deleting…" : "Delete All"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="min-h-screen bg-[#030303] text-white font-sans selection:bg-emerald-500 selection:text-black relative overflow-x-hidden py-8 px-4">

        {/* Background */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute top-20 left-10 w-[40vw] h-[40vw] bg-emerald-900/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-20 right-10 w-[40vw] h-[40vw] bg-purple-900/10 rounded-full blur-[120px]" />
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
        </div>

        <div className="max-w-2xl mx-auto relative z-10">

          {/* ── Header ──────────────────────────────────────────────────── */}
          <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
            <PremiumBackButton />

            <div className="mt-4 space-y-3">

              {/* Title + delete-inbox button */}
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h1 className="text-2xl sm:text-3xl font-black tracking-tighter text-white leading-tight">
                    Secure <span className="text-emerald-500">Inbox</span>
                  </h1>
                  {linkData?.name && (
                    <p className="text-gray-500 text-xs font-mono mt-0.5 uppercase tracking-widest truncate">
                      {linkData.name}
                    </p>
                  )}

                  {/* Stats row */}
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className="text-xs font-mono text-gray-400 bg-white/5 px-2.5 py-1 rounded-full border border-white/10 whitespace-nowrap">
                      {messages.length} messages
                    </span>

                    {typeof linkData?.view_count === "number" && (
                      <span className="text-xs font-mono text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-full border border-blue-500/20 flex items-center gap-1 whitespace-nowrap">
                        <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                        </svg>
                        {linkData.view_count} views
                      </span>
                    )}

                    {/* +N new badge */}
                    {newCount > 0 && (
                      <span className="relative inline-flex items-center gap-1.5 text-xs font-black text-white bg-pink-600 px-2.5 py-1 rounded-full whitespace-nowrap">
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-pink-400 rounded-full animate-ping opacity-75" />
                        +{newCount} new 🔔
                      </span>
                    )}
                  </div>
                </div>

                {/* Delete inbox icon */}
                <button
                  onClick={() => setShowDeleteInbox(true)}
                  title="Delete entire inbox"
                  className="shrink-0 p-2 rounded-lg border border-red-500/20 bg-red-500/5 hover:bg-red-500/15 text-red-400 hover:text-red-300 transition"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                  </svg>
                </button>
              </div>

              {/* Controls row: toggle + copy link */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-2.5 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
                  <span className={`text-[10px] font-bold uppercase tracking-wider whitespace-nowrap ${linkData?.is_public_inbox ? "text-emerald-400" : "text-gray-500"}`}>
                    {linkData?.is_public_inbox ? "● Public" : "○ Private"}
                  </span>
                  <button
                    onClick={handleTogglePublic}
                    disabled={isToggling}
                    aria-label="Toggle public inbox"
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none disabled:opacity-50 ${linkData?.is_public_inbox ? "bg-emerald-500" : "bg-gray-700"}`}
                  >
                    <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${linkData?.is_public_inbox ? "translate-x-[18px]" : "translate-x-[3px]"}`} />
                  </button>
                </div>

                {linkData?.is_public_inbox && (
                  <button
                    onClick={copyPublicPageLink}
                    className="text-xs font-bold text-black bg-white hover:bg-gray-200 px-3 py-2 rounded-xl shadow-lg flex items-center gap-1.5 transition active:scale-95 whitespace-nowrap"
                  >
                    <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/>
                    </svg>
                    Copy Public Link
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* ── Messages list ────────────────────────────────────────────── */}
          <div className="space-y-5">
            {messages.length > 0 ? (
              messages.map((msg) => {
                const typeDetails      = getMessageDetails(msg.content);
                const displayContent   = cleanContent(msg.content);
                const isHiddenFromPublic = msg.is_public === false;

                return (
                  <div key={msg.id} className="group relative animate-in fade-in slide-in-from-bottom-3 duration-400">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-600 to-cyan-600 rounded-2xl blur opacity-0 group-hover:opacity-20 transition duration-500" />
                    <div className={`relative bg-[#0a0a0a]/80 backdrop-blur-xl border rounded-2xl p-4 sm:p-5 shadow-xl ${isHiddenFromPublic ? "border-gray-700/40" : "border-white/10"}`}>

                      {/* Card header */}
                      <div className="flex justify-between items-start mb-3 border-b border-white/5 pb-3 gap-2">

                        {/* Left: avatar + name + badges */}
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 shrink-0 rounded-lg bg-gradient-to-br from-gray-800 to-black flex items-center justify-center border border-white/10 text-gray-400">
                            <span className="font-bold text-xs">
                              {(msg.author_name || "A").substring(0, 1).toUpperCase()}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-bold text-sm text-white truncate">{msg.author_name}</h3>
                            <div className="flex gap-1.5 mt-0.5 flex-wrap">
                              <span className="text-[10px] text-emerald-500 font-mono bg-emerald-500/10 px-1.5 py-0.5 rounded-full border border-emerald-500/20 whitespace-nowrap">
                                #{msg.id}
                              </span>
                              <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full border whitespace-nowrap ${typeDetails.color}`}>
                                {typeDetails.label}
                              </span>
                              {isHiddenFromPublic && (
                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full border text-gray-500 bg-gray-500/10 border-gray-500/20 whitespace-nowrap">
                                  🔒 Hidden
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Right: date + 3-dot */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[10px] text-gray-500 font-mono hidden sm:block whitespace-nowrap">
                            {new Date(msg.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                          </span>

                          <div className="relative">
                            <button
                              onClick={() => setOpenMenuId(openMenuId === msg.id ? null : msg.id)}
                              className="p-1.5 rounded-lg hover:bg-white/10 text-gray-500 hover:text-white transition"
                              aria-label="Message options"
                            >
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <circle cx="12" cy="5"  r="1.5"/>
                                <circle cx="12" cy="12" r="1.5"/>
                                <circle cx="12" cy="19" r="1.5"/>
                              </svg>
                            </button>

                            {openMenuId === msg.id && (
                              <DropdownMenu
                                msgId={msg.id}
                                isHiddenFromPublic={isHiddenFromPublic}
                                hasReply={!!msg.reply}
                                msgContent={msg.content}
                                msgReply={msg.reply}
                                deletingMsgId={deletingMsgId}
                                onTogglePublic={() => handleToggleMessagePublic(msg)}
                                onDelete={() => handleDeleteMessage(msg.id)}
                                onClose={() => setOpenMenuId(null)}
                              />
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Message body */}
                      <div className="mb-4">
                        <p className="text-base sm:text-lg text-gray-200 font-medium leading-relaxed whitespace-pre-wrap break-words">
                          {displayContent}
                        </p>
                      </div>

                      {/* Reply + Generate Card */}
                      <div className="bg-black/40 rounded-xl p-3 sm:p-4 border border-white/5">
                        {msg.reply && editingId !== msg.id ? (
                          /* — Existing reply view — */
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full shrink-0" />
                                You Replied
                              </p>
                              <button
                                onClick={() => startEditing(msg)}
                                className="text-gray-500 hover:text-emerald-400 transition-colors p-1 rounded hover:bg-white/5"
                                title="Edit Reply"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                                </svg>
                              </button>
                            </div>
                            <p className="text-sm text-gray-300 border-l-2 border-emerald-500/50 pl-3 break-words">
                              {msg.reply}
                            </p>
                            {/* Generate Card CTA */}
                            <div className="pt-2">
                              <Link
                                href={`/cardgenerator?msg=${encodeURIComponent(msg.content)}&reply=${encodeURIComponent(msg.reply)}`}
                                className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 px-3 py-1.5 rounded-lg transition shadow-lg shadow-purple-500/20"
                              >
                                <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"/>
                                </svg>
                                Generate Story Card
                              </Link>
                            </div>
                          </div>
                        ) : (
                          /* — Reply composer — */
                          <div className="space-y-2.5 animate-in fade-in duration-200">
                            <div className="flex justify-between items-center">
                              <p className="text-[10px] text-emerald-500 uppercase tracking-widest font-bold">
                                {editingId === msg.id ? "Edit Reply" : "Write a Reply"}
                              </p>
                              {editingId === msg.id && (
                                <button onClick={cancelEditing} className="text-[10px] text-red-400 hover:text-red-300">
                                  Cancel
                                </button>
                              )}
                            </div>
                            <textarea
                              placeholder="Type your response..."
                              value={replyContent[msg.id] || ""}
                              onChange={e => handleReplyChange(msg.id, e.target.value)}
                              rows={2}
                              className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/50 transition-all resize-none"
                            />
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              {/* Generate Card link (left) */}
                              <Link
                                href={`/cardgenerator?msg=${encodeURIComponent(msg.content)}`}
                                className="inline-flex items-center gap-1 text-xs font-bold text-purple-400 hover:text-purple-300 transition whitespace-nowrap"
                              >
                                <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"/>
                                </svg>
                                Generate Card
                              </Link>

                              {/* Send / Update (right) */}
                              <button
                                onClick={() => handlePostReply(msg.id)}
                                disabled={submittingId === msg.id}
                                className="px-4 py-1.5 bg-gradient-to-r from-emerald-600 to-cyan-600 rounded-lg text-black text-xs font-bold hover:shadow-[0_0_15px_rgba(16,185,129,0.4)] transition-all disabled:opacity-50 whitespace-nowrap"
                              >
                                {submittingId === msg.id
                                  ? "Sending…"
                                  : editingId === msg.id
                                    ? "Update Reply"
                                    : "Send Reply"}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center py-16 sm:py-20 bg-white/5 border border-white/5 border-dashed rounded-3xl text-center animate-in fade-in">
                <div className="text-4xl mb-4">📭</div>
                <h4 className="text-lg font-bold text-white mb-2">No Messages Yet</h4>
                <p className="text-gray-500 text-sm max-w-xs">Share your link to receive anonymous messages.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </PrivateRoute>
  );
};

export default MessageViewPage;