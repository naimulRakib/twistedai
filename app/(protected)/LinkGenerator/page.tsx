"use client";

import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { v4 as uuidv4 } from 'uuid'; 


const LinkGenerator = () => {
    const [linkId, setLinkId] = useState("");
    const [generatedLink, setGeneratedLink] = useState("");
    
       const [linkName, setLinkName] = useState("");
  





    const generateLink = async (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();

         // Prevent default button behavior

        const uniqueId = uuidv4(); // Generate a valid UUID
        setLinkId(uniqueId);

        const { data: userData, error: userError } = await supabase.auth.getUser();

        if (userError || !userData?.user) {
            console.error('Error fetching user:', userError);
            alert('You must be logged in to create a link.');
            return;
        }

        const userId = userData.user.id;

        // Insert the generated link into the 'links' table
        const { error: linkError } = await supabase
            .from('links')
            .insert({ id: uniqueId, creator_user_id: userId });

        if (linkError) {
            console.error('Error creating link:', linkError);
            alert('Failed to create link.');
            return;
        }

        // Insert the generated link into the 'linkhistory' table
        const { error: historyError } = await supabase
            .from('linkhistory')
            .insert({ 
                content: `${window.location.origin}/messages/${uniqueId}`,
            
                creator_user_id: userId, author_name:linkName
            });

        if (historyError) {
            console.error('Error inserting into linkhistory:', historyError);
            alert('Failed to save link history.');
            return;
        }

        setGeneratedLink(`${window.location.origin}/messages/${uniqueId}`);
    };
  return (
    <div className="min-h-screen bg-[#0b1120] text-slate-300 grid items-center justify-center font-sans">
      
      {/* Main Container */}
      <div className="flex flex-col items-center justify-center w-full max-w-lg p-6 animate-in zoom-in-95 duration-500">
        
        {/* 1. The Icon with Glow */}
        <div className="relative group mb-8">
          <div className="absolute -inset-2 bg-emerald-500/20 rounded-full blur-xl group-hover:bg-emerald-500/30 transition-all duration-500"></div>
          <div className="relative w-24 h-24 bg-slate-900 border border-slate-800 rounded-full flex items-center justify-center shadow-2xl ring-1 ring-white/10">
            <svg className="w-10 h-10 text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.6)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path>
            </svg>
          </div>
        </div>

        {/* 2. Text Content */}
        <h2 className="text-3xl font-bold text-white mb-3 tracking-tight">Generate New Channel</h2>
        <p className="text-slate-400 mb-10 max-w-md text-center leading-relaxed">
          Create a unique, traceable link for your Instagram Story or TikTok Bio.
        </p>
        <input type="text" className='text-white border p-4 mb-4 rounded-xl' placeholder='Input A Random Name...' name="" id="" onChange={(e)=>setLinkName(e.target.value)} value={linkName} />
       

        {/* 3. Generate Button (Styled) */}
        <button 
          onClick={(event) => generateLink(event)}
          className="group relative px-8 py-4 mb-12 w-full sm:w-auto bg-gradient-to-r from-emerald-600 to-cyan-600 rounded-xl font-bold text-white shadow-lg shadow-emerald-900/40 hover:shadow-emerald-500/25 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 overflow-hidden"
        >
          <div className="absolute inset-0 bg-white/20 group-hover:bg-white/10 transition-colors"></div>
          <span className="relative flex items-center justify-center gap-2">
            + Create Unique Link
          </span>
        </button>
        

        {/* 4. Result Card (Glassmorphism) */}
        <div className="w-full">
          <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] ring-1 ring-white/5">
            
            <div className="flex flex-col gap-1 mb-4">
               <p className="text-emerald-400 text-xs font-bold uppercase tracking-wider">Ready to share</p>
               <p className="text-slate-400 text-sm">Send this secure link to your team.</p>
            </div>

            {/* The Input Surface */}
            <div className="relative flex items-center group">
              {/* Glow effect behind input */}
              <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500/30 to-cyan-500/30 rounded-xl blur opacity-0 group-hover:opacity-100 transition duration-500"></div>
              
              <input 
                type="text" 
                readOnly 
                value={generatedLink}
                className="relative w-full bg-slate-950 border border-white/10 text-slate-200 text-sm rounded-xl py-4 pl-4 pr-32 focus:outline-none focus:border-emerald-500/50 transition-all font-mono shadow-inner"
              />
              
              {/* 5. Copy Button (Integrated inside the input for premium look) */}
              <button 
                onClick={() => navigator.clipboard.writeText(generatedLink)} 
                className="absolute right-2 top-2 bottom-2 px-4 bg-white/5 hover:bg-emerald-500 hover:text-white border border-white/10 rounded-lg text-xs font-bold text-slate-300 transition-all duration-200"
              >
                COPY LINK
              </button>
            
            
            </div>
            
             <p className="text-emerald-400 text-xs font-bold uppercase tracking-wider mt-4 ">Need Short Link? Use Shorten URL option</p>
            <div className="mt-4 flex items-center justify-between text-[10px] text-slate-500 font-medium uppercase tracking-widest px-1">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                TLS 1.3 Encrypted
              </span>
              <span>Expires: Never</span>
            </div>
          </div>
        </div>

      </div>
      <br />
     
    </div>
  );

};

export default LinkGenerator;


