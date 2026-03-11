"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

interface LinkItem {
  id: string;
  creator_user_id: string;
  created_at: string;
  content: string;
  author_name: string;
}

const LinkPage = () => {
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    const fetchLinks = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) { setError("Not authenticated."); return; }

        const { data, error: fetchError } = await supabase
          .from("linkhistory")
          .select("*")
          .eq("creator_user_id", user.id)
          .order("created_at", { ascending: false });

        if (fetchError) throw fetchError;
        setLinks(data || []);
      } catch (err) {
        console.error("Fetch error:", err);
        setError("Could not fetch links.");
      } finally {
        setLoading(false);
      }
    };
    fetchLinks();
  }, []);

  const handleCopy = (text: string, id: string) => {
    const fallback = (t: string) => {
      const el = document.createElement("textarea");
      el.value = t;
      el.style.cssText = "position:fixed;opacity:0;top:0;left:0";
      document.body.appendChild(el);
      el.select();
      try { document.execCommand("copy"); } catch {}
      document.body.removeChild(el);
    };
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(() => fallback(text));
    } else {
      fallback(text);
    }
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDeleteLink = async (id: string) => {
    setDeletingId(id);
    try {
      await supabase.from("messages").delete().eq("link_id", id);
      await supabase.from("links").delete().eq("id", id);
      const { error } = await supabase.from("linkhistory").delete().eq("id", id);
      if (error) throw error;
      setLinks(prev => prev.filter(l => l.id !== id));
    } catch (err) {
      console.error("Delete error:", err);
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030303] flex flex-col items-center justify-center relative overflow-hidden font-sans">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-emerald-900/10 rounded-full blur-[100px] animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-cyan-900/10 rounded-full blur-[100px] animate-pulse" />
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
        </div>
        <div className="relative z-10 flex flex-col items-center gap-8">
          <div className="relative w-24 h-24">
            <div className="absolute inset-0 rounded-full border-2 border-emerald-500/20 border-t-emerald-500 animate-[spin_3s_linear_infinite]" />
            <div className="absolute inset-2 rounded-full border-2 border-cyan-500/20 border-b-cyan-500 animate-[spin_1.5s_linear_infinite_reverse]" />
            <div className="absolute inset-8 bg-emerald-500/20 rounded-full animate-pulse flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.4)]">
              <div className="w-2 h-2 bg-emerald-400 rounded-full" />
            </div>
          </div>
          <div className="text-center space-y-2">
            <h2 className="text-emerald-500 font-bold tracking-[0.2em] text-sm animate-pulse">LOADING HISTORY</h2>
            <div className="flex items-center justify-center gap-1">
              <span className="w-1 h-1 bg-emerald-500/50 rounded-full animate-bounce" />
              <span className="w-1 h-1 bg-emerald-500/50 rounded-full animate-bounce delay-75" />
              <span className="w-1 h-1 bg-emerald-500/50 rounded-full animate-bounce delay-150" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <p className="text-red-400 font-mono text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto p-4 sm:p-6 font-sans">

      {/* Delete confirmation modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#111] border border-red-500/30 rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="text-3xl mb-3 text-center">🗑️</div>
            <h3 className="text-white font-black text-center text-lg mb-1">Delete This Channel?</h3>
            <p className="text-gray-400 text-sm text-center mb-6 leading-relaxed">
              This permanently deletes the link and all its messages.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-bold hover:bg-white/10 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteLink(confirmDeleteId)}
                disabled={deletingId === confirmDeleteId}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-bold transition disabled:opacity-50"
              >
                {deletingId === confirmDeleteId ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6 sm:mb-8 flex-wrap gap-3">
        <h3 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-3">
          <span className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400 border border-emerald-500/20 shrink-0">
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </span>
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">Link History</span>
        </h3>
        <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
          {links.length} Active
        </span>
      </div>

      {/* List */}
      {links.length > 0 ? (
        <div className="space-y-4">
          {links.map((item) => (
            <div key={item.id} className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-600 to-cyan-600 rounded-2xl blur opacity-0 group-hover:opacity-30 transition duration-500" />
              <div className="relative bg-[#0a0a0a] backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 transition-all">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 sm:p-5 gap-3 sm:gap-4">

                  {/* Left: Link info */}
                  <a
                    href={item.content}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0 group/link cursor-pointer"
                  >
                    <div className="w-10 h-10 sm:w-12 sm:h-12 shrink-0 rounded-xl bg-gradient-to-br from-gray-800 to-black flex items-center justify-center border border-white/5 text-gray-400 group-hover/link:text-emerald-400 group-hover/link:border-emerald-500/30 transition-all">
                      <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-white font-bold text-sm sm:text-base truncate group-hover/link:text-emerald-400 transition-colors">
                        {item.author_name || "Unnamed Link"}
                      </h4>
                      <p className="text-xs text-gray-500 font-mono truncate mt-0.5 opacity-60 group-hover/link:opacity-100 transition-opacity">
                        {item.content}
                      </p>
                    </div>
                  </a>

                  {/* Right: Date + Copy + Delete */}
                  <div className="flex items-center justify-between w-full md:w-auto gap-3 border-t md:border-t-0 border-white/5 pt-3 md:pt-0 mt-1 md:mt-0">
                    <div className="text-right hidden md:block">
                      <span className="text-[10px] text-gray-500 uppercase tracking-wider">Created</span>
                      <div className="text-xs font-mono text-gray-300">
                        {new Date(item.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-auto md:ml-0">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleCopy(item.content, item.id); }}
                        className={`flex items-center gap-1.5 px-3 py-2 border rounded-lg text-xs font-bold transition-all active:scale-95 whitespace-nowrap ${
                          copiedId === item.id
                            ? "text-emerald-400 border-emerald-500/50 bg-emerald-500/10"
                            : "bg-white/5 hover:bg-white/10 border-white/10 text-gray-300"
                        }`}
                      >
                        {copiedId === item.id ? (
                          <>
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                            Copied
                          </>
                        ) : "Copy"}
                      </button>

                      <button
                        onClick={() => setConfirmDeleteId(item.id)}
                        title="Delete channel"
                        className="p-2 rounded-lg border border-red-500/20 bg-red-500/5 hover:bg-red-500/15 text-red-400 hover:text-red-300 transition active:scale-95"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 sm:py-24 bg-white/[0.02] border border-white/5 border-dashed rounded-3xl text-center animate-in fade-in zoom-in-95 duration-500">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-tr from-emerald-500/10 to-cyan-500/10 rounded-full flex items-center justify-center mb-5 sm:mb-6 animate-pulse">
            <svg className="w-7 h-7 sm:w-8 sm:h-8 text-emerald-500/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </div>
          <h4 className="text-lg sm:text-xl font-bold text-white mb-2">No Links Found</h4>
          <p className="text-gray-500 text-sm max-w-xs mx-auto leading-relaxed">
            Create a secure link to start receiving anonymous messages.
          </p>
        </div>
      )}
    </div>
  );
};

export default LinkPage;