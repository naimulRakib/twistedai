'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { useToast } from '@/app/context/ToastContext';

export default function UpdatePasswordPage() {
  const router = useRouter();
  const toast = useToast();
  
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // 1. Check if the link actually logged them in
  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        // If they aren't logged in, the link was invalid or expired
        router.push('/login');
      }
    };
    checkSession();
  }, [router]);

  // 2. The Actual Update Logic
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // THIS IS THE KEY STEP: It updates the user who is currently logged in via the email link
      const { error } = await supabase.auth.updateUser({ 
        password: password 
      });

      if (error) throw error;

      toast.success("Password Changed Successfully! Redirecting...");
      
      // 3. Send them to dashboard
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);

    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030303] text-white font-sans flex items-center justify-center relative overflow-hidden">
      
      {/* Background FX */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
         <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-purple-900/20 rounded-full blur-[100px] animate-pulse" />
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
      </div>

      <div className="w-full max-w-md relative z-10 px-6">
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-8 shadow-2xl">
          
          <div className="text-center mb-6">
             <h1 className="text-2xl font-black text-white">New Password</h1>
             <p className="text-gray-500 text-sm mt-1">Enter a new secure passphrase.</p>
          </div>

          <form onSubmit={handleUpdatePassword} className="space-y-5">
            <div className="space-y-1">
              <label className="text-[10px] font-mono text-gray-400 uppercase ml-1">New Password</label>
              <input 
                type="password"
                required
                minLength={6}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500/50 transition-all"
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-white text-black font-bold py-3.5 rounded-xl hover:bg-gray-200 transition-all disabled:opacity-70"
            >
              {loading ? "Updating..." : "Confirm Change"}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}