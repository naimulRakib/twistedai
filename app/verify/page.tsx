'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/app/context/ToastContext'; // Adjust path if needed

// Wrapper for Suspense (Required for useSearchParams in Next.js App Router)
export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#030303]" />}>
      <VerifyContent />
    </Suspense>
  );
}

function VerifyContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || "your email"; // Get email from URL
  const toast = useToast();
  
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Countdown timer logic for resend button
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleResendEmail = async () => {
    if (countdown > 0) return;
    
    setResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });

      if (error) throw error;

      toast.success("Verification email resent!");
      setCountdown(60); // Start 60s cooldown
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to resend.");
    } finally {
      setResending(false);
    }
  };

  // Direct links to email providers queries
  const openGmail = () => window.open(`https://mail.google.com/mail`, '_blank');
  const openOutlook = () => window.open(`https://outlook.live.com/mail/0/inbox`, '_blank');

  return (
    <div className="min-h-screen bg-[#030303] text-white font-sans selection:bg-emerald-500 selection:text-black relative overflow-hidden flex items-center justify-center p-6">

      {/* --- BACKGROUND ANIMATIONS (Matches SignUp) --- */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
        }
        .animate-float { animation: float 4s ease-in-out infinite; }
        
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob { animation: blob 10s infinite; }
      `}</style>

      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-emerald-900/20 rounded-full blur-[100px] animate-blob" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-cyan-900/20 rounded-full blur-[100px] animate-blob" style={{ animationDelay: '2s' }} />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
      </div>

      {/* --- GLASS CARD --- */}
      <main className="w-full max-w-lg relative z-10">
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden text-center">
          
          {/* Top Decorative Gradient */}
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-500 to-cyan-500"></div>

          {/* Animated Icon */}
          <div className="flex justify-center mb-8 animate-float">
            <div className="w-20 h-20 bg-gradient-to-tr from-emerald-500/20 to-cyan-500/20 rounded-2xl flex items-center justify-center border border-emerald-500/30 shadow-[0_0_30px_-5px_rgba(16,185,129,0.3)]">
               <svg className="w-10 h-10 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76" />
               </svg>
            </div>
          </div>

          {/* Text Content */}
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 mb-4 tracking-tight">
            Check your inbox
          </h1>
          
          <p className="text-gray-400 mb-8 leading-relaxed">
            We've sent a verification link to <br/>
            <span className="text-emerald-400 font-semibold">{email}</span>.
          </p>
          
          <div className="bg-black/30 border border-white/5 rounded-xl p-4 mb-8 text-sm text-gray-500">
            Click the link in the email to activate your account and access the dashboard.
          </div>

          {/* Quick Open Buttons */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <button 
                onClick={openGmail}
                className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 py-3 rounded-xl transition-all group"
            >
                <svg className="w-5 h-5 text-gray-400 group-hover:text-red-500 transition-colors" viewBox="0 0 24 24" fill="currentColor"><path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z"/></svg>
                <span className="font-medium text-gray-300">Open Gmail</span>
            </button>
            <button 
                onClick={openOutlook}
                className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 py-3 rounded-xl transition-all group"
            >
                 <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" viewBox="0 0 24 24" fill="currentColor"><path d="M1 18l9.518-7L1 5v13zm9 2l3.476-2.553 5.49 4.053a.99.99 0 0 0 .54.16.99.99 0 0 0 .584-.19l2.844-2.1L12.553 12 10 20zM22.953 4.5l-2.844-2.1-12.633 9.324L10 14.18 22.953 4.5zM2 3.5l9.535 7.027L22 3.5H2z"/></svg>
                <span className="font-medium text-gray-300">Open Outlook</span>
            </button>
          </div>

          {/* Footer Actions */}
          <div className="text-sm space-y-4">
            
            {/* Resend Logic */}
       

            {/* Back to Login */}
            <Link href="/login" className="block text-gray-500 hover:text-white transition-colors flex items-center justify-center gap-2 group">
              <span className="group-hover:-translate-x-1 transition-transform">←</span> Back to Login
            </Link>
          </div>

        </div>
      </main>
    </div>
  );
}