"use client";

import React, { useState, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { v4 as uuidv4 } from 'uuid';
import { generateSlug } from '@/app/utils/generateSlug';

const LinkGenerator = () => {
    const [generatedLink, setGeneratedLink] = useState("");
    const [shortLink, setShortLink] = useState("");
    const [publicLink, setPublicLink] = useState("");
    const [generatedId, setGeneratedId] = useState("");
    const [linkName, setLinkName] = useState("");
    const [loading, setLoading] = useState(false);
    const [copyStatus, setCopyStatus] = useState<'full' | 'short' | 'public' | null>(null);

    // ✅ Hard guard — prevents ANY double-click/double-submit
    const isSubmitting = useRef(false);

    const fallbackCopy = (text: string) => {
        const el = document.createElement('textarea');
        el.value = text;
        el.style.cssText = 'position:fixed;opacity:0;top:0;left:0';
        document.body.appendChild(el);
        el.select();
        try { document.execCommand('copy'); } catch {}
        document.body.removeChild(el);
    };

    const handleCopy = (type: 'full' | 'short' | 'public') => {
        const text = type === 'full' ? generatedLink : type === 'short' ? shortLink : publicLink;
        if (!text) return;
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
        } else {
            fallbackCopy(text);
        }
        setCopyStatus(type);
        setTimeout(() => setCopyStatus(null), 2000);
    };

    const generateLink = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();

        // ✅ Block if already running
        if (isSubmitting.current) return;
        if (!linkName.trim()) {
            alert('Please give your link a name (e.g. "Insta Bio")');
            return;
        }

        isSubmitting.current = true;
        setLoading(true);

        try {
            const { data: userData, error: userError } = await supabase.auth.getUser();
            if (userError || !userData?.user) {
                alert('You must be logged in to create a link.');
                return;
            }

            const userId = userData.user.id;
            const uniqueId = uuidv4();
            const shortSlug = generateSlug(6);

            // 1. Insert into 'links' table
            const { error: linkError } = await supabase
                .from('links')
                .insert({ id: uniqueId, creator_user_id: userId, name: linkName.trim() });

            if (linkError) throw new Error('Failed to create link: ' + linkError.message);

            const fullUrl = `${window.location.origin}/messages/${uniqueId}`;
            const shortUrl = `${window.location.origin}/s/${shortSlug}`;
            const publicUrl = `${window.location.origin}/p/${uniqueId}`;

            // 2. Auto-create short link pointing to the inbox
            await supabase.from('short_links').insert({
                slug: shortSlug,
                original_url: fullUrl,
                creator_id: userId,
            });

            // 3. Save to link history with name
            const { error: historyError } = await supabase
                .from('linkhistory')
                .insert({
                    content: fullUrl,
                    creator_user_id: userId,
                    author_name: linkName.trim(),
                });

            if (historyError) throw new Error('Failed to save history: ' + historyError.message);

            setGeneratedLink(fullUrl);
            setShortLink(shortUrl);
            setPublicLink(publicUrl);
            setGeneratedId(uniqueId);
            setLinkName("");
        } catch (err: any) {
            console.error('Link creation error:', err);
            alert(err.message || 'Something went wrong.');
        } finally {
            setLoading(false);
            isSubmitting.current = false;
        }
    };

    return (
        <div className="min-h-screen bg-[#0b1120] text-slate-300 flex items-center justify-center p-4 font-sans">

            <div className="flex flex-col items-center w-full max-w-lg animate-in zoom-in-95 duration-500">

                {/* Icon */}
                <div className="relative group mb-8">
                    <div className="absolute -inset-2 bg-emerald-500/20 rounded-full blur-xl group-hover:bg-emerald-500/30 transition-all duration-500"></div>
                    <div className="relative w-24 h-24 bg-slate-900 border border-slate-800 rounded-full flex items-center justify-center shadow-2xl ring-1 ring-white/10">
                        <svg className="w-10 h-10 text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.6)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path>
                        </svg>
                    </div>
                </div>

                {/* Heading */}
                <h2 className="text-3xl font-bold text-white mb-3 tracking-tight">Generate New Channel</h2>
                <p className="text-slate-400 mb-10 max-w-md text-center leading-relaxed">
                    Create a unique, traceable link for your Instagram Story or TikTok Bio.
                </p>

                {!generatedLink ? (
                    <>
                        {/* Name Input */}
                        <input
                            type="text"
                            className="w-full text-white bg-slate-900 border border-slate-700 placeholder-slate-500 p-4 mb-4 rounded-xl focus:outline-none focus:border-emerald-500/50 transition-all"
                            placeholder='Give it a name e.g. "Insta Bio"...'
                            value={linkName}
                            onChange={(e) => setLinkName(e.target.value)}
                            disabled={loading}
                        />

                        {/* Generate Button */}
                        <button
                            onClick={generateLink}
                            disabled={loading}
                            className="group relative px-8 py-4 mb-12 w-full sm:w-auto bg-gradient-to-r from-emerald-600 to-cyan-600 rounded-xl font-bold text-white shadow-lg shadow-emerald-900/40 hover:shadow-emerald-500/25 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0 flex items-center justify-center gap-2"
                        >
                            <div className="absolute inset-0 bg-white/20 group-hover:bg-white/10 transition-colors"></div>
                            <span className="relative flex items-center justify-center gap-2">
                                {loading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0"></div>
                                        Creating...
                                    </>
                                ) : '+ Create Unique Link'}
                            </span>
                        </button>
                    </>
                ) : (
                    /* SUCCESS DASHBOARD */
                    <div className="w-full space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-2xl flex items-center gap-3">
                            <span className="text-xl">✅</span>
                            <div>
                                <h3 className="font-bold">Link Generated Successfully!</h3>
                                <p className="text-xs text-emerald-500/80">Your channel is ready to receive secrets.</p>
                            </div>
                        </div>

                        <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] ring-1 ring-white/5 space-y-5">
                            {/* Anonymous Link */}
                            <div>
                                <div className="flex flex-col gap-1 mb-2">
                                    <p className="text-emerald-400 text-xs font-bold uppercase tracking-wider">👻 Anonymous Link</p>
                                    <p className="text-slate-500 text-[10px]">Put this in your bio or share card.</p>
                                </div>
                                <div className="relative flex items-center group">
                                    <input
                                        type="text"
                                        readOnly
                                        value={shortLink || generatedLink}
                                        className="relative w-full bg-slate-950 border border-emerald-500/20 text-emerald-100 text-sm rounded-xl py-4 pl-4 pr-24 focus:outline-none font-mono shadow-inner"
                                    />
                                    <button
                                        onClick={() => handleCopy(shortLink ? 'short' : 'full')}
                                        className={`absolute right-2 top-2 bottom-2 px-4 border rounded-lg text-xs font-bold transition-all duration-200 ${
                                            (copyStatus === 'short' || copyStatus === 'full')
                                                ? 'bg-emerald-500 text-black border-emerald-500'
                                                : 'bg-emerald-500/10 hover:bg-emerald-500 hover:text-black border-emerald-500/30 text-emerald-400'
                                        }`}
                                    >
                                        {copyStatus === 'short' || copyStatus === 'full' ? '✓ Copied' : 'COPY'}
                                    </button>
                                </div>
                            </div>

                            <div className="h-px bg-white/5 w-full"></div>

                            {/* Public Share Link */}
                            <div>
                                <div className="flex flex-col gap-1 mb-2">
                                    <p className="text-cyan-400 text-xs font-bold uppercase tracking-wider">🌍 Public Share Link</p>
                                    <p className="text-slate-500 text-[10px]">Let everyone read the messages (Optional).</p>
                                </div>
                                <div className="relative flex items-center group">
                                    <input
                                        type="text"
                                        readOnly
                                        value={publicLink}
                                        className="relative w-full bg-slate-950 border border-cyan-500/20 text-cyan-100 text-sm rounded-xl py-4 pl-4 pr-24 focus:outline-none font-mono shadow-inner"
                                    />
                                    <button
                                        onClick={() => handleCopy('public')}
                                        className={`absolute right-2 top-2 bottom-2 px-4 border rounded-lg text-xs font-bold transition-all duration-200 ${
                                            copyStatus === 'public'
                                                ? 'bg-cyan-500 text-black border-cyan-500'
                                                : 'bg-cyan-500/10 hover:bg-cyan-500 hover:text-black border-cyan-500/30 text-cyan-400'
                                        }`}
                                    >
                                        {copyStatus === 'public' ? '✓ Copied' : 'COPY'}
                                    </button>
                                </div>
                            </div>

                            <div className="h-px bg-white/5 w-full"></div>

                            {/* Private Inbox Button */}
                            <div className="pt-2">
                                <a 
                                    href={`/messages/${generatedId}`}
                                    className="w-full py-4 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl flex items-center justify-center gap-3 text-sm font-bold text-white transition-all group"
                                >
                                    <span className="text-lg group-hover:scale-125 transition-transform">📬</span>
                                    View Private Inbox
                                </a>
                                <p className="text-center text-[10px] text-gray-500 mt-2">Check the messages sent to this specific link.</p>
                            </div>
                        </div>

                        {/* Reset Button */}
                        <button
                            onClick={() => {
                                setGeneratedLink("");
                                setShortLink("");
                                setPublicLink("");
                                setGeneratedId("");
                                setLinkName("");
                            }}
                            className="w-full text-center text-xs text-slate-500 hover:text-slate-300 uppercase tracking-widest font-bold py-4"
                        >
                            Create Another Link
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LinkGenerator;
