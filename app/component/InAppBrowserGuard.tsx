'use client';

import React, { useEffect, useState } from 'react';

export default function InAppBrowserGuard({ children }: { children: React.ReactNode }) {
  const [isInApp, setIsInApp] = useState(false);

  useEffect(() => {
    // Detect Facebook/Messenger/Instagram User Agents
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
    if (/FBAN|FBAV|Instagram|LinkedInApp/i.test(userAgent)) {
      setIsInApp(true);
    }
  }, []);

  if (isInApp) {
    return (
      <div className="fixed inset-0 z-[9999] bg-[#030303] text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mb-6 animate-bounce">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18"></path></svg>
        </div>
        <h1 className="text-2xl font-black mb-4">Open in Browser</h1>
        <p className="text-gray-400 mb-8 max-w-xs">
          For the best experience (and to download cards), you need to open this in your system browser.
        </p>
        
        {/* Visual Instructions */}
        <div className="bg-[#111] p-6 rounded-2xl border border-white/10 space-y-4 max-w-sm w-full">
            <div className="flex items-center gap-4 text-left">
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center font-bold text-sm">1</div>
                <p className="text-sm">Tap the <span className="font-bold">3 dots (...)</span> in the top right corner.</p>
            </div>
            <div className="flex items-center gap-4 text-left">
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center font-bold text-sm">2</div>
                <p className="text-sm">Select <span className="font-bold">"Open in Chrome"</span> or <span className="font-bold">"Open in Browser"</span>.</p>
            </div>
        </div>
        
        <button 
            onClick={() => setIsInApp(false)} 
            className="mt-8 text-xs text-gray-500 underline"
        >
            Continue anyway (features might break)
        </button>
      </div>
    );
  }

  return <>{children}</>;
}