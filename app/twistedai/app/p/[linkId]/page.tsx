// app/p/[linkId]/page.tsx
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import { Metadata } from 'next';

// --- NEXT.JS 15 TYPE DEFINITION ---
// Params is now a Promise!
type Props = {
  params: Promise<{ linkId: string }>;
};

// --- GENERATE METADATA ---
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  // 1. Await params (Next.js 15 Requirement)
  const { linkId } = await params;

  // 2. First, find the owner of this LINK
  const { data: link } = await supabase
    .from('links')
    .select('creator_user_id')
    .eq('id', linkId)
    .single();

  let username = "Someone";

  // 3. If link exists, fetch the username
  if (link && link.creator_user_id) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', link.creator_user_id)
      .single();
    
    if (profile) {
      username = profile.username;
    }
  }
  
  return {
    title: `@${username}'s Public Inbox 🔓`,
    description: `Read the anonymous messages and savage replies from ${username}.`,
    openGraph: {
        title: `See ${username}'s Secret Messages 🤫`,
        description: 'Click to view the public inbox.',
    }
  };
}

// --- HELPER ---
const cleanContent = (content: string) => content.replace(/^\[(ROAST|LAUGH|QUESTION|IDEA|LETTER)\]\s*/, '');

export default async function PublicInboxPage({ params }: Props) {
  // 1. AWAIT PARAMS (Crucial for Next.js 15)
  const { linkId } = await params;

  // 2. Check if Link is Public
  // This query will FAIL if you didn't run the SQL Policy above!
  const { data: linkData, error: linkError } = await supabase
    .from('links')
    .select('is_public_inbox, creator_user_id')
    .eq('id', linkId)
    .single();

  // 3. Fetch Owner Profile
  let profile = { username: 'Anonymous', avatar_url: null };
  if (linkData) {
      const { data: p } = await supabase.from('profiles').select('*').eq('id', linkData.creator_user_id).single();
      if (p) profile = p;
  }

  // 4. LOCK SCREEN (If private, or error, or RLS blocked it)
  if (linkError || !linkData || !linkData.is_public_inbox) {
    return (
      <div className="min-h-screen bg-[#030303] flex flex-col items-center justify-center text-white p-4">
        <div className="text-6xl mb-6 animate-pulse">🔒</div>
        <h1 className="text-3xl font-black mb-2 tracking-tight">Access Denied</h1>
        <p className="text-gray-500 mb-8 text-center max-w-md">
          This inbox is private. <br/>
          <span className="text-xs opacity-50">(Or you forgot to toggle it 'Public' in the dashboard)</span>
        </p>
        <Link href="/">
            <button className="bg-emerald-600 text-black font-bold px-8 py-3 rounded-full hover:bg-emerald-500 transition shadow-[0_0_20px_rgba(16,185,129,0.4)]">
                Create Your Own
            </button>
        </Link>
      </div>
    );
  }

  // 5. Fetch Messages (Only if Public)
  const { data: messages } = await supabase
    .from('messages')
    .select('*')
    .eq('link_id', linkId)
    .order('created_at', { ascending: false });

  return (
    <div className="min-h-screen bg-[#030303] text-white font-sans py-10 px-4 relative">
       {/* Background */}
       <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-purple-900/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-emerald-900/10 rounded-full blur-[120px]" />
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
       </div>

       <div className="max-w-xl mx-auto relative z-10">
           
           {/* Header */}
           <div className="text-center mb-12 animate-in fade-in slide-in-from-top-5 duration-700">
               <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-tr from-emerald-500 to-purple-600 p-[3px] mb-4 shadow-2xl">
                   <img src={profile.avatar_url || `https://api.dicebear.com/9.x/micah/svg?seed=${profile.username}`} className="w-full h-full rounded-full bg-black object-cover" alt="Profile" />
               </div>
               <h1 className="text-3xl font-black tracking-tighter">@{profile.username}</h1>
               <p className="text-emerald-500 text-xs font-bold uppercase tracking-[0.3em] mt-2">Public Inbox Exposed</p>
           </div>

           {/* List */}
           <div className="space-y-8">
               {messages && messages.length > 0 ? messages.map((msg, index) => (
                   <div key={msg.id} className="animate-in fade-in slide-in-from-bottom-8 duration-700" style={{ animationDelay: `${index * 100}ms` }}>
                       
                       {/* Question Bubble */}
                       <div className="bg-[#111] border border-white/10 rounded-[24px] rounded-tl-sm p-6 relative mb-2 shadow-xl group hover:border-emerald-500/30 transition-colors">
                           <div className="absolute -top-3 -left-2 text-2xl">🤫</div>
                           <p className="text-xl font-bold text-gray-200 leading-snug">{cleanContent(msg.content)}</p>
                           <div className="mt-4 flex justify-between items-center border-t border-white/5 pt-3">
                                <span className="text-[10px] text-gray-600 font-mono uppercase tracking-widest">Anonymous</span>
                                <span className="text-[10px] text-gray-600 font-mono">{new Date(msg.created_at).toLocaleDateString()}</span>
                           </div>
                       </div>

                       {/* Reply Bubble (If exists) */}
                       {msg.reply && (
                           <div className="flex justify-end">
                               <div className="bg-gradient-to-br from-emerald-600 to-emerald-900 text-white rounded-[24px] rounded-tr-sm p-5 max-w-[90%] shadow-[0_10px_30px_rgba(16,185,129,0.15)] relative transform transition hover:scale-[1.02]">
                                   <div className="flex items-center gap-2 mb-2 opacity-80">
                                       <img src={profile.avatar_url || ''} className="w-4 h-4 rounded-full bg-black" alt="" />
                                       <span className="text-[10px] font-bold uppercase tracking-widest">Replied</span>
                                   </div>
                                   <p className="font-medium text-lg leading-relaxed">{msg.reply}</p>
                               </div>
                           </div>
                       )}
                   </div>
               )) : (
                   <div className="text-center py-20 border border-dashed border-white/10 rounded-3xl bg-white/5">
                       <div className="text-4xl mb-2">👻</div>
                       <p className="text-gray-500">Inbox is empty... for now.</p>
                   </div>
               )}
           </div>

           {/* Footer CTA */}
           <div className="mt-20 text-center pb-10">
               <p className="text-gray-500 text-sm mb-4">Want to expose your friends? Visit twst.fun</p>
               <Link href="/">
                   <button className="bg-white text-black font-black px-8 py-4 rounded-full hover:scale-105 transition shadow-[0_0_30px_rgba(255,255,255,0.3)]">
                       Get Your Own Link 🚀
                   </button>
               </Link>
           </div>

       </div>
    </div>
  );
}