'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { generateSlug } from '@/app/utils/generateSlug';

export default function UrlShortener() {
  const [longUrl, setLongUrl] = useState("");
  const [shortUrl, setShortUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [copyStatus, setCopyStatus] = useState("COPY ENCRYPTED LINK");

  const handleShorten = async () => {
    if (!longUrl) return alert("Please paste a target URL.");
    if (!longUrl.startsWith('http')) return alert("Protocol missing (http:// or https:// required).");

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Access Denied: Login required.");

      // 1. Generate Slug
      const slug = generateSlug(5);

      // 2. Save to DB
      const { error } = await supabase
        .from('short_links')
        .insert([{
            slug: slug,
            original_url: longUrl,
            creator_id: user.id
        }]);

      if (error) throw error;

      // 3. Set Result
      setShortUrl(`${window.location.origin}/s/${slug}`);

    } catch (e: any) {
      alert("System Error: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto mt-10">
        
      {/* --- CONTAINER --- */}
      <div className="bg-[#0a0a0a] border border-green-900/30 rounded-xl p-1 shadow-2xl relative overflow-hidden group">
        
        {/* Background FX */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none"></div>
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-emerald-500/20 rounded-full blur-[80px] animate-pulse"></div>
        
        <div className="bg-black/60 backdrop-blur-md rounded-[18px] p-6 relative z-10">

            {/* Header */}
            <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
                <div>
                    <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                        URL SHORTEN
                    </h2>
                    <p className="text-xs text-gray-500 font-mono mt-1">Encrypted Redirect System</p>
                </div>
                <div className="p-2 bg-emerald-900/20 rounded-lg border border-emerald-500/20">
                    <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg>
                </div>
            </div>
      
            {/* Input Section */}
            <div className="space-y-4">
                <div className="group/input">
                    <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1 block group-focus-within/input:text-emerald-500 transition-colors">Target URL</label>
                    <div className="relative">
                        <input 
                            type="url" 
                            placeholder="https://example.com/secret-file"
                            value={longUrl}
                            onChange={(e) => setLongUrl(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 pl-10 text-white font-mono text-sm placeholder-gray-700 focus:outline-none focus:border-emerald-500/50 focus:bg-black/80 transition-all"
                        />
                        <svg className="w-4 h-4 text-gray-600 absolute left-3 top-3.5 group-focus-within/input:text-emerald-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"></path></svg>
                    </div>
                </div>

                {/* Action Button */}
                <button 
                    onClick={handleShorten}
                    disabled={loading}
                    className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl font-bold text-black hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 uppercase tracking-wider text-xs"
                >
                    {loading ? (
                        <>
                           <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></span>
                           <span>Hashing Link...</span>
                        </>
                    ) : (
                        <>Generate Short Link</>
                    )}
                </button>
            </div>

            {/* Result Display */}
            {shortUrl && (
                <div className="mt-6 pt-6 border-t border-dashed border-white/10 animate-in slide-in-from-bottom-2 duration-500">
                    <div className="bg-emerald-900/10 border border-emerald-500/30 rounded-xl p-4 relative group/result">
                        <div className="absolute -top-3 left-4 bg-[#0a0a0a] px-2 text-[10px] font-mono text-emerald-500 uppercase tracking-widest">
                            Success
                        </div>
                        
                        <div className="flex items-center justify-between gap-4">
                            <code className="text-emerald-400 text-sm font-mono truncate">
                                {shortUrl}
                            </code>
                            <button 
                                onClick={() => { 
                                    navigator.clipboard.writeText(shortUrl); 
                                    setCopyStatus("COPIED TO CLIPBOARD"); 
                                    setTimeout(() => setCopyStatus("COPY ENCRYPTED LINK"), 2000);
                                }}
                                className="shrink-0 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 text-[10px] font-bold uppercase tracking-wider rounded transition-all border border-emerald-500/20 hover:border-emerald-500/50"
                            >
                                {copyStatus}
                            </button>
                        </div>
                    </div>
                    <p className="text-center text-[10px] text-gray-600 mt-3 font-mono">
                        // LINK WILL REDIRECT ANONYMOUSLY
                    </p>
                </div>
            )}

        </div>
      </div>
    </div>
  );
}