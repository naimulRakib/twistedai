'use client';

import { useFingerprint } from '@/app/utils/useFingerprint';

export default function MyDeviceID() {
  const { visitorId } = useFingerprint();

  return (
    <div className="min-h-screen bg-black text-white font-mono flex flex-col items-center justify-center p-6">
       
       {/* Loading Animation */}
       {visitorId === 'Loading...' ? (
         <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-green-500 animate-pulse">SCANNING BIOMETRICS...</p>
         </div>
       ) : (
         <div className="text-center space-y-6 animate-in fade-in zoom-in duration-500">
            
            <div className="w-20 h-20 mx-auto bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.4)]">
                <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.2-2.858.578-4.18M12 12a3 3 0 100-6 3 3 0 000 6z"></path></svg>
            </div>

            <div>
                <h1 className="text-gray-500 text-sm uppercase tracking-[0.3em] mb-2">Target Identified</h1>
                <div className="relative group cursor-pointer" onClick={() => navigator.clipboard.writeText(visitorId)}>
                    <h2 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 group-hover:text-green-400 transition-colors">
                        {visitorId}
                    </h2>
                    <div className="absolute -bottom-6 left-0 right-0 text-center opacity-0 group-hover:opacity-100 transition-opacity text-xs text-green-500">
                        [ Click to Copy ]
                    </div>
                </div>
            </div>

            <div className="bg-white/5 border border-white/10 p-4 rounded-xl max-w-sm mx-auto mt-8">
                <p className="text-xs text-gray-400 leading-relaxed">
                    This is your unique <strong>Browser Fingerprint</strong>. Even if you use Incognito mode or clear cookies, this ID often remains the same.
                </p>
            </div>

         </div>
       )}

    </div>
  );
}