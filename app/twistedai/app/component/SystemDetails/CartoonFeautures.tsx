import React from 'react';
import Link from 'next/link';
import { 
  MessageCircle, 
  Wand2, 
  Share2, 
  Link as LinkIcon, 
  Eye, 
  ShieldCheck, 
  Fingerprint,
  Zap,
  Ghost,
  Sparkles,
  Crown,
  Lock
} from 'lucide-react';

const CartoonFeatures = () => {
  return (
    <div className="min-h-screen bg-transparent p-4 sm:p-8 font-sans selection:bg-black selection:text-yellow-400 rounded-3xl">
      
      {/* Custom Styles for Floating Animation */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@400;600;700&display=swap');
        
        .font-cartoon {
          font-family: 'Fredoka', sans-serif;
        }
        
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
        }
        @keyframes float-medium {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes float-fast {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        
        .animate-float-slow { animation: float-slow 6s ease-in-out infinite; }
        .animate-float-medium { animation: float-medium 5s ease-in-out infinite; }
        .animate-float-fast { animation: float-fast 4s ease-in-out infinite; }
        
        /* Hard Shadow Hover Effect */
        .cartoon-card {
          transition: all 0.2s ease;
        }
        .cartoon-card:hover {
          transform: translate(4px, 4px);
          box-shadow: 2px 2px 0px 0px #000;
        }
      `}</style>

      {/* 1. Header Section */}
      <div className="max-w-4xl mx-auto text-center mb-16 pt-10 font-cartoon">
        <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-yellow-300 border-4 border-black text-black font-black uppercase tracking-wider mb-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transform -rotate-2 hover:rotate-2 transition-transform">
          <Zap className="w-5 h-5 fill-black" />
          <span>It's Magic Time!</span>
        </div>
        
        <h2 className="text-5xl md:text-7xl font-black text-white mb-6 leading-tight drop-shadow-sm">
          Everything You Need<br/>
          <span className="text-purple-500 text-stroke-black">TO GET RIGHT NOW!</span>
        </h2>
        
        <p className="text-xl md:text-2xl text-gray-700 font-bold max-w-2xl mx-auto">
          From AI-powered insults (jk, replies!) to secret spy modes. 
          It's the ultimate toolkit for your anonymous empire.
        </p>
      </div>

      {/* 2. Bento Grid Layout */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 font-cartoon pb-20">

        {/* Feature A: AI Card Generator (Large - Spans 8 cols) */}
        <div className="md:col-span-8 animate-float-slow">
          <div className="h-full bg-blue-400 border-[6px] border-black rounded-[3rem] p-8 md:p-10 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden cartoon-card group">
            
            {/* Badge */}
            <div className="absolute top-6 right-6 bg-white border-4 border-black px-4 py-1 rounded-full font-black text-sm uppercase transform rotate-3">
              Free Forever
            </div>

            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-6">
                <div className="bg-white p-4 rounded-2xl border-4 border-black shadow-[4px_4px_0_0_#000]">
                  <Wand2 className="w-8 h-8 text-black" />
                </div>
                <div>
                  <h3 className="text-3xl md:text-4xl font-black text-white text-stroke-black">
                    AI Card Generator
                  </h3>
                </div>
              </div>
              
              <p className="text-white text-xl font-bold mb-8 max-w-lg leading-relaxed drop-shadow-md">
                Turn boring texts into masterpiece cards! Use <span className="text-yellow-300 underline decoration-wavy">5 Premium AI Models</span> for FREE to generate replies and designs.
              </p>

              {/* Mock UI: Card Creation */}
              <div className="bg-white border-4 border-black rounded-3xl p-6 shadow-[8px_8px_0_0_rgba(0,0,0,0.2)] max-w-xl transform -rotate-1 group-hover:rotate-0 transition-transform duration-300">
                <div className="flex items-center justify-between mb-4 border-b-2 border-gray-200 pb-2">
                  <div className="flex items-center gap-2">
                    <Crown className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                    <span className="font-bold text-gray-800">Premium Design Library</span>
                  </div>
                  <div className="text-xs font-bold bg-black text-white px-2 py-1 rounded">5 Models Active</div>
                </div>
                <div className="space-y-3">
                  <div className="h-16 bg-gray-100 rounded-xl border-2 border-dashed border-gray-400 flex items-center justify-center text-gray-500 font-bold">
                    "Message Preview Area"
                  </div>
                  <div className="flex gap-2">
                    <button className="flex-1 bg-purple-500 text-white font-bold py-2 rounded-xl border-2 border-black hover:bg-purple-600">Style 1</button>
                    <button className="flex-1 bg-pink-500 text-white font-bold py-2 rounded-xl border-2 border-black hover:bg-pink-600">Style 2</button>
                    <button className="flex-1 bg-yellow-400 text-black font-bold py-2 rounded-xl border-2 border-black hover:bg-yellow-500">Style 3</button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Background Decoration */}
            <Sparkles className="absolute bottom-4 right-4 w-48 h-48 text-blue-300 opacity-50 rotate-12" />
          </div>
        </div>

        {/* Feature B: Unique Links (Tall - Spans 4 cols) */}
        <div className="md:col-span-4 animate-float-medium" style={{ animationDelay: '1s' }}>
          <div className="h-full bg-green-400 border-[6px] border-black rounded-[3rem] p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between cartoon-card">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-white p-3 rounded-xl border-4 border-black">
                  <LinkIcon className="w-6 h-6 text-black" />
                </div>
                <h3 className="text-2xl font-black text-black">Unbreakable Links</h3>
              </div>
              <p className="font-bold text-green-900 mb-6">
                Your link is yours FOREVER. Our algorithm guarantees zero duplicates.
              </p>
            </div>
            
            <div className="bg-black p-4 rounded-2xl border-4 border-white/50 transform rotate-2">
              <div className="text-green-400 font-mono text-sm mb-1">Generated Link:</div>
              <div className="text-white font-bold truncate">myapp.com/u/king_julien</div>
            </div>

            <div className="mt-6 flex items-center gap-2 font-black text-black bg-white/30 p-2 rounded-lg">
              <ShieldCheck className="w-5 h-5" />
              <span>URL Shortener Included</span>
            </div>
          </div>
        </div>

        {/* Feature C: PRO FEATURES (Updated - Spans 4 cols) */}
        <div className="md:col-span-4 animate-float-fast" style={{ animationDelay: '0.5s' }}>
          <div className="h-full bg-gray-900 border-[6px] border-black rounded-[3rem] p-8 shadow-[12px_12px_0px_0px_#4b5563] relative overflow-hidden cartoon-card group flex flex-col justify-between">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-red-500 p-3 rounded-xl border-4 border-white">
                    <Lock className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-2xl font-black text-white">PRO VAULT</h3>
                </div>
                <span className="bg-yellow-400 text-black text-xs font-black px-2 py-1 rounded border-2 border-black transform rotate-6">PREMIUM</span>
              </div>
              
              <div className="space-y-4 mb-4">
                 {/* Feature 1 */}
                 <div className="flex items-center gap-3 text-white">
                    <div className="bg-gray-800 p-2 rounded-lg border-2 border-gray-600">
                        <Fingerprint className="w-5 h-5 text-green-400" />
                    </div>
                    <div>
                        <div className="font-black text-sm">Biometric Link</div>
                        <div className="text-xs text-gray-400">Fingerprint protected URLs</div>
                    </div>
                 </div>
                 {/* Feature 2 */}
                 <div className="flex items-center gap-3 text-white">
                    <div className="bg-gray-800 p-2 rounded-lg border-2 border-gray-600">
                        <Ghost className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                        <div className="font-black text-sm">Anonymous Chat</div>
                        <div className="text-xs text-gray-400">True hidden conversations</div>
                    </div>
                 </div>
                  {/* Feature 3 */}
                  <div className="flex items-center gap-3 text-white">
                    <div className="bg-gray-800 p-2 rounded-lg border-2 border-gray-600">
                        <Eye className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                        <div className="font-black text-sm">Spy Mode</div>
                        <div className="text-xs text-gray-400">See who's lurking</div>
                    </div>
                 </div>
              </div>
            </div>

            <button className="w-full bg-white text-black font-black py-3 rounded-xl border-4 border-gray-300 hover:bg-yellow-400 hover:border-black transition-colors uppercase tracking-widest flex items-center justify-center gap-2 relative z-20">
                Unlock Pro
            </button>
            
            {/* Striped Background Pattern */}
            <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #000 0, #000 10px, #333 10px, #333 20px)' }}></div>
          </div>
        </div>

        {/* Feature D: Social Sharing (Standard - Spans 4 cols) */}
        <div className="md:col-span-4 animate-float-medium" style={{ animationDelay: '2s' }}>
          <div className="h-full bg-pink-400 border-[6px] border-black rounded-[3rem] p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] cartoon-card">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-white p-3 rounded-xl border-4 border-black">
                <Share2 className="w-6 h-6 text-black" />
              </div>
              <h3 className="text-2xl font-black text-white text-stroke-black">Viral Cards</h3>
            </div>
            <p className="text-white font-bold mb-6 text-lg">
              Optimized for Insta & FB stickers. 3 Premium frames included!
            </p>
            
            <div className="flex justify-center gap-3">
              <div className="w-12 h-16 bg-white border-4 border-black rounded-lg transform -rotate-6"></div>
              <div className="w-12 h-16 bg-yellow-300 border-4 border-black rounded-lg transform -translate-y-2 z-10"></div>
              <div className="w-12 h-16 bg-blue-300 border-4 border-black rounded-lg transform rotate-6"></div>
            </div>
          </div>
        </div>

        {/* Feature E: Smart Inbox (Standard - Spans 4 cols) */}
        <div className="md:col-span-4 animate-float-slow" style={{ animationDelay: '1.5s' }}>
          <div className="h-full bg-yellow-300 border-[6px] border-black rounded-[3rem] p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] cartoon-card">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-black p-3 rounded-xl">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-black text-black">Smart Inbox</h3>
            </div>
            <p className="text-black font-bold text-lg mb-4">
              Active channels & links in one place.
            </p>
            <div className="bg-white p-4 rounded-2xl border-4 border-black">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-full bg-gray-200 border-2 border-black flex items-center justify-center text-xl">🤫</div>
                 <div className="text-sm font-bold">New Secret Message!</div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* 3. CTA Section */}
      <div className="max-w-4xl mx-auto text-center font-cartoon pb-20">
        <h3 className="text-4xl font-black mb-8 transform -rotate-1">Ready to create chaos?</h3>
        <button className="group relative inline-block focus:outline-none focus:ring">
            <span className="absolute inset-0 translate-x-3 translate-y-3 bg-black transition-transform group-hover:translate-x-2 group-hover:translate-y-2 rounded-2xl"></span>
            
            <span className="relative inline-block border-[5px] border-black bg-purple-500 px-12 py-6 text-2xl font-black uppercase tracking-widest text-white rounded-2xl group-active:translate-x-0 group-active:translate-y-0">
            <Link href='/signup'>Insert Web App Now</Link>  
            </span>
        </button>
      </div>

    </div>
  );
};

export default CartoonFeatures;