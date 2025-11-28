import React from 'react';
import { Scan, Lock, ShieldCheck, AlertTriangle, Terminal } from 'lucide-react';

const SecurityExplainer = () => {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 font-sans text-slate-200 selection:bg-emerald-500/30">
      
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black opacity-80"></div>
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px]"></div>
      </div>

      {/* Main Content Container */}
      <div className="max-w-6xl w-full mx-auto relative z-10">
        
        {/* Header Section */}
        <div className="text-center mb-16 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-800 text-xs font-medium text-emerald-400 backdrop-blur-sm shadow-xl">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            SYSTEM ARCHITECTURE
          </div>
          
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white">
            How the <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Biometric Link</span> Works
          </h1>
          
          <p className="text-slate-400 max-w-2xl mx-auto text-lg leading-relaxed">
            Our protocol ensures that only the intended sender can unlock the door to your conversation.
          </p>
        </div>

        {/* 3-Step Process Grid */}
        <div className="grid grid-cols-1 md:grid-cols-1 gap-6 relative">
          
          {/* Connector Line (Desktop Only) */}
          <div className="hidden md:block absolute top-16 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-emerald-900/50 to-transparent -z-10"></div>

          {/* STEP 1: Detection */}
          <div className="group bg-slate-900/40 backdrop-blur-md border border-slate-800 p-8 rounded-2xl hover:bg-slate-900/60 hover:border-emerald-500/30 hover:-translate-y-1 transition-all duration-300 shadow-lg">
            <div className="w-14 h-14 bg-slate-800/50 border border-slate-700 rounded-xl flex items-center justify-center mb-6 group-hover:bg-emerald-500/10 group-hover:text-emerald-400 group-hover:border-emerald-500/50 transition-colors">
              <Scan className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
              <span className="text-emerald-500/50 text-sm font-mono">01.</span> Source Detection
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              We analyze the incoming data to detect the specific message sender. The system constructs a unique digital signature based on their biometrics and metadata.
            </p>
          </div>

          {/* STEP 2: The Ghost Room */}
          <div className="group bg-slate-900/40 backdrop-blur-md border border-slate-800 p-8 rounded-2xl hover:bg-slate-900/60 hover:border-emerald-500/30 hover:-translate-y-1 transition-all duration-300 shadow-lg">
            <div className="w-14 h-14 bg-slate-800/50 border border-slate-700 rounded-xl flex items-center justify-center mb-6 group-hover:bg-emerald-500/10 group-hover:text-emerald-400 group-hover:border-emerald-500/50 transition-colors">
              <Lock className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
              <span className="text-emerald-500/50 text-sm font-mono">02.</span> The "Ghost" Room
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              You create a very secret chatroom. This room is locked to everyone except <strong className="text-slate-200">you</strong> (the creator) and the <strong className="text-slate-200">specific biometric profile</strong> of that message sender.
            </p>
          </div>

          {/* STEP 3: Secured & Deleted */}
          <div className="group bg-slate-900/40 backdrop-blur-md border border-slate-800 p-8 rounded-2xl hover:bg-slate-900/60 hover:border-emerald-500/30 hover:-translate-y-1 transition-all duration-300 shadow-lg">
            <div className="w-14 h-14 bg-slate-800/50 border border-slate-700 rounded-xl flex items-center justify-center mb-6 group-hover:bg-emerald-500/10 group-hover:text-emerald-400 group-hover:border-emerald-500/50 transition-colors">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
              <span className="text-emerald-500/50 text-sm font-mono">03.</span> 100% Secured
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Nobody else can access the room. Your live chat is encrypted, unseen by servers, and will be <span className="text-emerald-400 font-semibold">deleted automatically</span> when the session ends.
            </p>
          </div>
        </div>

        {/* Disclaimer Section */}
        <div className="mt-12 bg-amber-500/5 border border-amber-500/10 rounded-xl p-6 flex flex-col md:flex-row items-start gap-4 backdrop-blur-sm">
          <div className="p-2 bg-amber-500/10 rounded-lg shrink-0 mt-1">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <h4 className="text-amber-500 font-bold text-sm uppercase tracking-wide mb-1 flex items-center gap-2">
              Accuracy Disclaimer
            </h4>
            <p className="text-slate-400 text-sm leading-relaxed">
              While our detection algorithms are advanced, please note that providing a fully biometric system cannot be 100% accurate. We use probability matching to ensure the highest likelihood of identity verification.
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center">
          
          <p className="mt-4 text-xs text-slate-500">Encryption v2.4.0</p>
        </div>

      </div>
    </div>
  );
};

export default SecurityExplainer;