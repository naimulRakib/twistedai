import React from 'react';

export default function PremiumBackButton() {
  return (
    <a 
      href="/dashboard" 
      className="group flex items-center gap-3 px-5 py-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300 ease-out hover:scale-[1.02]"
    >
      {/* Minimal Icon Container */}
      <div className="w-5 h-5 flex items-center justify-center rounded-full bg-white/10 group-hover:bg-white group-hover:text-black text-white transition-colors duration-300">
        <svg 
          className="w-3 h-3 rotate-180 transform transition-transform group-hover:-translate-x-0.5" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"></path>
        </svg>
      </div>

      {/* Clean Text Layout */}
      <div className="flex flex-col leading-none">
        <span className="text-[9px] text-gray-400 font-medium uppercase tracking-widest mb-0.5">
          Back to
        </span>
        <span className="text-sm font-bold text-white">
          Dashboard
        </span>
      </div>
    </a>
  );
}