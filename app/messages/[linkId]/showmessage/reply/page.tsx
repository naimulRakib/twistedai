'use client';

import React, { useState, useRef, useEffect } from 'react';
import { generatePromptAction, generateAndSaveImageAction, generateSuggestedRepliesAction } from '../../../../actions';

interface Props {
  importedMessage?: string; 
}

// --- HELPER: Cleans tags for Visual Display only ---
const cleanContent = (text: string) => {
  if (!text) return "";
  // Removes [LAUGH], [ROAST], etc. from the start of the string
  return text.replace(/^\[(LAUGH|ROAST|QUESTION|IDEA|LETTER|SECRET)\]\s*/i, '');
};

export default function CardGenerator({ importedMessage }: Props) {
  
  // --- STATE ---
  // 'message' retains the RAW content (including [TAG]) so AI can read it
  const [message, setMessage] = useState("");
  const [reply, setReply] = useState("");
  const [handle, setHandle] = useState("@user"); // Default handle
  const [suggestions, setSuggestions] = useState<string[]>([]);
  
  // Loading States
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isGeneratingText, setIsGeneratingText] = useState(false);
  
  const [backgroundImage, setBackgroundImage] = useState("");
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (importedMessage) {
      setMessage(importedMessage);
    }
  }, [importedMessage]);

  // --- LOGIC HANDLERS ---
  const handleAiTextReply = async () => {
    if (!message || message.length < 2) return alert("Message too short for AI.");
    setIsGeneratingText(true);
    setSuggestions([]);
    try {
        // We pass the RAW 'message' here (including [LAUGH]) 
        // so the AI knows the context/tone.
        const aiReplies = await generateSuggestedRepliesAction(message);
        setSuggestions(aiReplies);
    } catch (error) {
        console.error("AI Text Error:", error);
    } finally {
        setIsGeneratingText(false);
    }
  };

  const handleSelectReply = (text: string) => {
    setReply(text);
    navigator.clipboard.writeText(text); 
  };

  const handleGenerateCard = async () => {
    if (!message || !reply) return alert("Fill in all fields.");
    setIsGeneratingImage(true);
    try {
      // We also pass the RAW message to image generator so it knows the mood
      const designPrompt = await generatePromptAction(message, reply);
      const publicImageUrl = await generateAndSaveImageAction(designPrompt, message, reply);
      setBackgroundImage(publicImageUrl);
    } catch (error) {
      console.error(error);
      alert("Image generation failed.");
    } finally {
      setIsGeneratingImage(false);
    }
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
           await navigator.share({ files: [file] });
         } else {
           alert("Sharing not supported.");
         }
       });
     } catch (e) { console.error(e); }
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

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => setBackgroundImage(reader.result as string);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-purple-500 selection:text-white relative overflow-hidden flex flex-col items-center py-10">

      {/* --- DYNAMIC BACKGROUND CSS --- */}
      <style jsx>{`
        @keyframes blob { 0% { transform: translate(0px, 0px) scale(1); } 33% { transform: translate(30px, -50px) scale(1.1); } 66% { transform: translate(-20px, 20px) scale(0.9); } 100% { transform: translate(0px, 0px) scale(1); } }
        .animate-blob { animation: blob 7s infinite; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
      `}</style>

      {/* --- BACKGROUND LAYERS --- */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-purple-900/20 rounded-full blur-[100px] animate-blob" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-blue-900/20 rounded-full blur-[100px] animate-blob animation-delay-2000" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
      </div>

      {/* --- MAIN CONTENT --- */}
      <div className="relative z-10 w-full max-w-6xl px-4 grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        
        {/* LEFT COLUMN: CONTROLS */}
        <div className="space-y-6">
            
            <div className="mb-2">
                <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
                    Card Designer
                </h1>
                <p className="text-gray-500 text-sm">Craft the perfect response.</p>
            </div>

            {/* Glass Panel */}
            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
                
                {/* Decorative Line */}
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-30"></div>

                <div className="space-y-5">
                    
                    {/* 1. Handle Input */}
                    <div className="group">
                        <label className="text-xs font-mono text-gray-400 uppercase tracking-wider mb-1 block">Your Handle</label>
                        <input 
                            type="text"
                            value={handle} 
                            onChange={(e) => setHandle(e.target.value)} 
                            placeholder="@username"
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500/50 focus:bg-black/60 transition-all"
                        />
                    </div>

                    {/* 2. AI Reply Generator */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-end">
                            <label className="text-xs font-mono text-gray-400 uppercase tracking-wider block">Response</label>
                            <button
                                onClick={handleAiTextReply}
                                disabled={isGeneratingText || !message}
                                className="text-[10px] font-bold text-white bg-gradient-to-r from-purple-600 to-blue-600 px-3 py-1.5 rounded-lg hover:shadow-lg hover:shadow-purple-500/20 transition-all disabled:opacity-50 flex items-center gap-1"
                            >
                                {isGeneratingText ? (
                                    <span className="animate-pulse">Thinking...</span>
                                ) : (
                                    <>⚡ AI Suggest</>
                                )}
                            </button>
                        </div>

                        {/* Suggestions Chips */}
                        {suggestions.length > 0 && (
                            <div className="flex flex-wrap gap-2 animate-in fade-in slide-in-from-top-2">
                                {suggestions.map((s, i) => (
                                    <button 
                                        key={i}
                                        onClick={() => handleSelectReply(s)}
                                        className="text-xs bg-white/5 border border-white/10 text-gray-300 px-3 py-2 rounded-lg hover:bg-purple-500/20 hover:border-purple-500/50 hover:text-white transition-all text-left"
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Reply Text Area */}
                        <textarea 
                            value={reply} 
                            onChange={(e) => setReply(e.target.value)} 
                            placeholder="Write your reply or select one above..."
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500/50 focus:bg-black/60 transition-all min-h-[100px] resize-none"
                        />
                    </div>

                    {/* 3. Tools: Generate & Upload */}
                    <div className="grid grid-cols-2 gap-4 pt-2">
                        {/* AI Generate Button */}
                        <button 
                            onClick={handleGenerateCard}
                            disabled={isGeneratingImage}
                            className="col-span-2 md:col-span-1 bg-white text-black font-bold py-3 rounded-xl hover:bg-gray-200 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isGeneratingImage ? (
                                <span className="animate-pulse">Designing...</span>
                            ) : (
                                <>🎨 Generate Design</>
                            )}
                        </button>

                        {/* Custom Upload Button */}
                        <label className="col-span-2 md:col-span-1 cursor-pointer bg-white/5 border border-white/10 text-gray-300 font-bold py-3 rounded-xl hover:bg-white/10 hover:text-white transition-all flex items-center justify-center gap-2 group">
                            <svg className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                            <span>Upload BG</span>
                            <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                        </label>
                    </div>

                </div>
            </div>
        </div>

        {/* RIGHT COLUMN: PREVIEW & ACTIONS */}
        <div className="flex flex-col items-center space-y-6 sticky top-10">
            
            {/* CARD PREVIEW CONTAINER */}
            <div className="relative group">
                {/* Glow Effect */}
                <div className="absolute -inset-1 bg-gradient-to-tr from-purple-600 to-blue-600 rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
                
                {/* The Actual Card */}
                <div 
                    ref={cardRef}
                    className="relative aspect-[9/16] w-full max-w-[320px] bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/10 flex flex-col justify-between p-6"
                    style={{
                        backgroundImage: backgroundImage ? `url(${backgroundImage})` : 'linear-gradient(135deg, #1a1a1a 0%, #2d1b4e 100%)',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                    }}
                >
                    {/* Dark Overlay */}
                    <div className="absolute inset-0 bg-black/20 pointer-events-none"></div>

                    {/* Content Layer */}
                    <div className="relative z-10 flex flex-col h-full justify-center space-y-6">
                        
                        {/* Question Bubble */}
                        <div className="bg-white/10 backdrop-blur-md border border-white/20 p-5 rounded-2xl shadow-lg transform rotate-1">
                            {/* HERE WE USE cleanContent SO THE TAG DOES NOT SHOW IN THE IMAGE */}
                            <p className="text-lg font-bold text-white leading-relaxed drop-shadow-md">
                                {cleanContent(importedMessage || message) || 'Waiting for secret...'}
                            </p>
                        </div>

                        {/* Answer Bubble */}
                        {reply && (
                            <div className="bg-black/60 backdrop-blur-md border-l-4 border-purple-500 p-4 rounded-r-xl shadow-lg transform -rotate-1 mt-4">
                                <p className="text-xl font-bold text-white leading-tight mb-2">
                                    {reply}
                                </p>
                                <p className="text-xs font-mono text-purple-300 tracking-widest uppercase">
                                    {handle}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Card Footer */}
                    <div className="relative z-10 mt-auto pt-4 text-center">
                        <div className="inline-block bg-black/50 backdrop-blur-sm px-3 py-1 rounded-full border border-white/10">
                            <p className="text-[8px] text-gray-400 uppercase tracking-[0.2em]">
                                Twisted.ai • Anonymous
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ACTION BUTTONS */}
            {backgroundImage && (
                <div className="flex gap-4 w-full max-w-[320px] animate-in fade-in slide-in-from-bottom-4">
                    <button 
                        onClick={downloadCard} 
                        className="flex-1 bg-white/10 border border-white/10 hover:bg-white/20 text-white py-3 rounded-xl font-bold transition flex items-center justify-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                        Save
                    </button>
                    <button 
                        onClick={shareCard} 
                        className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:shadow-lg hover:shadow-purple-500/30 text-white py-3 rounded-xl font-bold transition flex items-center justify-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path></svg>
                        Share
                    </button>
                </div>
            )}

        </div>

      </div>
    </div>
  );
}