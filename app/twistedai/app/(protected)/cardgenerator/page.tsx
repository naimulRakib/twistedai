'use client';

import React, { useState, useRef, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { generateAndSaveImageAction, generateSuggestedRepliesAction } from '../../actions';
import { useToast } from '@/app/context/ToastContext';
import HavingTrouble from '../../component/SystemDetails/HavingTrouble';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const MODEL_OPTIONS = [
  { id: 'nebius-flux', label: 'Flux', desc: 'Nebius (Best)' },
  { id: 'cf-flux', label: 'Flux', desc: 'Cloudflare' },
  { id: 'cf-sdxl', label: '⚡ SDXL', desc: 'Cloudflare (Recommended)' },
  { id: 'cf-dreamshaper', label: '3D', desc: 'Cloudflare' },
  { id: 'pollinations-turbo', label: '🚀 Turbo', desc: 'Pollinations (Free)' },
  { id: 'pollinations-dark', label: '🌑 Dark', desc: 'Pollinations' },
];

const SIZE_OPTIONS = [
  { id: 'story', label: '📱 Story', w: 1080, h: 1920, ratio: 'aspect-[9/16]' },
  { id: 'square', label: '⬜ Square', w: 1024, h: 1024, ratio: 'aspect-square' },
];

const FRAME_OPTIONS = [
  { id: 'cyber', label: 'Magnet', bgClass: 'bg-black', textClass: 'text-white' },
  { id: 'social', label: ' Social', bgClass: 'bg-gradient-to-br from-orange-400 via-pink-500 to-purple-600', textClass: 'text-black' },
  { id: 'paper', label: 'Pen-Paper', bgClass: 'bg-[#f4f4f0]', textClass: 'text-gray-900' },
];

// --- HELPER: Cleans tags for Visual Display only ---
const cleanContent = (text: string) => {
  if (!text) return "";
  // Removes [LAUGH], [ROAST], etc. from the start of the string for display
  return text.replace(/^\[(LAUGH|ROAST|QUESTION|IDEA|LETTER|SECRET)\]\s*/i, '');
};

function CardGeneratorContent() {
  const toast = useToast();
  const searchParams = useSearchParams();
  const importedMessage = searchParams.get('msg');
  const importedReply = searchParams.get('reply');
  
  // --- STATE ---
  // 'message' retains the RAW content (including [TAG]) so AI can read it
  const [message, setMessage] = useState(importedMessage || "");
  const [reply, setReply] = useState(importedReply || "");
  const [handle, setHandle] = useState("@user");
  const [backgroundImage, setBackgroundImage] = useState("");
  
  // UI State
  const [selectedFrame, setSelectedFrame] = useState('cyber');
  const [userPrompt, setUserPrompt] = useState(""); 
  const [selectedModel, setSelectedModel] = useState("nebius-flux"); 
  const [selectedSize, setSelectedSize] = useState(SIZE_OPTIONS[0]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  
  // Loading / Modal State
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isGeneratingText, setIsGeneratingText] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'upload' | 'library'>('upload');
  const [isUploading, setIsUploading] = useState(false);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [loadingGallery, setLoadingGallery] = useState(false);

  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (importedMessage) setMessage(importedMessage);
    if (importedReply) setReply(importedReply);
  }, [importedMessage, importedReply]);

  // --- NEW: FETCH USERNAME LOGIC ---
  useEffect(() => {
    const fetchUsername = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data } = await supabase
                    .from('profiles')
                    .select('username')
                    .eq('id', user.id)
                    .single();
                
                if (data && data.username) {
                    setHandle(`@${data.username}`);
                }
            }
        } catch (error) {
            console.error("Error fetching username:", error);
        }
    };
    fetchUsername();
  }, []);

  const getFontSize = (text: string, type: 'message' | 'reply') => {
    const len = text.length;
    if (type === 'message') {
        if (len < 20) return "text-md leading-tight";
        if (len < 50) return "text-md leading-tight";
        if (len < 100) return "text-base leading-snug";
        return "text-sm leading-relaxed";
    } else {
        if (len < 30) return "text-md leading-tight";
        return "text-sm leading-relaxed";
    }
  };

  // --- LOGIC ---
  const fetchGallery = async () => {
    setLoadingGallery(true);
    try {
        const { data, error } = await supabase.storage.from('our-collection').list();
        if (error) throw error;
        if (data) {
            const urls = data.map(file => supabase.storage.from('our-collection').getPublicUrl(file.name).data.publicUrl);
            setGalleryImages(urls);
        }
    } catch (e) { console.error(e); } finally { setLoadingGallery(false); }
  };

  useEffect(() => {
      if (activeTab === 'library' && galleryImages.length === 0) fetchGallery();
  }, [activeTab]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `user-upload-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('user-uploads').upload(fileName, file);
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('user-uploads').getPublicUrl(fileName);
      setBackgroundImage(data.publicUrl);
      setIsModalOpen(false);
    } catch (error: any) { toast.error("Upload failed: " + error.message); } finally { setIsUploading(false); }
  };

  const handleAiTextReply = async () => {
    if (!message || message.length < 2) return toast.error("Message too short.");
    setIsGeneratingText(true);
    setSuggestions([]); 
    try {
        // Pass RAW message (with tag) to AI so it knows context
        const aiReplies = await generateSuggestedRepliesAction(message);
        setSuggestions(aiReplies);
    } catch (error) { console.error(error); } finally { setIsGeneratingText(false); }
  };

  const handleGenerateCard = async () => {
    if (!message || !reply) return toast.info("Please Sign Up or Fill in all fields.");
    setIsGeneratingImage(true);
    try {
      // Pass RAW message (with tag) to AI Image Generator
      const publicImageUrl = await generateAndSaveImageAction(userPrompt, message, reply, selectedModel);
      setBackgroundImage(publicImageUrl);
    } catch (e) { console.error(e); } finally { setIsGeneratingImage(false); }
  };

  const downloadCard = async () => {
    try {
      const html2canvas = (await import('html2canvas-pro')).default;
      if (cardRef.current) {
          const canvas = await html2canvas(cardRef.current, { useCORS: true, scale: 3 });
          const link = document.createElement('a');
          link.href = canvas.toDataURL('image/png');
          link.download = 'card.png';
          link.click();
      }
    } catch(e) { toast.error("Download failed"); }
  };

  const shareCard = async () => {
     if (!cardRef.current) return;
     try {
       const html2canvas = (await import('html2canvas-pro')).default;
       const canvas = await html2canvas(cardRef.current, { useCORS: true, scale: 3, backgroundColor: null });
       
       canvas.toBlob(async (blob) => {
         if (!blob) return;
         const file = new File([blob], "story.png", { type: "image/png" });
         
         if (navigator.canShare && navigator.canShare({ files: [file] })) {
           await navigator.share({
             files: [file],
             title: 'Twisted Reply',
             text: 'Check out this secret message! 🤫'
           });
         } else {
           toast.info("Sharing not supported on this device. Use Download instead.");
         }
       });
     } catch (e) { 
        console.error(e);
        toast.error("Sharing failed.");
     }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-purple-500 selection:text-white relative overflow-hidden flex flex-col items-center py-10">

      {/* --- BACKGROUND --- */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-purple-900/20 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-blue-900/20 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute inset-0 opacity-20" style={{backgroundImage: "url('https://grainy-gradients.vercel.app/noise.svg')"}}></div>
      </div>

      <div className="relative z-10 w-full max-w-6xl px-4 grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        
        {/* LEFT: CONTROLS */}
        <div className="space-y-6">
            <div className="mb-2">
                <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">Card Designer</h1>
                <p className="text-gray-500 text-sm">Customize your anonymous response.</p>
            </div>

            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
                <div className="space-y-5">
                    
                    {/* Frame Style */}
                    <div>
                        <label className="text-xs font-mono text-gray-400 uppercase tracking-wider mb-2 block">Card Style</label>
                        <div className="grid grid-cols-3 gap-2">
                            {FRAME_OPTIONS.map((frame) => (
                                <button
                                    key={frame.id}
                                    onClick={() => setSelectedFrame(frame.id)}
                                    className={`p-2 rounded-lg border text-center transition-all ${
                                        selectedFrame === frame.id 
                                        ? 'bg-purple-600 text-white border-purple-400' 
                                        : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                                    }`}
                                >
                                    <div className="text-xs font-bold">{frame.label}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Handle Input */}
                    <div className="group">
                        <label className="text-xs font-mono text-gray-400 uppercase tracking-wider mb-1 block">Your Handle</label>
                        <input type="text" value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="@username" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-purple-500/50 outline-none" />
                    </div>

                    {/* AI Model Selector */}
                    <div>
                        <label className="text-xs font-mono text-gray-400 uppercase tracking-wider mb-2 block">AI Model</label>
                        <div className="grid grid-cols-3 gap-2">
                            {MODEL_OPTIONS.map((model) => (
                                <button
                                    key={model.id}
                                    onClick={() => setSelectedModel(model.id)}
                                    className={`p-2 rounded-lg border text-left transition-all ${
                                        selectedModel === model.id 
                                        ? 'bg-blue-600/20 border-blue-500 text-white' 
                                        : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                                    }`}
                                >
                                    <div className="text-[10px] font-bold">{model.label}</div>
                                    <div className="text-[8px] opacity-60">{model.desc}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Message Input (Read Only) */}
                     <div className="relative grid gap-2">
                          <label className="text-xs font-mono text-gray-400 uppercase">Message</label>
                        <input 
                            type="text"
                            // We show raw message here so user knows what they received
                            value={message} 
                            disabled={true}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-purple-500/50 outline-none text-sm"
                        />
                    </div>

                    {/* Reply Section */}
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <label className="text-xs font-mono text-gray-400 uppercase">Reply</label>
                            <button onClick={handleAiTextReply} disabled={isGeneratingText} className="text-[10px] font-bold text-white bg-purple-600/50 px-3 py-1 rounded hover:bg-purple-500 transition-all">
                                {isGeneratingText ? "..." : "⚡ AI Suggest"}
                            </button>
                        </div>
                        {suggestions.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {suggestions.map((s, i) => (
                                    <button key={i} onClick={() => setReply(s)} className="text-xs bg-white/5 border border-white/10 text-gray-300 px-3 py-2 rounded-lg hover:text-white text-left">{s}</button>
                                ))}
                            </div>
                        )}
                        <textarea value={reply} onChange={(e) => setReply(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-purple-500/50 outline-none min-h-[80px]" placeholder="Write reply..." />
                    </div>

                    {/* Prompt Input */}
                    <div className="relative">
                        <input 
                            type="text"
                            value={userPrompt} 
                            onChange={(e) => setUserPrompt(e.target.value)} 
                            placeholder="AI Art Command (Optional)"
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-purple-500/50 outline-none text-sm"
                        />
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-4 pt-2">
                        <button onClick={handleGenerateCard} disabled={isGeneratingImage} className="col-span-2 md:col-span-1 bg-white text-black font-bold py-3 rounded-xl hover:bg-gray-200 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                            {isGeneratingImage ? <span className="animate-pulse">Designing...</span> : <>🎨 Generate New</>}
                        </button>
                        <button onClick={() => setIsModalOpen(true)} className="col-span-2 md:col-span-1 bg-white/5 border border-white/10 text-gray-300 font-bold py-3 rounded-xl hover:bg-white/10 hover:text-white transition-all flex items-center justify-center gap-2">
                            <span>📁 Upload / Library</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>

        {/* RIGHT: PREVIEW */}
        <div className="flex flex-col items-center space-y-6 sticky top-10">
            <div className="relative group">
                
                {/* Card Container */}
                <div 
                    ref={cardRef}
                    className={`relative ${selectedSize.ratio} w-full max-w-[340px] rounded-xl overflow-hidden shadow-2xl flex flex-col justify-between p-8 transition-all duration-500 ease-in-out border-4
                        ${selectedFrame === 'paper' ? 'border-black bg-[#f4f4f0]' : 'border-white/10 bg-black'}
                    `}
                    style={{
                        backgroundImage: backgroundImage 
                            ? `url(${backgroundImage})` 
                            : selectedFrame === 'social' 
                                ? 'linear-gradient(to bottom right, #f97316, #ec4899, #8b5cf6)'
                                : selectedFrame === 'paper'
                                    ? 'none'
                                    : 'linear-gradient(135deg, #1a1a1a 0%, #2d1b4e 100%)',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                    }}
                >
                    {backgroundImage && <div className="absolute inset-0 bg-black/30 pointer-events-none"></div>}
                    
                    <div className="relative z-10 flex flex-col h-full justify-center space-y-6">
                        <div className={`p-2 shadow-lg transform rotate-1 transition-all ${selectedFrame === 'social' ? 'bg-white rounded-3xl text-black text-center' : selectedFrame === 'paper' ? 'bg-white border-2 border-black text-black font-mono rounded-none' : 'bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl text-white'}`}>
                            {/* --- CLEAN CONTENT USED HERE FOR VISUAL DISPLAY --- */}
                            <p className={`${getFontSize(cleanContent(importedMessage || message) || "Waiting...", 'message')} font-bold break-words leading-snug`}>
                                {cleanContent(importedMessage || message) || 'Waiting for secret...'}
                            </p>
                        </div>

                        {reply && (
                            <div className={`transform -rotate-1 mt-4 transition-all ${selectedFrame === 'social' ? 'bg-black/60 backdrop-blur-md rounded-2xl p-2 text-white text-center' : selectedFrame === 'paper' ? 'bg-black text-white p-2 border-2 border-black font-mono' : 'bg-black/60 backdrop-blur-xl border-l-4 border-purple-500 p-2 rounded-r-xl shadow-lg'}`}>
                                <p className={`${getFontSize(reply, 'reply')} font-bold mb-2 break-words leading-relaxed`}>{reply}</p>
                                <p className={`text-[10px] uppercase tracking-widest opacity-70 ${selectedFrame === 'paper' ? 'font-mono' : 'font-sans'}`}>@{handle.replace('@','')}</p>
                            </div>
                        )}
                    </div>

                    <div className="relative z-10 mt-auto pt-4 text-center">
                       <div 
  className={`
    relative group overflow-hidden inline-flex items-center justify-center px-5 py-1.5 rounded-full transition-all duration-300 ease-out cursor-pointer
    ${selectedFrame === 'social' 
      ? 'bg-white/10 backdrop-blur-xl border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.12)] text-white ring-1 ring-white/10' 
      : selectedFrame === 'paper' 
        ? 'bg-zinc-950 border border-zinc-800 text-white shadow-xl' 
        : 'bg-black/30 backdrop-blur-sm border border-white/5 text-zinc-500 hover:bg-black/50 hover:text-zinc-300 hover:border-white/10'}
  `}
>
  {/* Inner Glow / Shine Effect */}
  <div className={`absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] ${selectedFrame === 'social' ? 'block' : 'hidden'}`} />

  {/* Text Content */}
  <p className="relative z-10 text-[10px] uppercase tracking-[0.25em] font-black drop-shadow-md bg-clip-text">
    Twst.fun
  </p>
</div>
                    </div>
                </div>
            </div>

            {/* --- ACTION BUTTONS --- */}
            {reply && (
                <div className="flex gap-3 w-full max-w-[340px]">
                    <button 
                        onClick={downloadCard} 
                        className="flex-1 bg-white/10 border border-white/10 hover:bg-white/20 text-white py-3 rounded-xl font-bold transition flex items-center justify-center gap-2 text-sm"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                        Save
                    </button>
                    
                    <button 
                        onClick={shareCard} 
                        className="flex-1 bg-gradient-to-r from-pink-600 to-purple-600 hover:shadow-lg hover:shadow-pink-500/30 text-white py-3 rounded-xl font-bold transition flex items-center justify-center gap-2 text-sm group"
                    >
                        <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                        Share
                    </button>
                </div>
            )}
        </div>

      </div>

      {/* --- MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-lg bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
                <div className="p-5 border-b border-white/10 flex justify-between items-center bg-white/5">
                    <h3 className="text-lg font-bold text-white">Select Background</h3>
                    <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white">✕</button>
                </div>
                <div className="flex border-b border-white/10">
                    <button onClick={() => setActiveTab('upload')} className={`flex-1 py-3 text-sm font-bold transition-colors ${activeTab === 'upload' ? 'bg-white/10 text-white border-b-2 border-purple-500' : 'text-gray-500 hover:text-gray-300'}`}>📤 Upload</button>
                    <button onClick={() => setActiveTab('library')} className={`flex-1 py-3 text-sm font-bold transition-colors ${activeTab === 'library' ? 'bg-white/10 text-white border-b-2 border-purple-500' : 'text-gray-500 hover:text-gray-300'}`}>📚 Our Collection</button>
                </div>
                <div className="p-6 overflow-y-auto flex-1">
                    {activeTab === 'upload' && (
                        <div className="flex flex-col items-center justify-center h-full py-10 border-2 border-dashed border-white/10 rounded-xl bg-white/5 hover:bg-white/10 transition-colors relative">
                            {isUploading ? <p className="text-sm font-bold animate-pulse">Uploading...</p> : (
                                <>
                                    <svg className="w-12 h-12 text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                    <p className="text-sm font-bold text-gray-300">Click to Upload</p>
                                    <input type="file" accept="image/*" onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                </>
                            )}
                        </div>
                    )}
                    {activeTab === 'library' && (
                        <div className="grid grid-cols-2 gap-3">
                             {loadingGallery ? <div className="text-center text-gray-500">Loading...</div> : galleryImages.map((url, i) => (
                                <button key={i} onClick={() => { setBackgroundImage(url); setIsModalOpen(false); }} className="relative aspect-[9/16] rounded-lg overflow-hidden border border-white/10 hover:border-purple-500 transition-all group">
                                    <img src={url} alt="Bg" className="w-full h-full object-cover" />
                                </button>
                             ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
      )} 
      
      <br /><br />
      <HavingTrouble/>
    </div>
  );
}

export default function CardGeneratorPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CardGeneratorContent />
    </Suspense>
  );
}