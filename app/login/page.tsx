'use client';

import { supabase } from '@/lib/supabaseClient';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/app/context/ToastContext'; // Adjusted path to use absolute import

export default function LoginPage() {
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
 

  // 1. Check if user is ALREADY logged in (Auto-redirect)
  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        router.push('/dashboard');
      }
    };
    checkSession();
  }, [router, supabase]);

  const handleToSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    console.log('=== SIGN IN ATTEMPT ===');
    
    try {
      // 2. Attempt Login
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('❌ Sign-in failed:', error.message);
        toast.error('Login Failed: ' + error.message); // TOAST ON FAILURE
        setLoading(false); 
        return; // STOP EXECUTION HERE
      }

      // 3. Only Redirect if Successful
      if (data.session) {
        toast.success('Agent Access Granted!'); // TOAST ON SUCCESS
        router.push('/dashboard');
        router.refresh();
      }

    } catch (err: any) {
      console.error("Unexpected Error:", err);
      toast.error('System error occurred.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030303] text-white font-sans selection:bg-purple-500 selection:text-white relative overflow-hidden flex items-center justify-center">

      {/* --- CSS ANIMATIONS --- */}
      <style jsx>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob { animation: blob 10s infinite; }
        .delay-2000 { animation-delay: 2s; }
      `}</style>

      {/* --- DYNAMIC BACKGROUND --- */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-900/20 rounded-full blur-[100px] animate-blob" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-pink-900/20 rounded-full blur-[100px] animate-blob delay-2000" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
      </div>

      {/* --- MAIN GLASS CARD --- */}
      <main className="w-full max-w-md relative z-10 px-6">
        
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <Link href="/">
            <div className="inline-flex items-center gap-2 font-bold text-2xl tracking-tighter cursor-pointer hover:scale-105 transition-transform">
              <div className="w-8 h-8 bg-gradient-to-tr from-purple-500 to-pink-500 rounded-lg flex items-center justify-center shadow-lg shadow-purple-500/30">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
              </div>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                Twisted<span className="text-purple-500">.ai</span>
              </span>
            </div>
          </Link>
          <p className="text-gray-500 text-sm mt-2">Welcome back, Detective.</p>
        </div>

        {/* Form Container */}
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
          
          {/* Top Decorative Line */}
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-50"></div>

          <form onSubmit={handleToSignIn} className="space-y-5 relative z-10">
            
            {/* Email Input */}
            <div className="space-y-1 group">
              <label className="text-xs font-mono text-gray-400 ml-1">CODENAME (EMAIL)</label>
              <div className="relative">
                <input 
                  type="email" 
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="agent@twisted.ai"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 pl-11 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/50 focus:bg-black/60 transition-all"
                />
                <svg className="w-5 h-5 text-gray-500 absolute left-3 top-3.5 group-focus-within:text-purple-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1 group">
              <div className="flex justify-between ml-1">
                <label className="text-xs font-mono text-gray-400">PASSPHRASE</label>
                <a href="#" className="text-xs text-purple-400 hover:text-purple-300">Forgot?</a>
              </div>
              <div className="relative">
                <input 
                  type="password" 
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 pl-11 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/50 focus:bg-black/60 transition-all"
                />
                <svg className="w-5 h-5 text-gray-500 absolute left-3 top-3.5 group-focus-within:text-purple-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
              </div>
            </div>

            {/* Login Button */}
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-gradient-to-r from-pink-600 to-purple-600 text-white font-bold py-3.5 rounded-xl hover:shadow-[0_0_20px_-5px_rgba(168,85,247,0.5)] transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              ) : (
                <>Access Dashboard <span className="text-lg">➔</span></>
              )}
            </button>
            
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-[#0f0f0f] px-2 text-gray-500 rounded-full">Or continue as</span></div>
          </div>

          {/* GUEST MODE BUTTON */}
          <Link href="/cardgenerator">
            <button className="w-full bg-white/5 border border-white/10 text-gray-300 font-semibold py-3 rounded-xl hover:bg-white/10 hover:text-white transition-all flex items-center justify-center gap-3 group">
              <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center group-hover:bg-green-500/30 transition">
                <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
              </div>
              <div className="text-left">
                <div className="text-xs text-gray-500 font-normal">No account?</div>
                <div>Use Guest Mode</div>
              </div>
              <svg className="w-4 h-4 text-gray-500 ml-auto group-hover:translate-x-1 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
            </button>
          </Link>

        </div>

        {/* Footer Link */}
        <p className="text-center mt-6 text-sm text-gray-500">
          Don't have a link yet?{' '}
          <Link href="/signup" className="text-purple-400 hover:text-purple-300 font-semibold underline decoration-purple-500/30 underline-offset-4 hover:decoration-purple-500 transition-all">
            Sign up for free
          </Link>
        </p>

      </main>
    </div>
  );
}