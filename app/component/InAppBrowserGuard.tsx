'use client';

import React, { useEffect, useState } from 'react';

export default function InAppBrowserGuard({ children }: { children: React.ReactNode }) {
  const [isInApp, setIsInApp] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [currentUrl, setCurrentUrl] = useState('');

  useEffect(() => {
    // 1. Safety check for Server Side Rendering
    if (typeof window === 'undefined') return;

    // 2. Detect User Agent
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
    
    // Regex for Instagram, Facebook (FBAN/FBAV), Messenger, LinkedIn, TikTok (Musical_ly)
    const inAppRegex = /FBAN|FBAV|Instagram|LinkedInApp|Musical_ly/i;

    if (inAppRegex.test(userAgent)) {
      setIsInApp(true);
      setCurrentUrl(window.location.href);

      // 3. Specific check for Android
      if (/android/i.test(userAgent)) {
        setIsAndroid(true);
      }
    }
  }, []);

  // 4. Generate the "Intent" link that forces Android to open Chrome
  const getAndroidIntent = () => {
    // Remove the http/https protocol to fit the intent syntax
    const cleanUrl = currentUrl.replace(/^https?:\/\//, '');
    
    // This tells Android: "Open this URL, using the HTTPS scheme, specifically in the Chrome package"
    return `intent://${cleanUrl}#Intent;scheme=https;package=com.android.chrome;end`;
  };

  // If not in an app, just render the website normally
  if (!isInApp) {
    return <>{children}</>;
  }

  // If in an app, show the Gatekeeper
  return (
    <div className="fixed inset-0 z-[9999] bg-[#030303] text-white flex flex-col items-center justify-center p-6 text-center font-sans">
      
      {/* Icon Animation */}
      <div className="w-20 h-20 bg-white/10 rounded-3xl flex items-center justify-center mb-6 animate-bounce shadow-lg shadow-emerald-500/20">
        {isAndroid ? (
           // Chrome-like Icon for Android
           <span className="text-4xl">🌏</span> 
        ) : (
           // Safari/Compass Icon for iOS
           <span className="text-4xl">🧭</span>
        )}
      </div>

      <h1 className="text-3xl font-black mb-4 tracking-tight">Open in Browser</h1>
      <p className="text-gray-400 mb-8 max-w-xs text-sm leading-relaxed">
        This app's browser limits features (like downloading cards). 
        <br />Please open in your main browser.
      </p>
      
      {/* --- ANDROID SPECIFIC BUTTON --- */}
      {isAndroid ? (
          <a 
            href={getAndroidIntent()}
            className="w-full max-w-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-xl shadow-xl shadow-emerald-900/20 transition-transform active:scale-95 flex items-center justify-center gap-3 border border-emerald-400/20"
          >
              <span>Open in Chrome</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
          </a>
      ) : (
          /* --- iOS INSTRUCTIONS (Because iOS blocks programmatic opening) --- */
          <div className="bg-[#111] p-6 rounded-2xl border border-white/10 space-y-4 max-w-sm w-full text-left shadow-2xl">
              <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center font-bold text-sm shrink-0">1</div>
                  <p className="text-sm">Tap the <span className="font-bold text-white">3 dots (...)</span> in the top corner.</p>
              </div>
              <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center font-bold text-sm shrink-0">2</div>
                  <p className="text-sm">Select <span className="font-bold text-white">"Open in Browser"</span>.</p>
              </div>
          </div>
      )}
      
      {/* Fallback Link */}
      <button 
          onClick={() => setIsInApp(false)} 
          className="mt-8 text-xs text-gray-600 underline hover:text-gray-400 transition-colors cursor-pointer"
      >
          Continue here anyway (May be broken)
      </button>
    </div>
  );
}