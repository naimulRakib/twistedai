'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '../context/ToastContext';

export default function SpyMasterSearch() {
    const toast =useToast();
  const [masterIdInput, setMasterIdInput] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!masterIdInput.trim()) return toast.error("Enter a Master ID");
    setLoading(true);
    setSearched(true);
    setResults([]);

    try {
      // 🕵️‍♂️ TWISTED LOGIC:
      // We search inside the 'spy' JSONB column for a matching masterId
      const { data: messages, error } = await supabase
        .from('messages')
        .select('*')
        // This checks if the spy JSON object contains key-value: { masterId: input }
        .contains('spy', { masterId: masterIdInput.trim() })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setResults(messages || []);

    } catch (e: any) {
      console.error("Search Error:", e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6 font-sans">
        
        {/* --- SEARCH BOX --- */}
        <div className="bg-[#0a0a0a] border border-purple-500/30 p-8 rounded-3xl shadow-2xl mb-10 relative overflow-hidden group">
            <div className="absolute inset-0 bg-purple-900/10 blur-3xl group-hover:bg-purple-900/20 transition-all"></div>
            
            <h2 className="relative text-purple-400 font-mono text-sm font-bold uppercase tracking-widest mb-6 flex items-center gap-3">
                <span className="w-3 h-3 bg-purple-500 rounded-full animate-pulse shadow-[0_0_10px_#a855f7]"></span>
                Master Identity Tracker
            </h2>
            
            <div className="relative flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative group/input">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl blur opacity-30 group-focus-within/input:opacity-100 transition duration-500"></div>
                    <input 
                        type="text" 
                        value={masterIdInput}
                        onChange={(e) => setMasterIdInput(e.target.value)}
                        placeholder="Paste Master ID (e.g. b46adc...)"
                        className="relative w-full bg-black border border-white/10 rounded-xl px-5 py-4 text-white font-mono text-xs focus:outline-none focus:text-purple-300 transition-all placeholder-gray-700"
                    />
                </div>
                <button 
                    onClick={handleSearch}
                    disabled={loading}
                    className="relative px-8 py-4 bg-purple-900/20 text-purple-400 border border-purple-500/50 rounded-xl font-bold text-xs hover:bg-purple-500 hover:text-white transition-all disabled:opacity-50 tracking-widest uppercase shadow-[0_0_20px_rgba(168,85,247,0.1)]"
                >
                    {loading ? 'TRIANGULATING...' : 'TRACE TARGET'}
                </button>
            </div>
        </div>

        {/* --- RESULTS FEED --- */}
        <div className="space-y-4">
            {searched && results.length === 0 && !loading && (
                <div className="text-center p-12 border border-dashed border-white/10 rounded-3xl bg-white/5">
                    <p className="text-gray-500 text-xs font-mono">NO RECORDS FOUND FOR THIS MASTER ID.</p>
                </div>
            )}

            {results.map((msg) => (
                <div key={msg.id} className="group relative animate-in fade-in slide-in-from-bottom-2 duration-500">
                    
                    {/* Card Glow */}
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-900/50 to-blue-900/50 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-500"></div>

                    <div className="relative bg-black/80 backdrop-blur-md border border-white/10 p-6 rounded-2xl hover:border-purple-500/30 transition-all">
                        
                        {/* Header: Date & IP */}
                        <div className="flex justify-between items-start mb-4 border-b border-white/5 pb-3">
                            <div className="flex items-center gap-3">
                                <span className="text-[10px] text-gray-500 font-mono bg-white/5 px-2 py-1 rounded">
                                    {new Date(msg.created_at).toLocaleString()}
                                </span>
                                <span className="text-[10px] text-emerald-500 font-mono flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                                    {msg.spy?.ip || 'Hidden'}
                                </span>
                            </div>
                            <span className="text-[10px] text-purple-400 font-bold uppercase tracking-wider">
                                {msg.spy?.os_platform}
                            </span>
                        </div>
                        
                        {/* Message Content */}
                        <p className="text-white font-medium text-lg leading-relaxed mb-4">
                            "{msg.content}"
                        </p>
                        
                        {/* Footer: Spy Details */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-3 border-t border-white/5 text-[10px] text-gray-500 font-mono">
                             <div>
                                <span className="block text-gray-700 uppercase">Location</span>
                                {msg.spy?.city}, {msg.spy?.country}
                             </div>
                             <div>
                                <span className="block text-gray-700 uppercase">Device</span>
                                {msg.spy?.screen_res} ({msg.spy?.cpu_cores} Cores)
                             </div>
                             <div>
                                <span className="block text-gray-700 uppercase">Battery</span>
                                <span className={msg.spy?.is_charging ? 'text-green-400' : 'text-yellow-400'}>
                                    {msg.spy?.battery_level} {msg.spy?.is_charging && '⚡'}
                                </span>
                             </div>
                             <div className="truncate">
                                <span className="block text-gray-700 uppercase">GPU</span>
                                <span className="text-xs">{msg.spy?.gpu?.split('Direct')[0] || 'N/A'}</span>
                             </div>
                        </div>

                    </div>
                </div>
            ))}
        </div>

    </div>
  );
}