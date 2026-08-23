'use client';

import { supabase } from '@/lib/supabaseClient';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/app/context/ToastContext'; 

export default function LoginPage() {
  const toast = useToast();
  const router = useRouter();

  // --- LOGIN STATE ---
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // --- FORGOT PASSWORD STATE ---
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  const toggleVisibility = () => {
    setShowPassword(!showPassword);
  };
  
  // 1. Check if user is ALREADY logged in (Auto-redirect)
  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        router.push('/dashboard');
      }
    };
    checkSession();
  }, [router]);

  // 2. Handle Login
  const handleToSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    console.log('=== SIGN IN ATTEMPT ===');
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('❌ Sign-in failed:', error.message);
        toast.error('Login Failed: ' + error.message); 
        setLoading(false); 
        return; 
      }

      if (data.session) {
        toast.success('Agent Access Granted!'); 
        router.push('/dashboard');
        router.refresh();
      }

    } catch (err: any) {
      console.error("Unexpected Error:", err);
      toast.error('System error occurred.');
      setLoading(false);
    }
  };

  // 3. Handle Password Reset Email
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) return toast.error("Please enter your email.");
    
    setResetLoading(true);

    try {
      // This sends an email with a link to /update-password
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/update-password`, 
      });

      if (error) throw error;
      
      toast.success("Recovery email sent! Check your inbox.");
      setShowForgotModal(false);
      setResetEmail(""); // Clear input
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setResetLoading(false);
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
                Twst<span className="text-purple-500">.fun</span>
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
                
                {/* --- FORGOT PASSWORD TRIGGER --- */}
                <button 
                  type="button" 
                  onClick={() => setShowForgotModal(true)}
                  className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
                >
                  Forgot?
                </button>
              </div>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 pl-11 pr-10 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/50 focus:bg-black/60 transition-all"
                />
                
                {/* Left Icon (Lock) */}
                <svg className="w-5 h-5 text-gray-500 absolute left-3 top-3.5 group-focus-within:text-purple-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>

                {/* Right Icon (Eye Toggle) */}
                <button
                  type="button"
                  onClick={toggleVisibility}
                  className="absolute right-3 top-3.5 text-gray-500 hover:text-purple-400 transition-colors focus:outline-none"
                >
                   {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    )}
                </button>
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

        </div>

        {/* Footer Link */}
        <p className="text-center mt-6 text-sm text-gray-500">
          Don't have a link yet?{' '}
          <Link href="/signup" className="text-purple-400 hover:text-purple-300 font-semibold underline decoration-purple-500/30 underline-offset-4 hover:decoration-purple-500 transition-all">
            Sign up for free
          </Link>
        </p>

        {/* --- FORGOT PASSWORD MODAL --- */}
        {showForgotModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#0a0a0a] border border-white/10 p-6 rounded-3xl w-full max-w-sm shadow-2xl relative">
              
              <button 
                onClick={() => setShowForgotModal(false)}
                className="absolute top-4 right-4 text-gray-500 hover:text-white w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition"
              >
                ✕
              </button>

              <div className="text-center mb-6 pt-2">
                <div className="w-14 h-14 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-purple-500/20">
                  <svg className="w-7 h-7 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"></path></svg>
                </div>
                <h3 className="text-xl font-bold text-white">Reset Password</h3>
                <p className="text-xs text-gray-400 mt-2 max-w-[200px] mx-auto">Enter the email linked to your agent profile to recover access.</p>
              </div>

              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="group">
                  <label className="text-[10px] font-mono text-gray-500 ml-1 uppercase">Recovery Email</label>
                  <input 
                    type="email" 
                    required
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="agent@gmail.com"
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-purple-500/50 focus:outline-none transition-all"
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={resetLoading}
                  className="w-full bg-white text-black font-bold py-3.5 rounded-xl hover:bg-gray-200 transition disabled:opacity-50 mt-2"
                >
                  {resetLoading ? "Sending Recovery Signal..." : "Send Reset Link"}
                </button>
              </form>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}