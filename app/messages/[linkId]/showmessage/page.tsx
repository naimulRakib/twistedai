"use client";

import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useParams } from "next/navigation";
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
}

interface LinkData {
  is_public_inbox: boolean;
  view_count?: number;
  name?: string;
}

const getMessageDetails = (content: string) => {
  if (content.startsWith("[ROAST]"))    return { label: "ROAST",    color: "text-orange-500 bg-orange-500/10 border-orange-500/20" };
  if (content.startsWith("[LAUGH]"))    return { label: "LAUGH",    color: "text-purple-400 bg-purple-400/10 border-purple-400/20" };
  if (content.startsWith("[QUESTION]")) return { label: "QUESTION", color: "text-cyan-400 bg-cyan-400/10 border-cyan-400/20" };
  return { label: "SECRET", color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" };
};

const cleanContent = (content: string) => content.replace(/^\[(ROAST|LAUGH|QUESTION|IDEA|LETTER)\]\s*/, "");

const MessageViewPage = () => {
  const toast = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [linkData, setLinkData] = useState<LinkData | null>(null);
  const [replyContent, setReplyContent] = useState<{ [key: number]: string }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submittingId, setSubmittingId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isToggling, setIsToggling] = useState(false);
  // Notification: track count of unread messages (new since last visit)
  const [newCount, setNewCount] = useState(0);

  const params = useParams();
  const linkId = params.linkId as string;

  const fetchData = useCallback(async () => {
    if (!linkId) return;
    try {
      // Fetch link metadata (public toggle + view count)
      const { data: lData, error: lError } = await supabase
        .from("links")
        .select("is_public_inbox, view_count, name")
        .eq("id", linkId)
        .single();

      if (lError) throw lError;
      setLinkData(lData);

      // Fetch messages
      const { data: msgData, error: msgError } = await supabase
        .from("messages")
        .select("*")
        .eq("link_id", linkId)
        .order("created_at", { ascending: false });

      if (msgError) throw msgError;
      const msgs = msgData || [];
      setMessages(msgs);

      // Inbox notification: compare to last seen timestamp
      const lastSeenKey = `last_seen_${linkId}`;
      const lastSeen = localStorage.getItem(lastSeenKey);
      if (lastSeen) {
        const unread = msgs.filter(m => new Date(m.created_at) > new Date(lastSeen));
        setNewCount(unread.length);
      } else {
        setNewCount(msgs.length > 0 ? msgs.length : 0);
      }
      // Mark as seen now
      localStorage.setItem(lastSeenKey, new Date().toISOString());

    } catch (err) {
      console.error("Fetch error:", err);
      setError("Failed to decrypt inbox.");
    } finally {
      setLoading(false);
    }
  }, [linkId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- Real-time subscription for new messages (inbox notification) ---
  useEffect(() => {
    if (!linkId) return;

    const channel = supabase
      .channel(`inbox:${linkId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `link_id=eq.${linkId}` },
        (payload) => {
          setMessages((prev) => [payload.new as Message, ...prev]);
          setNewCount((c) => c + 1);
          toast.success("📬 New message received!");
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [linkId, toast]);

  const handleTogglePublic = async () => {
    if (!linkData || isToggling) return;
    setIsToggling(true);
    const newState = !linkData.is_public_inbox;
    setLinkData((prev) => prev ? { ...prev, is_public_inbox: newState } : prev);

    try {
      const { error } = await supabase
        .from("links")
        .update({ is_public_inbox: newState })
        .eq("id", linkId);
      if (error) throw error;
      toast.success(newState ? "Inbox is now Public" : "Inbox is now Private");
    } catch (err) {
      setLinkData((prev) => prev ? { ...prev, is_public_inbox: !newState } : prev); // Rollback
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

  const handleReplyChange = (messageId: number, content: string) => {
    setReplyContent((prev) => ({ ...prev, [messageId]: content }));
  };

  const startEditing = (msg: Message) => {
    setEditingId(msg.id);
    setReplyContent((prev) => ({ ...prev, [msg.id]: msg.reply || "" }));
  };

  const cancelEditing = () => { setEditingId(null); };

  const handlePostReply = async (messageId: number) => {
    const content = replyContent[messageId];
    if (!content?.trim()) return toast.error("Cannot send empty reply.");
    setSubmittingId(messageId);
    try {
      const { data, error } = await supabase
        .from("messages")
        .update({ reply: content })
        .eq("id", messageId)
        .select();
      if (error) throw error;
      if (data?.length > 0) {
        setMessages((prev) => prev.map((msg) => msg.id === messageId ? { ...msg, reply: data[0].reply } : msg));
        setEditingId(null);
        toast.success("Reply sent!");
      }
    } catch {
      toast.error("Reply failed.");
    } finally {
      setSubmittingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030303] flex flex-col items-center justify-center relative overflow-hidden font-sans">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
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

  if (error) {
    return (
      <div className="min-h-screen bg-[#030303] flex items-center justify-center text-red-500 font-mono text-sm px-4 text-center">
        {error}
      </div>
    );
  }

  return (
    <PrivateRoute>
      <div className="min-h-screen bg-[#030303] text-white font-sans selection:bg-emerald-500 selection:text-black relative overflow-x-hidden py-8 px-4">

        {/* Background FX */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute top-20 left-10 w-[40vw] h-[40vw] bg-emerald-900/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-20 right-10 w-[40vw] h-[40vw] bg-purple-900/10 rounded-full blur-[120px]" />
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
        </div>

        <div className="max-w-2xl mx-auto relative z-10">

          {/* Header */}
          <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
            <PremiumBackButton />
            <div className="mt-4 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tighter text-white">
                  Secure <span className="text-emerald-500">Inbox</span>
                </h1>
                {linkData?.name && (
                  <p className="text-gray-500 text-xs font-mono mt-0.5 uppercase tracking-widest">
                    {linkData.name}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-3 mt-2">
                  <span className="text-xs font-mono text-gray-400 bg-white/5 px-3 py-1 rounded-full border border-white/10">
                    {messages.length} messages
                  </span>
                  {/* View Count */}
                  {typeof linkData?.view_count === "number" && (
                    <span className="text-xs font-mono text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20 flex items-center gap-1.5">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      {linkData.view_count} views
                    </span>
                  )}
                  {/* New Messages Badge */}
                  {newCount > 0 && (
                    <span className="text-xs font-bold text-black bg-pink-500 px-3 py-1 rounded-full animate-pulse">
                      {newCount} NEW 🔔
                    </span>
                  )}
                </div>
              </div>

              {/* Public Toggle */}
              <div className="flex flex-col items-start sm:items-end gap-2 shrink-0">
                <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
                  <span className={`text-[10px] font-bold uppercase tracking-wider whitespace-nowrap ${linkData?.is_public_inbox ? "text-emerald-400" : "text-gray-500"}`}>
                    {linkData?.is_public_inbox ? "● Public" : "○ Private"}
                  </span>
                  <button
                    onClick={handleTogglePublic}
                    disabled={isToggling}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none disabled:opacity-50 ${linkData?.is_public_inbox ? "bg-emerald-500" : "bg-gray-700"}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${linkData?.is_public_inbox ? "translate-x-6" : "translate-x-1"}`} />
                  </button>
                </div>
                {linkData?.is_public_inbox && (
                  <button
                    onClick={copyPublicPageLink}
                    className="text-xs font-bold text-black bg-white hover:bg-gray-200 px-3 py-2 rounded-lg shadow-lg flex items-center gap-2 transition active:scale-95"
                  >
                    <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                    Copy Public Link
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="space-y-5">
            {messages.length > 0 ? (
              messages.map((msg) => {
                const typeDetails = getMessageDetails(msg.content);
                const displayContent = cleanContent(msg.content);

                return (
                  <div key={msg.id} className="group relative animate-in fade-in slide-in-from-bottom-3 duration-400">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-600 to-cyan-600 rounded-2xl blur opacity-0 group-hover:opacity-20 transition duration-500" />
                    <div className="relative bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-5 sm:p-6 shadow-xl">

                      {/* Message Header */}
                      <div className="flex justify-between items-start mb-4 border-b border-white/5 pb-4 gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 shrink-0 rounded-lg bg-gradient-to-br from-gray-800 to-black flex items-center justify-center border border-white/10 text-gray-400">
                            <span className="font-bold text-xs">{(msg.author_name || "A").substring(0, 1).toUpperCase()}</span>
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-bold text-sm text-white truncate">{msg.author_name}</h3>
                            <div className="flex gap-2 mt-1 flex-wrap">
                              <span className="text-[10px] text-emerald-500 font-mono bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 whitespace-nowrap">
                                ID: {msg.id}
                              </span>
                              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border whitespace-nowrap ${typeDetails.color}`}>
                                {typeDetails.label}
                              </span>
                            </div>
                          </div>
                        </div>
                        <span className="text-[10px] text-gray-500 font-mono shrink-0">
                          {new Date(msg.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                        </span>
                      </div>

                      {/* Message Body */}
                      <div className="mb-5">
                        <p className="text-base sm:text-lg text-gray-200 font-medium leading-relaxed whitespace-pre-wrap break-words">
                          {displayContent}
                        </p>
                      </div>

                      {/* Reply Section */}
                      <div className="bg-black/40 rounded-xl p-4 border border-white/5">
                        {msg.reply && editingId !== msg.id ? (
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" /> You Replied
                              </p>
                              <button
                                onClick={() => startEditing(msg)}
                                className="text-gray-500 hover:text-emerald-400 transition-colors p-1 rounded hover:bg-white/5"
                                title="Edit Reply"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                            </div>
                            <p className="text-sm text-gray-300 border-l-2 border-emerald-500/50 pl-3 break-words">{msg.reply}</p>
                          </div>
                        ) : (
                          <div className="space-y-3 animate-in fade-in duration-200">
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
                              onChange={(e) => handleReplyChange(msg.id, e.target.value)}
                              rows={2}
                              className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/50 transition-all resize-none"
                            />
                            <div className="flex gap-2 sm:gap-3 justify-end flex-wrap">
                              <button
                                onClick={() => handlePostReply(msg.id)}
                                disabled={submittingId === msg.id}
                                className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-cyan-600 rounded-lg text-black text-xs font-bold hover:shadow-[0_0_15px_rgba(16,185,129,0.4)] transition-all disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
                              >
                                {submittingId === msg.id ? "Sending..." : editingId === msg.id ? "Update Reply" : "Send Reply"}
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
              <div className="flex flex-col items-center justify-center py-20 bg-white/5 border border-white/5 border-dashed rounded-3xl text-center animate-in fade-in">
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
