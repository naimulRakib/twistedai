'use client';

import React, { useState, useRef, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { generateAndSaveImageAction, generateSuggestedRepliesAction } from '../../actions';
import { useToast } from '@/app/context/ToastContext';
import HavingTrouble from '../../component/SystemDetails/HavingTrouble'
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

function CardGeneratorContent() {
    const toast =useToast();
  const searchParams = useSearchParams();
  const importedMessage = searchParams.get('msg');
  const importedReply = searchParams.get('reply');
  
  // --- STATE ---
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

  const getFontSize = (text: string, type: 'message' | 'reply') => {
    const len = text.length;
    if (type === 'message') {
        if (len < 20) return "text-xl leading-tight";
        if (len < 50) return "text-lg leading-tight";
        if (len < 100) return "text-md leading-snug";
        return "text-sm leading-relaxed";
    } else {
        if (len < 30) return "text-xl leading-tight";
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
        const aiReplies = await generateSuggestedRepliesAction(message);
        setSuggestions(aiReplies);
    } catch (error) { console.error(error); } finally { setIsGeneratingText(false); }
  };

  const handleGenerateCard = async () => {
    if (!message || !reply) return toast.info("Please Sign Up or Fill in all fields.");
    setIsGeneratingImage(true);
    try {
      const publicImageUrl = await generateAndSaveImageAction(userPrompt, message, reply, selectedModel);
      setBackgroundImage(publicImageUrl);
    } catch (e) { console.error(e); } finally { setIsGeneratingImage(false); }
  };

  const downloadCard = async () => {
    const html2canvas = (await import('html2canvas-pro')).default;
    if (cardRef.current) {
        const canvas = await html2canvas(cardRef.current, { useCORS: true, scale: 3 });
        const link = document.createElement('a');
        link.href = canvas.toDataURL('image/png');
        link.download = 'card.png';
        link.click();
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

                    {/* AI Model Selector (UPDATED GRID) */}
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

                     <div className="relative grid gap-2">
                          <label className="text-xs font-mono text-gray-400 uppercase">Message</label>
                        <input 
                            type="text"
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
                <div 
                    ref={cardRef}
                    className={`relative ${selectedSize.ratio} w-full max-w-[340px] rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between p-8 transition-all duration-500 ease-in-out border-4
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
                        <div className={`p-3 shadow-lg transform rotate-1 transition-all ${selectedFrame === 'social' ? 'bg-white rounded-3xl text-black text-center' : selectedFrame === 'paper' ? 'bg-white border-2 border-black text-black font-mono rounded-none' : 'bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl text-white'}`}>
                            <p className={`${getFontSize(importedMessage || message || "Waiting...", 'message')} font-bold break-words leading-snug`}>
                                {importedMessage || message || 'Waiting for secret...'}
                            </p>
                        </div>

                        {reply && (
                            <div className={`transform -rotate-1 mt-4 transition-all ${selectedFrame === 'social' ? 'bg-black/60 backdrop-blur-md rounded-2xl p-4 text-white text-center' : selectedFrame === 'paper' ? 'bg-black/60 backdrop-blur-md  text-white p-4 border-2 border-black font-mono' : 'bg-black/60 backdrop-blur-xl border-l-4 border-purple-500 p-4 rounded-r-xl shadow-lg'}`}>
                                <p className={`${getFontSize(reply, 'reply')} font-bold mb-2 break-words leading-relaxed`}>{reply}</p>
                                <p className={`text-[10px] uppercase tracking-widest opacity-70 ${selectedFrame === 'paper' ? 'font-mono' : 'font-sans'}`}>@{handle.replace('@','')}</p>
                            </div>
                        )}
                    </div>

                    <div className="relative z-10 mt-auto pt-4 text-center">
                        <div className={`inline-block px-3 py-1 rounded-full ${selectedFrame === 'social' ? 'bg-white/20 backdrop-blur-md text-white' : selectedFrame === 'paper' ? 'bg-black text-white' : 'bg-black/50 backdrop-blur-sm border border-white/10 text-gray-400'}`}>
                            <p className="text-[9px] uppercase tracking-[0.2em] font-bold">Twisted.ai</p>
                        </div>
                    </div>
                </div>
            </div>

            {backgroundImage && (
                <button onClick={downloadCard} className="bg-white/10 border border-white/10 hover:bg-white/20 text-white px-8 py-3 rounded-xl font-bold transition flex items-center gap-2">
                    Download Image
                </button>
            )}
        </div>

      </div>

      {/* --- MODAL (Standard) --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-lg bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
                <div className="p-5 border-b border-white/10 flex justify-between items-center bg-white/5">
                    <h3 className="text-lg font-bold text-white">Select Background</h3>
                    <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white">✕</button>
                </div>
                <div className="flex border-b border-white/10">
                    <button onClick={() => setActiveTab('upload')} className={`flex-1 py-3 text-sm font-bold transition-colors ${activeTab === 'upload' ? 'bg-white/10 text-white border-b-2 border-purple-500' : 'text-gray-500 hover:text-gray-300'}`}>📤 Upload</button>
                    <button onClick={() => setActiveTab('library')} className={`flex-1 py-3 text-sm font-bold transition-colors ${activeTab === 'library' ? 'bg-white/10 text-white border-b-2 border-purple-500' : 'text-gray-500 hover:text-gray-300'}`}>📚 Library</button>
                </div>
                <div className="p-6 overflow-y-auto flex-1">
                    {activeTab === 'upload' && (
                        <div className="flex flex-col items-center justify-center h-full py-10 border-2 border-dashed border-white/10 rounded-xl bg-white/5 hover:bg-white/10 transition-colors relative">
                            {isUploading ? <p className="text-sm font-bold animate-pulse">Uploading...</p> : (
                                <>
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
      )} <br /> <br />
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