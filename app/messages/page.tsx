"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface LinkHistoryItem {
  id: string;
  content: string;
  author_name: string;
  created_at: string;
  creator_user_id: string;
}

const LinkViewPage = () => {
  const [links, setLinks] = useState<LinkHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copyStatus, setCopyStatus] = useState<string | null>(null);

  useEffect(() => {
    const fetchLinks = async () => {
      try {
        // Get user first, then fetch — no race condition
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError || !userData?.user) {
          setError('Not authenticated.');
          return;
        }

        const { data, error: fetchError } = await supabase
          .from('linkhistory')
          .select('*')
          .eq('creator_user_id', userData.user.id)
          .order('created_at', { ascending: false });

        if (fetchError) throw fetchError;
        setLinks(data || []);
      } catch (err) {
        console.error('Fetch error:', err);
        setError('Could not load link history.');
      } finally {
        setLoading(false);
      }
    };

    fetchLinks();
  }, []);

  const handleCopy = (url: string, id: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).catch(() => fallbackCopy(url));
    } else {
      fallbackCopy(url);
    }
    setCopyStatus(id);
    setTimeout(() => setCopyStatus(null), 2000);
  };

  const fallbackCopy = (text: string) => {
    const el = document.createElement('textarea');
    el.value = text;
    el.style.position = 'fixed';
    el.style.opacity = '0';
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
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
          <h2 className="text-emerald-500 font-bold tracking-[0.2em] text-sm animate-pulse">LOADING HISTORY</h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#030303] flex items-center justify-center">
        <p className="text-red-500 font-mono text-sm px-4 text-center">{error}</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto p-4 sm:p-6 font-sans">

      {/* Header */}
      <div className="flex items-center justify-between mb-6 sm:mb-8 flex-wrap gap-3">
        <h3 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-3">
          <span className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400 border border-emerald-500/20 shrink-0">
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </span>
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
            Link History
          </span>
        </h3>
        <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
          {links.length} Active
        </span>
      </div>

      {/* List */}
      {links.length > 0 ? (
        <div className="space-y-3 sm:space-y-4">
          {links.map((item) => (
            <div key={item.id} className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-600 to-cyan-600 rounded-2xl blur opacity-0 group-hover:opacity-25 transition duration-400" />
              <div className="relative bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 transition-all">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 sm:p-5 gap-3">

                  {/* Left: info */}
                  <a
                    href={`${item.content}/showmessage`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 flex-1 min-w-0 cursor-pointer group/link"
                  >
                    <div className="w-10 h-10 sm:w-12 sm:h-12 shrink-0 rounded-xl bg-gradient-to-br from-gray-800 to-black flex items-center justify-center border border-white/5 text-gray-400 group-hover/link:text-emerald-400 group-hover/link:border-emerald-500/30 transition-all">
                      <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-white font-bold text-sm truncate group-hover/link:text-emerald-400 transition-colors">
                        {item.author_name || 'Unnamed Link'}
                      </h4>
                      <p className="text-xs text-gray-500 font-mono truncate mt-0.5 opacity-70 group-hover/link:opacity-100 transition-opacity">
                        {item.content}
                      </p>
                    </div>
                  </a>

                  {/* Right: date + copy */}
                  <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 border-white/5 pt-3 sm:pt-0 mt-1 sm:mt-0">
                    <div className="text-right hidden sm:block">
                      <span className="text-[10px] text-gray-600 uppercase tracking-wider block">Created</span>
                      <div className="text-xs font-mono text-gray-400">
                        {new Date(item.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                    <button
                      onClick={() => handleCopy(item.content, item.id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all active:scale-95 whitespace-nowrap ml-auto sm:ml-0 ${
                        copyStatus === item.id
                          ? 'text-emerald-400 border border-emerald-500/50 bg-emerald-500/10'
                          : 'bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300'
                      }`}
                    >
                      {copyStatus === item.id ? (
                        <>
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                          Copied
                        </>
                      ) : (
                        'Copy Link'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 bg-white/[0.02] border border-white/5 border-dashed rounded-3xl text-center animate-in fade-in zoom-in-95 duration-400">
          <div className="w-16 h-16 bg-gradient-to-tr from-emerald-500/10 to-cyan-500/10 rounded-full flex items-center justify-center mb-5 animate-pulse">
            <svg className="w-7 h-7 text-emerald-500/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </div>
          <h4 className="text-lg font-bold text-white mb-2">No Links Yet</h4>
          <p className="text-gray-500 text-sm max-w-xs leading-relaxed">
            Create a secure link to start receiving anonymous messages.
          </p>
        </div>
      )}
    </div>
  );
};

export default LinkViewPage;
