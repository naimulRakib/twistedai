'use client';

import React from 'react';
import Link from 'next/link';


import CartoonFeatures from './SystemDetails/CartoonFeautures';
export default function HomeUI() {
  return (
    <div className="min-h-screen bg-[#030303] text-white font-sans selection:bg-purple-500 selection:text-white relative overflow-x-hidden">

      {/* --- CUSTOM CSS ANIMATIONS --- */}
      <style jsx>{`
        @keyframes float {
          0% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
          100% { transform: translateY(0px) rotate(0deg); }
        }
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-blob { animation: blob 10s infinite; }
        .delay-1000 { animation-delay: 1s; }
        .delay-2000 { animation-delay: 2s; }
        .delay-3000 { animation-delay: 3s; }
      `}</style>

      {/* --- DYNAMIC BACKGROUND LAYERS --- */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[70vw] md:w-[40vw] h-[70vw] md:h-[40vw] bg-purple-900/30 rounded-full blur-[80px] md:blur-[100px] animate-blob" />
        <div className="absolute top-[20%] right-[-10%] w-[60vw] md:w-[35vw] h-[60vw] md:h-[35vw] bg-pink-900/20 rounded-full blur-[80px] md:blur-[100px] animate-blob delay-2000" />
        <div className="absolute bottom-[-10%] left-[20%] w-[80vw] md:w-[50vw] h-[80vw] md:h-[50vw] bg-indigo-900/20 rounded-full blur-[80px] md:blur-[100px] animate-blob delay-1000" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
      </div>

      {/* --- NAVBAR --- */}
      <nav className="relative z-50 w-full max-w-7xl mx-auto px-6 py-6 flex justify-between items-center">
        {/* Logo */}
        <div className="flex items-center gap-2 font-bold text-xl md:text-2xl tracking-tighter">
          <div className="w-8 h-8 bg-gradient-to-tr from-purple-500 to-pink-500 rounded-lg flex items-center justify-center shadow-lg shadow-purple-500/30">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
          </div>
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
            Twisted<span className="text-purple-500">.ai</span>
          </span>
        </div>

        {/* Login Button */}
        <div className="flex items-center gap-4">
          <span className="hidden md:block text-xs text-gray-400 font-medium">Already twisted?</span>
          <Link href="/login">
            <button className="px-5 py-2 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 transition text-sm font-semibold backdrop-blur-md">
              Login
            </button>
          </Link>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 pt-8 pb-16 md:pt-20 md:pb-20 flex flex-col md:flex-row items-center gap-12 md:gap-20">
        
        {/* LEFT: TEXT & CTA */}
        <div className="flex-1 text-center md:text-left w-full">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-900/30 border border-purple-500/30 mb-6 backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
            </span>
            <span className="text-[10px] font-bold tracking-widest uppercase text-purple-300">
              AI Detective Active
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tight leading-[1.1] mb-6">
            Get <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500">Brutal</span> <br/>
            Honesty.
          </h1>
          
          <p className="text-gray-400 text-base md:text-xl mb-8 max-w-lg mx-auto md:mx-0 leading-relaxed">
            Let your friends send anonymous messages. Our AI decodes their vibe, roast their battery life, and exposes their location.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start w-full">
            {/* Primary CTA: Sign Up */}
            <Link href="/signup" className="w-full sm:w-auto">
              <button className="w-full px-8 py-4 bg-white text-black text-lg font-bold rounded-xl hover:scale-105 transition-transform shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] flex items-center justify-center gap-2">
                Get My Link / Sign Up
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path></svg>
              </button>
            </Link>

            {/* Secondary CTA: Instant Access */}
            <div className="w-full sm:w-auto">
           
            </div>
          </div>
          
          <p className="mt-4 text-xs text-gray-500">
            *No sign-up required for Guest Mode.
          </p>
        </div>

        {/* RIGHT: STICKER UI VISUALS */}
        <div className="flex-1 w-full relative h-[450px] md:h-[500px] flex items-center justify-center transform scale-90 sm:scale-100 md:scale-100 origin-top">
            
            {/* Floating Emoji BG */}
            <div className="absolute top-0 right-4 md:right-10 text-5xl md:text-6xl animate-float delay-1000 opacity-80">👀</div>
            <div className="absolute bottom-10 left-4 md:left-10 text-5xl md:text-6xl animate-float delay-2000 opacity-60 blur-[2px]">💣</div>
            <div className="absolute top-1/2 left-0 text-3xl md:text-4xl animate-float delay-3000 opacity-40">🕵️</div>

            {/* CARD 1: The Question (Back Layer) */}
            <div className="absolute top-10 right-6 md:right-10 w-56 md:w-64 bg-gradient-to-br from-orange-400 to-pink-600 p-6 rounded-3xl shadow-2xl rotate-12 opacity-40 blur-[1px] animate-float delay-1000">
               <div className="bg-white/20 h-4 w-1/2 rounded-full mb-4"></div>
               <div className="bg-white/20 h-4 w-3/4 rounded-full"></div>
            </div>

            {/* CARD 2: The Main Interface (Front Layer) */}
            <div className="relative w-72 md:w-80 backdrop-blur-2xl bg-black/40 border border-white/10 rounded-[32px] p-6 shadow-2xl animate-float border-t-purple-500/50">
               
               {/* Header */}
               <div className="flex items-center gap-3 mb-6">
                 <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500"></div>
                 <div>
                   <div className="h-2 w-20 bg-gray-600 rounded-full mb-1"></div>
                   <div className="h-2 w-12 bg-gray-700 rounded-full"></div>
                 </div>
               </div>

               {/* Message Box */}
               <div className="bg-white rounded-2xl p-6 text-center shadow-lg mb-6 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-500 to-purple-500"></div>
                  <p className="text-gray-900 font-bold text-lg mb-2">Send me anonymous messages!</p>
                  <p className="text-gray-500 text-sm">I won't know who sent it...</p>
               </div>

               {/* Input Mockup */}
               <div className="bg-white/5 rounded-xl h-12 w-full border border-white/10 flex items-center px-4 mb-4">
                  <span className="text-gray-500 text-sm">Type a secret...</span>
               </div>
               
               {/* Button Mockup */}
               <div className="bg-white text-black font-bold text-center py-3 rounded-xl shadow-lg shadow-white/10">
                  Send Secret
               </div>

               {/* The "Twisted" Badge */}
               <div className="absolute -bottom-6 -right-6 bg-red-600 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg border border-red-400 animate-pulse">
                  📍 IP DETECTED
               </div>
            </div>
        </div>
      </div>

      {/* --- FEATURE STRIP --- */}
      <div className="w-full border-y border-white/5 bg-black/50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col md:flex-row justify-center md:justify-between gap-8 md:gap-0 text-center md:text-left">
          <div className="flex flex-col md:flex-row items-center gap-3 justify-center md:justify-start">
             <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400 mb-2 md:mb-0">⚡</div>
             <div>
                <h3 className="font-bold text-sm">Instant Replies</h3>
                <p className="text-xs text-gray-500">AI generates witty comebacks.</p>
             </div>
          </div>
          <div className="flex flex-col md:flex-row items-center gap-3 justify-center md:justify-start">
             <div className="p-2 bg-red-500/10 rounded-lg text-red-400 mb-2 md:mb-0">🔋</div>
             <div>
                <h3 className="font-bold text-sm">Device Detective</h3>
                <p className="text-xs text-gray-500">We expose their battery %.</p>
             </div>
          </div>
          <div className="flex flex-col md:flex-row items-center gap-3 justify-center md:justify-start">
             <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400 mb-2 md:mb-0">🎨</div>
             <div>
                <h3 className="font-bold text-sm">Story Ready</h3>
                <p className="text-xs text-gray-500">Beautiful cards for IG/FB.</p>
             </div>
          </div>
        </div>
      </div>

    <CartoonFeatures/>

    </div>
  );
}