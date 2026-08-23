'use client';

import React, { useState } from 'react';
import { deleteAccountAction } from '@/app/actions/auth-actions'; // Adjust path
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/app/context/ToastContext';

export default function DeleteAccount() {
  const [isOpen, setIsOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const toast = useToast();

  const handleDelete = async () => {
    if (confirmText !== "DELETE") return;
    setLoading(true);

    try {
      // 1. Call the Server Action
      const result = await deleteAccountAction();

      if (result?.error) {
        throw new Error(result.error);
      }

      // 2. Cleanup Client Session
      await supabase.auth.signOut();
      
      toast.success("Account obliterated. Goodbye, Agent.");
      
      // 3. Redirect
      router.push('/login');
      router.refresh();

    } catch (error: any) {
      toast.error("Deletion failed: " + error.message);
      setLoading(false);
    }
  };

  return (
    <>
      {/* TRIGGER BUTTON */}
      <div className="border border-red-900/30 bg-red-950/10 rounded-2xl p-6 mt-8">
        <h3 className="text-red-500 font-bold text-lg mb-2 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
          Danger Zone
        </h3>
        <p className="text-gray-500 text-sm mb-4">
          Permanently remove your agent profile, messages, and all collected data. This action cannot be undone.
        </p>
        <button 
          onClick={() => setIsOpen(true)}
          className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/50 px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2"
        >
          Delete Account
        </button>
      </div>

      {/* CONFIRMATION MODAL */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in">
          <div className="bg-[#0a0a0a] border border-red-500/30 rounded-3xl p-8 max-w-sm w-full relative shadow-[0_0_50px_rgba(220,38,38,0.2)]">
            
            <button 
                onClick={() => setIsOpen(false)}
                className="absolute top-4 right-4 text-gray-500 hover:text-white"
            >
                ✕
            </button>

            <div className="text-center">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
              </div>
              <h2 className="text-xl font-black text-white mb-2">Nuclear Option</h2>
              <p className="text-gray-400 text-sm mb-6">
                Are you sure? All your secrets, links, and replies will be wiped from the server.
              </p>

              <div className="space-y-4">
                <div className="relative">
                    <label className="text-[10px] font-mono text-red-400 uppercase ml-1 mb-1 block">Type "DELETE" to confirm</label>
                    <input 
                        type="text" 
                        value={confirmText}
                        onChange={(e) => setConfirmText(e.target.value)}
                        className="w-full bg-black border border-red-900/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500 transition-colors text-center font-mono tracking-widest"
                        placeholder="DELETE"
                    />
                </div>

                <div className="flex gap-3">
                    <button 
                        onClick={() => setIsOpen(false)}
                        className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold py-3 rounded-xl transition"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleDelete}
                        disabled={confirmText !== "DELETE" || loading}
                        className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(220,38,38,0.4)]"
                    >
                        {loading ? "Deleting..." : "Confirm"}
                    </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}