'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { useToast } from '@/app/context/ToastContext';
import Link from 'next/link';

export default function UpdatePasswordPage() {
  const router = useRouter();
  const toast = useToast();
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // 1. Security Check: If they aren't logged in (via the email link), kick them out.
  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        toast.error("Invalid or expired recovery link.");
        router.push('/login');
      }
    };
    checkSession();
  }, [router, toast]);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password.length < 6) return toast.error("Password must be at least 6 characters.");
    if (password !== confirmPassword) return toast.error("Passwords do not match.");

    setLoading(true);

    try {
      // 2. Update the user's password in Supabase
      const { error } = await supabase.auth.updateUser({ 
        password: password 
      });

      if (error) throw error;

      toast.success("Password secured! Redirecting...");
      
      // 3. Send them to dashboard
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);

    } catch (error: any) {
      toast.error(error.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030303] text-white font-sans selection:bg-purple-500 selection:text-white relative overflow-hidden flex items-center justify-center">

      {/* --- BACKGROUND FX --- */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-purple-900/20 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-emerald-900/20 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
      </div>

      <main className="w-full max-w-md relative z-10 px-6">
        
        {/* Header */}
        <div className="text-center mb-8">
           <div className="w-16 h-16 bg-purple-500/10 border border-purple-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-[0_0_30px_rgba(168,85,247,0.2)]">
             <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
           </div>
           <h1 className="text-2xl font-black tracking-tight text-white">Set New Password</h1>
           <p className="text-gray-500 text-sm mt-2">Secure your agent profile.</p>
        </div>

        {/* Card */}
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-8 shadow-2xl relative">
          
          <form onSubmit={handleUpdatePassword} className="space-y-5">
            
            {/* New Password */}
            <div className="space-y-1 group">
              <label className="text-[10px] font-mono text-gray-400 ml-1 uppercase">New Passphrase</label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500/50 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-gray-500 hover:text-white transition"
                >
                  {showPassword ? 
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                    : 
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  }
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-1 group">
              <label className="text-[10px] font-mono text-gray-400 ml-1 uppercase">Confirm Passphrase</label>
              <input 
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500/50 transition-all"
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-white text-black font-bold py-3.5 rounded-xl hover:bg-gray-200 transition-all disabled:opacity-70 mt-4 flex justify-center"
            >
              {loading ? "Updating..." : "Update Password"}
            </button>

          </form>

        </div>

        <div className="text-center mt-6">
            <Link href="/login" className="text-xs text-gray-500 hover:text-white transition">
                ← Back to Login
            </Link>
        </div>

      </main>
    </div>
  );
}