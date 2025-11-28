'use client';

import React, { useState, useRef } from 'react';

export default function ShareCardGenerator() {
  // --- STATE ---
  const [displayName, setDisplayName] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [profileImage, setProfileImage] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [loading, setLoading] = useState(false);
  const [copyStatus, setCopyStatus] = useState("Copy Link");

  const cardRef = useRef<HTMLDivElement>(null);
  const fileInputRefProfile = useRef<HTMLInputElement>(null);
  const fileInputRefCover = useRef<HTMLInputElement>(null);

  // --- HANDLERS ---

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'profile' | 'cover') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (type === 'profile') setProfileImage(e.target?.result as string);
        else setCoverImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // 1. COPY LINK LOGIC
  const handleCopyLink = () => {
    if (!linkUrl) return alert("Please enter your link first!");
    navigator.clipboard.writeText(linkUrl);
    setCopyStatus("COPIED! ✅");
    setTimeout(() => setCopyStatus("Copy Link"), 2000);
  };

  // 2. GENERATE BLOB (Helper for Sharing)
  const generateBlob = async () => {
    if (!cardRef.current) return null;
    const html2canvas = (await import('html2canvas-pro')).default;
    const canvas = await html2canvas(cardRef.current, {
      scale: 3, // High Quality for Mobile Screens
      useCORS: true,
      backgroundColor: '#050505',
    });
    return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
  };

  // 3. NATIVE SHARE (Mobile: Insta, FB, Snapchat)
  const handleNativeShare = async () => {
    setLoading(true);
    try {
      const blob = await generateBlob();
      if (!blob) return;

      const file = new File([blob], 'twisted-story.png', { type: 'image/png' });

      // Check if browser supports sharing files (Mobile mostly)
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        
        // Auto-copy link before sharing so it's ready for the sticker
        if (linkUrl) navigator.clipboard.writeText(linkUrl);

        await navigator.share({
          files: [file],
          title: 'Twisted Share',
          text: 'Send me an anonymous message! 🤫',
        });
      } else {
        // Fallback for Desktop
        alert("Sharing not supported on this device. Downloading image instead.");
        handleDownload();
      }
    } catch (e) {
      console.error("Share Error:", e);
      // Often user cancelled share, ignore
    } finally {
      setLoading(false);
    }
  };

  // 4. MANUAL DOWNLOAD (Desktop)
  const handleDownload = async () => {
    if (!cardRef.current) return;
    setLoading(true);
    try {
      const html2canvas = (await import('html2canvas-pro')).default;
      const canvas = await html2canvas(cardRef.current, {
        scale: 3,
        useCORS: true,
        backgroundColor: '#050505',
      });
      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = image;
      link.download = `twisted-story-${Date.now()}.png`;
      link.click();
    } catch (e) {
      console.error(e);
      alert("Failed to generate image");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4 grid grid-cols-1 lg:grid-cols-2 gap-12 items-start animate-in fade-in slide-in-from-bottom-4 duration-500 ">
      
      {/* --- LEFT: CONTROL PANEL --- */}
      <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl p-8 shadow-2xl order-2 lg:order-1">
        
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
          <span className="p-2 bg-emerald-500/20 rounded-xl text-emerald-400 text-xl">🎨</span>
          Story Studio
        </h2>

        <div className="space-y-6">
            
            {/* 1. Link Input with Copy Button */}
            <div className="space-y-2 ">
                <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Your Secret Link (Required)</label>
                <div className="grid gap-2">
                    <input 
                        type="text" 
                        value={linkUrl}
                        onChange={(e) => setLinkUrl(e.target.value)}
                        placeholder="twisted.ai/m/xyz..."
                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-emerald-500/50 outline-none transition-all placeholder-gray-700"
                    />
                    <button 
                        onClick={handleCopyLink}
                        className="bg-white/10 hover:bg-white/20 text-white font-bold px-4 p-4 rounded-xl transition-colors text-xs uppercase tracking-wider border border-white/5"
                    >
                        {copyStatus}
                    </button>
                </div>
                <p className="text-[10px] text-emerald-500/80">* Link auto-copied when you click Share.</p>
            </div>

            {/* 2. Name Input */}
            <div className="space-y-2">
                <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Display Name (Optional)</label>
                <input 
                    type="text" 
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. Agent Zero"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-emerald-500/50 outline-none transition-all placeholder-gray-700"
                />
            </div>

            {/* 3. Upload Grid */}
            <div className="grid grid-cols-2 gap-4">
                <div 
                    onClick={() => fileInputRefProfile.current?.click()}
                    className="cursor-pointer border border-dashed border-white/20 rounded-xl p-6 hover:bg-white/5 transition flex flex-col items-center justify-center gap-3 group bg-black/20"
                >
                    <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center group-hover:scale-110 transition shadow-lg shadow-purple-500/10">
                        <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                    </div>
                    <span className="text-xs text-gray-400 font-bold uppercase tracking-wide group-hover:text-white">Profile Pic</span>
                    <input type="file" ref={fileInputRefProfile} className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'profile')} />
                </div>

                <div 
                    onClick={() => fileInputRefCover.current?.click()}
                    className="cursor-pointer border border-dashed border-white/20 rounded-xl p-6 hover:bg-white/5 transition flex flex-col items-center justify-center gap-3 group bg-black/20"
                >
                    <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center group-hover:scale-110 transition shadow-lg shadow-blue-500/10">
                        <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                    </div>
                    <span className="text-xs text-gray-400 font-bold uppercase tracking-wide group-hover:text-white">Background</span>
                    <input type="file" ref={fileInputRefCover} className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'cover')} />
                </div>
            </div>

            <div className="h-px bg-white/10 my-4"></div>

            {/* 4. SHARE ACTIONS */}
            <div className="space-y-3">
                <button 
                    onClick={handleNativeShare}
                    disabled={loading}
                    className="w-full py-4 bg-gradient-to-r from-pink-600 to-purple-600 rounded-xl font-bold text-white hover:shadow-[0_0_25px_rgba(236,72,153,0.4)] transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3 group"
                >
                    {loading ? (
                        <>
                           <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                           <span>Processing...</span>
                        </>
                    ) : (
                        <>
                           <svg className="w-6 h-6 text-white group-hover:rotate-12 transition-transform" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                           Share to Instagram / FB
                        </>
                    )}
                </button>
                
                {/* Desktop Download Fallback */}
                <button 
                    onClick={handleDownload}
                    disabled={loading}
                    className="w-full py-3 bg-white/5 border border-white/10 rounded-xl font-bold text-gray-300 hover:bg-white/10 hover:text-white transition-all text-sm flex items-center justify-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                    Save to Gallery
                </button>
            </div>

        </div>
      </div>


      {/* --- RIGHT: LIVE PREVIEW --- */}
      <div className="flex justify-center relative top-10 order-1 lg:order-2">
        
        {/* Container for Glow */}
        <div className="relative group">
            {/* Glow */}
            <div className="absolute -inset-2 bg-gradient-to-b from-purple-600 to-emerald-600 rounded-[40px] blur-xl opacity-30 group-hover:opacity-50 transition duration-500"></div>

            {/* --- ACTUAL CARD TO CAPTURE --- */}
            <div 
                ref={cardRef}
                className="relative w-[320px] h-[568px] bg-black rounded-[32px] overflow-hidden flex flex-col items-center text-center shadow-2xl border border-white/10"
                style={{
                    backgroundImage: coverImage ? `url(${coverImage})` : undefined,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                }}
            >
                {/* Default BG Overlay */}
                {!coverImage && (
                    <>
                        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-purple-900"></div>
                        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                        <div className="absolute top-[-20%] left-[-20%] w-[400px] h-[400px] bg-emerald-500/20 rounded-full blur-[100px]"></div>
                    </>
                )}

                {/* Dark Overlay */}
                <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"></div>

                {/* Content Layer */}
                <div className="relative z-10 flex flex-col h-full w-full p-8">
                    
                    {/* Branding */}
                    <div className="text-[10px] font-mono text-white/50 uppercase tracking-[0.3em] mb-auto">
                        Twisted.ai
                    </div>

                    {/* Center */}
                    <div className="flex flex-col items-center gap-6 my-auto">
                        
                        {/* Profile Pic */}
                        <div className="w-28 h-28 rounded-full p-1 bg-gradient-to-tr from-white to-gray-500 shadow-2xl">
                            <img 
                                src={profileImage || `https://api.dicebear.com/9.x/identicon/svg?seed=${displayName || 'anon'}`} 
                                className="w-full h-full rounded-full object-cover bg-black border-4 border-black"
                                crossOrigin="anonymous"
                            />
                        </div>

                        {/* Question */}
                        <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-6 rounded-3xl w-full shadow-xl transform rotate-1">
                            <h1 className="text-2xl font-black text-white leading-tight drop-shadow-md">
                                Send me a <span className="text-emerald-400">Secret</span> Message!
                            </h1>
                            <p className="text-xs text-gray-300 mt-2 font-medium">
                                I won't know it's you 🤫
                            </p>
                        </div>

                        {/* Name */}
                        <div className="bg-black/60 px-4 py-2 rounded-full border border-white/10">
                            <p className="text-sm font-bold text-white">
                                @{displayName || "Anonymous"}
                            </p>
                        </div>
                    </div>

                    {/* Bottom CTA */}
                    <div className="mt-auto pt-8 animate-bounce">
                         <div className="flex flex-col items-center gap-2">
                            <p className="text-[10px] font-bold text-white uppercase tracking-widest bg-black/60 px-3 py-1 rounded-lg backdrop-blur-md border border-white/10">
                                Click Link Sticker Below
                            </p>
                            <svg className="w-8 h-8 text-white drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path></svg>
                         </div>
                    </div>

                </div>
            </div>
        </div>

      </div>
    </div>
  );
}