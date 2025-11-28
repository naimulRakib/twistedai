'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '../context/ToastContext';
import SecretChatDetails from '../component/SystemDetails/SecretChatroom';
export default function TargetInterceptor() {
  const toast= useToast();
  const [messageId, setMessageId] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ masterId: string; device: string; ip: string } | null>(null);
  const [error, setError] = useState("");

  const handleTrace = async () => {
    if (!messageId.trim()) return alert("Enter a Message ID.");
    
    setLoading(true);
    setError("");
    setResult(null);

    try {
      // 1. Fetch the message and the SPY column
      const { data, error } = await supabase
        .from('messages')
        .select('spy')
        .eq('id', messageId) 
        .single();

      if (error) throw error;

      // 2. Extract Master ID from JSONB
      const spyData = data?.spy;
      
      if (!spyData || !spyData.masterId) {
        throw new Error("Target is untraceable (No Hardware Hash found).");
      }

      // 3. Success! Set the data
      setResult({
        masterId: spyData.masterId,
        device: spyData.os_platform || "Unknown Device",
        ip: spyData.ip || "Hidden"
      });

    } catch (err: any) {
      console.error(err);
      setError("Tracing failed.");
    } finally {
      setLoading(false);
      toast.success("Our system is not 100% accurate! REMIND")
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto p-6 grid gap-10">
      
      {/* TERMINAL CONTAINER */}
      <div className="bg-[#050505] border border-green-900/50 rounded-2xl p-8 shadow-2xl relative overflow-hidden group">
        
        {/* Background FX */}
        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(transparent_50%,rgba(0,255,0,0.02)_50%)] bg-[length:100%_4px]"></div>
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-green-500/10 rounded-full blur-[60px] animate-pulse"></div>

        <h2 className="text-lg font-bold text-green-500 font-mono mb-6 flex items-center gap-2 tracking-widest border-b border-green-900/50 pb-4">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          TARGET INTERCEPTOR
        </h2>

        {/* INPUT AREA */}
        <div className="space-y-4 relative z-10">
            <label className="text-[10px] text-gray-500 font-mono uppercase tracking-wider">Target Message ID</label>
            <div className="flex gap-2">
                <input 
                    type="text" 
                    value={messageId}
                    onChange={(e) => setMessageId(e.target.value)}
                    placeholder="e.g. 8492"
                    className="flex-1 bg-black border border-green-900/50 rounded-lg px-4 py-3 text-green-300 font-mono text-sm focus:outline-none focus:border-green-500 focus:shadow-[0_0_15px_rgba(34,197,94,0.2)] transition-all placeholder-green-900/50"
                />
                <button 
                    onClick={handleTrace}
                    disabled={loading}
                    className="px-6 bg-green-900/20 border border-green-500/40 text-green-400 font-bold rounded-lg hover:bg-green-500 hover:text-black transition-all uppercase text-xs tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? 'SCANNING...' : 'TRACE'}
                </button>
            </div>
        </div>

        {/* ERROR DISPLAY */}
        {error && (
            <div className="mt-6 p-3 bg-red-900/10 border border-red-500/30 rounded-lg text-red-400 text-xs font-mono flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                {error}
            </div>
        )}

        {/* RESULT DISPLAY */}
        {result && (
            <div className="mt-8 pt-6 border-t border-green-900/30 animate-in zoom-in-95 duration-500">
                
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest">Target Locked</p>
                        <p className="text-lg font-bold text-white">{result.device}</p>
                        <p className="text-xs text-green-600 font-mono"></p>
                        
                    </div>
                    <div className="p-2 bg-green-500/10 rounded-lg border border-green-500/20">
                        <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    </div>
                </div>

            

                {/* THE MAGIC LINK */}
                <Link 
                    href={`/live/${result.masterId}`}
                    className="block w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl font-bold text-black text-center hover:shadow-[0_0_20px_rgba(16,185,129,0.5)] hover:scale-[1.02] transition-all text-sm uppercase tracking-widest"
                >
                    INITIATE LIVE INTERCEPT ⚡
                </Link>

            </div>
        )}

      </div>

      <SecretChatDetails/>
    </div>
  );
}