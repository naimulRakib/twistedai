'use client';

import React, { useState, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { generateSlug } from '../utils/generateSlug';

const LinkGenerator = () => {
    const [generatedLink, setGeneratedLink] = useState('');
    const [shortLink, setShortLink] = useState('');
    const [linkName, setLinkName] = useState('');
    const [loading, setLoading] = useState(false);
    const [copyStatus, setCopyStatus] = useState<'link' | 'short' | null>(null);
    const isSubmitting = useRef(false); // Hard guard: prevents double-click race condition

    const generateLink = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();

        if (isSubmitting.current) return;
        if (!linkName.trim()) {
            alert("Please give your link a name (e.g. 'Insta Bio')");
            return;
        }

        isSubmitting.current = true;
        setLoading(true);

        try {
            const { data: userData, error: userError } = await supabase.auth.getUser();
            if (userError || !userData?.user) throw new Error('You must be logged in.');

            const newSlug = generateSlug();
            const shortSlug = generateSlug();

            // 1. Create main link inbox
            const { data: linkData, error: linkError } = await supabase
                .from('links')
                .insert({
                    creator_user_id: userData.user.id,
                    name: linkName.trim(),
                    slug: newSlug,
                })
                .select()
                .single();

            if (linkError) throw linkError;

            const fullUrl = `${window.location.origin}/messages/${linkData.id}`;
            const shortUrl = `${window.location.origin}/s/${shortSlug}`;

            // 2. Auto-create short link pointing to the inbox
            const { error: shortLinkError } = await supabase
                .from('short_links')
                .insert({
                    slug: shortSlug,
                    original_url: fullUrl,
                    creator_id: userData.user.id,
                });
            if (shortLinkError) console.error('Short link error:', shortLinkError);

            // 3. Save to link history with name
            const { error: historyError } = await supabase
                .from('linkhistory')
                .insert({
                    content: fullUrl,
                    author_name: linkName.trim(),
                    creator_user_id: userData.user.id,
                });
            if (historyError) console.error('History error:', historyError);

            setGeneratedLink(fullUrl);
            setShortLink(shortUrl);
            setLinkName('');

        } catch (err: any) {
            console.error('Creation Error:', err);
            alert(err.message || 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
            isSubmitting.current = false;
        }
    };

    const handleCopy = (type: 'full' | 'short') => {
        const text = type === 'full' ? generatedLink : shortLink;
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
        } else {
            fallbackCopy(text);
        }
        setCopyStatus(type === 'full' ? 'link' : 'short');
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

    return (
        <div className="w-full max-w-md mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-5 sm:p-6 shadow-2xl relative overflow-hidden">

                <div className="absolute top-0 right-0 -mr-10 -mt-10 w-32 h-32 bg-emerald-500/10 rounded-full blur-[50px] pointer-events-none" />

                <div className="relative z-10">
                    <h2 className="text-lg sm:text-xl font-bold text-white mb-1">Create Secure Link</h2>
                    <p className="text-xs text-gray-500 mb-5">Generate a traceable, anonymous entry point.</p>

                    <div className="space-y-2 mb-5">
                        <label className="text-[10px] font-mono text-emerald-500 uppercase tracking-widest">Link Alias</label>
                        <input
                            type="text"
                            onChange={(e) => setLinkName(e.target.value)}
                            value={linkName}
                            placeholder="e.g. Instagram Story, TikTok Bio..."
                            disabled={loading}
                            onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/50 focus:bg-black/60 transition-all text-sm disabled:opacity-50"
                        />
                    </div>

                    <button
                        onClick={generateLink}
                        disabled={loading}
                        className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl font-bold text-black hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 flex items-center justify-center gap-2 text-sm"
                    >
                        {loading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin shrink-0" />
                                <span>Creating...</span>
                            </>
                        ) : (
                            <>
                                <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                </svg>
                                Generate Link
                            </>
                        )}
                    </button>

                    {generatedLink && (
                        <div className="mt-6 pt-5 border-t border-white/10 space-y-4 animate-in zoom-in-95 duration-300">

                            {/* Full Inbox Link */}
                            <div>
                                <label className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 block mb-1.5">
                                    // Inbox Link (Full)
                                </label>
                                <div className="flex items-center bg-black/60 border border-emerald-500/30 rounded-xl p-1 pl-3 gap-2">
                                    <input
                                        type="text"
                                        value={generatedLink}
                                        readOnly
                                        className="flex-1 min-w-0 bg-transparent text-xs font-mono text-gray-300 outline-none truncate"
                                    />
                                    <button
                                        onClick={() => handleCopy('full')}
                                        className={`shrink-0 px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                                            copyStatus === 'link' ? 'bg-emerald-500 text-black' : 'bg-white/10 text-white hover:bg-white/20'
                                        }`}
                                    >
                                        {copyStatus === 'link' ? '✓ Copied' : 'Copy'}
                                    </button>
                                </div>
                            </div>

                            {/* Short Link */}
                            {shortLink && (
                                <div>
                                    <label className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 block mb-1.5">
                                        // Short Link (Auto-Generated)
                                    </label>
                                    <div className="flex items-center bg-black/60 border border-cyan-500/30 rounded-xl p-1 pl-3 gap-2">
                                        <input
                                            type="text"
                                            value={shortLink}
                                            readOnly
                                            className="flex-1 min-w-0 bg-transparent text-xs font-mono text-gray-300 outline-none truncate"
                                        />
                                        <button
                                            onClick={() => handleCopy('short')}
                                            className={`shrink-0 px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                                                copyStatus === 'short' ? 'bg-cyan-500 text-black' : 'bg-white/10 text-white hover:bg-white/20'
                                            }`}
                                        >
                                            {copyStatus === 'short' ? '✓ Copied' : 'Copy'}
                                        </button>
                                    </div>
                                    <p className="text-[10px] text-gray-600 mt-1 font-mono">
                                        Share the short link — it auto-redirects to your inbox.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LinkGenerator;
