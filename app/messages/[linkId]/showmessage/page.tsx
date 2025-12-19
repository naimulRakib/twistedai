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
  link_id: number;
}

// --- KEEPING YOUR EXACT HELPERS ---
const getMessageDetails = (content: string) => {
  if (content.startsWith('[ROAST]')) return { label: 'ROAST', color: 'text-orange-500 bg-orange-500/10 border-orange-500/20' };
  if (content.startsWith('[LAUGH]')) return { label: 'LAUGH', color: 'text-purple-400 bg-purple-400/10 border-purple-400/20' };
  if (content.startsWith('[QUESTION]')) return { label: 'QUESTION', color: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20' };
  if (content.startsWith('[IDEA]')) return { label: 'IDEA', color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20' };
  if (content.startsWith('[LETTER]')) return { label: 'LETTER', color: 'text-pink-400 bg-pink-400/10 border-pink-400/20' };
  return { label: 'SECRET', color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' };
};

const cleanContent = (content: string) => content.replace(/^\[(ROAST|LAUGH|QUESTION|IDEA|LETTER)\]\s*/, '');

const MessageViewPage = () => {
  const toast = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [replyContent, setReplyContent] = useState<{ [key: number]: string }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submittingId, setSubmittingId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);

  // --- NEW STATE FOR PUBLIC TOGGLE ---
  const [isPublicInbox, setIsPublicInbox] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  const params = useParams();
  const linkId = params.linkId as string;

  const fetchMessagesAndStatus = useCallback(async () => {
    if (!linkId) return;
    try {
      // 1. Fetch Link Status (Is it public?)
      const { data: linkData, error: linkError } = await supabase
        .from("links")
        .select("is_public_inbox")
        .eq("id", linkId)
        .single();
      
      if (linkError) throw linkError;
      // Update state from DB
      setIsPublicInbox(linkData.is_public_inbox || false);

      // 2. Fetch Messages
      const { data: msgData, error: msgError } = await supabase
        .from("messages")
        .select("*")
        .eq("link_id", linkId)
        .order("created_at", { ascending: false });

      if (msgError) throw msgError;
      setMessages(msgData || []);

    } catch (err) {
      console.error("Error:", err);
      setError("Failed to decrypt inbox.");
    } finally {
      setLoading(false);
    }
  }, [linkId]);

  useEffect(() => {
    fetchMessagesAndStatus();
  }, [fetchMessagesAndStatus]);

  // --- NEW: TOGGLE LOGIC ---
  const handleTogglePublic = async () => {
      setIsToggling(true);
      const newState = !isPublicInbox;
      
      // Optimistic UI update
      setIsPublicInbox(newState);

      try {
          const { error } = await supabase
            .from('links')
            .update({ is_public_inbox: newState })
            .eq('id', linkId);
          
          if (error) {
              console.error(error); // Log error to see if RLS blocks it
              throw error;
          }
          
          if (newState) {
              toast.success("Inbox is now PUBLIC! 🌍");
          } else {
              toast.success("Inbox is now PRIVATE 🔒");
          }
      } catch (e) {
          setIsPublicInbox(!newState); // Revert if failed
          toast.error("Update failed. Check Permissions.");
      } finally {
          setIsToggling(false);
      }
  };

  const copyPublicPageLink = () => {
      const url = `${window.location.origin}/p/${linkId}`;
      navigator.clipboard.writeText(url);
      toast.success("Public Link Copied! Share it on Insta/FB.");
  };

  // --- EXISTING HANDLERS ---
  const handleReplyChange = (messageId: number, content: string) => {
    setReplyContent((prev) => ({ ...prev, [messageId]: content }));
  };

  const startEditing = (msg: Message) => {
    setEditingId(msg.id);
    setReplyContent((prev) => ({ ...prev, [msg.id]: msg.reply || "" }));
  };

  const cancelEditing = (id: number) => {
    setEditingId(null);
  };

  const handlePostReply = async (messageId: number) => {
    const content = replyContent[messageId];
    if (!content?.trim()) return alert("Cannot send empty reply.");
    setSubmittingId(messageId);
    try {
      const { data, error } = await supabase.from("messages").update({ reply: content }).eq("id", messageId).select();
      if (error) throw error;
      if (data && data.length > 0) {
        setMessages((prev) => prev.map((msg) => msg.id === messageId ? { ...msg, reply: data[0].reply } : msg));
        setEditingId(null); 
      }
    } catch (err) { alert("Transmission failed."); } finally { setSubmittingId(null); }
  };

  // --- RESTORED PREVIOUS LOADING SYSTEM ---
  if (loading) {
    return (
      <div className="min-h-screen bg-[#030303] flex flex-col items-center justify-center relative overflow-hidden font-sans selection:bg-emerald-500 selection:text-black">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-emerald-900/10 rounded-full blur-[100px] animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-cyan-900/10 rounded-full blur-[100px] animate-pulse" />
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
        </div>
        <div className="relative z-10 flex flex-col items-center gap-8">
            <div className="relative w-24 h-24">
                <div className="absolute inset-0 rounded-full border-2 border-emerald-500/20 border-t-emerald-500 animate-[spin_3s_linear_infinite]"></div>
                <div className="absolute inset-2 rounded-full border-2 border-cyan-500/20 border-b-cyan-500 animate-[spin_1.5s_linear_infinite_reverse]"></div>
                <div className="absolute inset-8 bg-emerald-500/20 rounded-full animate-pulse flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.4)]">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                </div>
            </div>
            <h2 className="text-emerald-500 font-bold tracking-[0.2em] text-sm animate-pulse">DECRYPTING INBOX</h2>
        </div>
      </div>
    );
  }

  if (error) return <div className="min-h-screen bg-[#030303] flex items-center justify-center text-red-500 font-mono">{error}</div>;

  return (
    <PrivateRoute>
      <div className="min-h-screen bg-[#030303] text-white font-sans selection:bg-emerald-500 selection:text-black relative overflow-hidden py-10 px-4">
        {/* Background FX */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute top-20 left-10 w-[500px] h-[500px] bg-emerald-900/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-20 right-10 w-[500px] h-[500px] bg-purple-900/10 rounded-full blur-[120px]" />
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
        </div>

        <div className="max-w-2xl mx-auto relative z-10">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4 animate-in fade-in slide-in-from-top-4 duration-700">
            <div>
              <PremiumBackButton/>
              <br /><br />
              <h1 className="text-3xl font-black tracking-tighter text-white">
                Secure <span className="text-emerald-500">Inbox</span>
              </h1>
              <p className="text-gray-500 text-xs font-mono mt-1 uppercase tracking-widest">
                 {messages.length} Encrypted Transmissions
              </p>
            </div>

            {/* --- NEW: GLOBAL VISIBILITY CONTROLS --- */}
            <div className="flex flex-col items-end gap-2">
                <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl p-2">
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${isPublicInbox ? 'text-emerald-400' : 'text-gray-500'}`}>
                        {isPublicInbox ? '● Live Public' : '○ Private'}
                    </span>
                    <button 
                        onClick={handleTogglePublic}
                        disabled={isToggling}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${isPublicInbox ? 'bg-emerald-500' : 'bg-gray-700'}`}
                    >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isPublicInbox ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                </div>

                {isPublicInbox && (
                    <button 
                        onClick={copyPublicPageLink}
                        className="text-xs font-bold text-black bg-white hover:bg-gray-200 px-4 py-2 rounded-lg shadow-lg shadow-white/10 flex items-center gap-2 transition active:scale-95"
                    >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path></svg>
                        Copy Public Link
                    </button>
                )}
            </div>
          </div>

          {/* Messages List (EXACT SAME AS BEFORE) */}
          <div className="space-y-6">
            {messages.length > 0 ? (
              messages.map((msg) => {
                const typeDetails = getMessageDetails(msg.content);
                const displayContent = cleanContent(msg.content);

                return (
                <div key={msg.id} className="group relative animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-600 to-cyan-600 rounded-2xl blur opacity-0 group-hover:opacity-20 transition duration-500"></div>
                  <div className="relative bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl">
                    <div className="flex justify-between items-start mb-4 border-b border-white/5 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gray-800 to-black flex items-center justify-center border border-white/10 text-gray-400">
                          <span className="font-bold text-xs">{msg.author_name.substring(0,1).toUpperCase()}</span>
                        </div>
                        <div>
                          <h3 className="font-bold text-sm text-white">{msg.author_name}</h3>
                          <div className="flex gap-2 mt-1">
                              <span className="text-[10px] text-emerald-500 font-mono bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">ID: {msg.id}</span>
                              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${typeDetails.color}`}>{typeDetails.label}</span>
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] text-gray-500 font-mono">
                        {new Date(msg.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="mb-6">
                      <p className="text-lg text-gray-200 font-medium leading-relaxed whitespace-pre-wrap">{displayContent}</p>
                    </div>

                    <div className="bg-black/40 rounded-xl p-4 border border-white/5">
                      {msg.reply && editingId !== msg.id ? (
                        <div className="space-y-2 relative">
                          <div className="flex justify-between items-center">
                            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span> You Replied
                            </p>
                            <button onClick={() => startEditing(msg)} className="text-gray-500 hover:text-emerald-400 transition-colors p-1 rounded hover:bg-white/5" title="Edit Reply">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                            </button>
                          </div>
                          <p className="text-sm text-gray-300 border-l-2 border-emerald-500/50 pl-3">{msg.reply}</p>
                          <div className="pt-3 flex justify-end">
                             <Link href={`/cardgenerator?msg=${encodeURIComponent(msg.content)}&reply=${encodeURIComponent(msg.reply)}`} className="text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 px-4 py-2 rounded-lg transition flex items-center gap-2 shadow-lg shadow-purple-500/20">
                            Generate Story Card
                              </Link>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3 animate-in fade-in duration-300">
                          <div className="flex justify-between">
                             <p className="text-[10px] text-emerald-500 uppercase tracking-widest font-bold">{editingId === msg.id ? "Edit Your Reply" : "Write a Reply"}</p>
                             {editingId === msg.id && (<button onClick={() => cancelEditing(msg.id)} className="text-[10px] text-red-400 hover:text-red-300">Cancel</button>)}
                          </div>
                          <textarea placeholder="Type your response..." value={replyContent[msg.id] || ""} onChange={(e) => handleReplyChange(msg.id, e.target.value)} rows={2} className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/50 transition-all resize-none" />
                          <div className="flex gap-3 justify-end">
                            {!editingId && (<Link href={`/cardgenerator?msg=${encodeURIComponent(msg.content)}`} className="px-4 py-2 rounded-lg border border-white/10 text-gray-400 text-xs font-bold hover:text-white hover:bg-white/5 transition">AI Reply & Card</Link>)}
                            <button onClick={() => handlePostReply(msg.id)} disabled={submittingId === msg.id} className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-cyan-600 rounded-lg text-black text-xs font-bold hover:shadow-[0_0_15px_rgba(16,185,129,0.4)] transition-all disabled:opacity-50 flex items-center gap-2">
                              {submittingId === msg.id ? 'Sending...' : (editingId === msg.id ? 'Update Reply' : 'Send Reply')}
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
                <h4 className="text-lg font-bold text-white mb-2">No Transmissions</h4>
                <p className="text-gray-500 text-sm max-w-xs">Share your link to receive anonymous data.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </PrivateRoute>
  );
};

export default MessageViewPage;