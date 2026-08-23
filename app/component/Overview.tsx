'use client';



interface Message {
  id: number;
  content: string;
  created_at: string;
  author_name?: string;
  reply?: string;
}

interface Props {
  profile: any;
  totalMessages: number; // We can still show badges even if "no data" is the focus
  totalLinks: number;
  recentMessages: Message[];
  onNavigate: (tab: string) => void;
}

export default function DashboardOverview({ 
  profile, 
  totalMessages,
  onNavigate,
}: Props) {

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24 font-sans">
      
      {/* --- 1. HERO SECTION (NGL Style) --- */}
      <div className="relative overflow-hidden bg-gradient-to-br from-pink-500 via-red-500 to-yellow-500 rounded-[40px] p-8 text-center shadow-2xl transform hover:scale-[1.01] transition-all duration-300 group">
          
          {/* Floating Background Emojis */}
          <div className="absolute top-[-20px] left-[-20px] text-[100px] opacity-20 animate-bounce delay-1000">🫣</div>
          <div className="absolute bottom-[-20px] right-[-20px] text-[100px] opacity-20 animate-bounce">💌</div>
          
          <div className="relative z-10">
              <div className="inline-block bg-white/20 backdrop-blur-md border border-white/30 rounded-full px-4 py-1 mb-4">
                  <span className="text-xs font-bold text-white uppercase tracking-widest">
                      @{profile?.username || 'anonymous'}
                  </span>
              </div>
              
              <h1 className="text-4xl md:text-5xl font-black text-white mb-4 drop-shadow-md">
                  Ready for <br/>
                  <span className="text-yellow-200">Secret Messages?</span>
              </h1>
              
              <p className="text-white/90 text-sm font-medium max-w-md mx-auto mb-8 leading-relaxed">
                  Share your private link. Let your friends confess, roast, or ask you anything anonymously. We'll handle the rest. Click on menu or 3-lines option!
              </p>

              <button 
              
                  className="bg-white text-black font-black text-lg px-8 py-4 rounded-2xl shadow-[0_10px_20px_rgba(0,0,0,0.2)] hover:shadow-[0_15px_30px_rgba(0,0,0,0.3)] hover:-translate-y-1 active:translate-y-0 transition-all flex items-center gap-2 mx-auto"
              >
                  <span>🚀</span> Copy My Link
              </button>
          </div>
      </div>
{/* MAIN TEXT: "We are offering!" */}
          <h1 className="text-white font-black text-4xl md:text-5xl tracking-tight leading-tight mb-6 drop-shadow-lg ">
            WE ARE &nbsp;
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500">
              OFFERING :
            </span>
          </h1>
      {/* --- 2. FEATURE GRID (Cartoon Cards) --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

        {/* INBOX CARD */}
        <div 
            onClick={() => onNavigate('Inbox')}
            className="bg-[#1a1a1a] border-4 border-[#2a2a2a] rounded-[30px] p-6 cursor-pointer hover:border-pink-500 transition-all group relative overflow-hidden"
        >
            <div className="absolute right-[-20px] bottom-[-20px] text-[80px] opacity-10 group-hover:opacity-20 transition-opacity grayscale group-hover:grayscale-0">📬</div>
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="text-2xl font-black text-white group-hover:text-pink-400 transition-colors">Inbox</h3>
                    <p className="text-gray-500 text-xs font-bold mt-1">READ YOUR SECRETS</p>
                </div>
                {totalMessages > 0 && (
                    <div className="bg-pink-500 text-white font-black text-sm px-3 py-1 rounded-full shadow-lg animate-pulse">
                        {totalMessages} NEW
                    </div>
                )}
            </div>
        </div>

        {/* ANONYMOUS CHAT CARD (Replaced Smart Reply) */}
        <div 
            onClick={() => onNavigate('Anonymous Chat')}
            className="bg-[#1a1a1a] border-4 border-[#2a2a2a] rounded-[30px] p-6 cursor-pointer hover:border-blue-500 transition-all group relative overflow-hidden"
        >
            <div className="absolute right-[-20px] bottom-[-20px] text-[80px] opacity-10 group-hover:opacity-20 transition-opacity grayscale group-hover:grayscale-0">💬</div>
            <div>
                <h3 className="text-2xl font-black text-white group-hover:text-blue-400 transition-colors">Anonymous Chat</h3>
                <p className="text-gray-500 text-xs font-bold mt-1">SPECIFIC SENDER ONLY</p>
            </div>
            <div className="mt-4 flex gap-2">
                <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-1 rounded-lg">👻 Live</span>
                <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-1 rounded-lg">🔒 Secure</span>
            </div>
        </div>

        {/* STORY CARD */}
        <div 
            onClick={() => onNavigate('Share Card')}
            className="bg-[#1a1a1a] border-4 border-[#2a2a2a] rounded-[30px] p-6 cursor-pointer hover:border-orange-500 transition-all group relative overflow-hidden"
        >
             <div className="absolute right-[-20px] bottom-[-20px] text-[80px] opacity-10 group-hover:opacity-20 transition-opacity grayscale group-hover:grayscale-0">📸</div>
            <div>
                <h3 className="text-2xl font-black text-white group-hover:text-orange-400 transition-colors">Share Card</h3>
                <p className="text-gray-500 text-xs font-bold mt-1">INSTAGRAM & SNAPCHAT</p>
            </div>
             <div className="mt-4 flex -space-x-2 overflow-hidden">
                 {/* Tiny mock avatars representing templates */}
                <div className="inline-block h-6 w-6 rounded-full bg-gradient-to-tr from-orange-400 to-pink-500 ring-2 ring-[#1a1a1a]"></div>
                <div className="inline-block h-6 w-6 rounded-full bg-gradient-to-tr from-purple-400 to-blue-500 ring-2 ring-[#1a1a1a]"></div>
                <div className="inline-block h-6 w-6 rounded-full bg-gradient-to-tr from-green-400 to-teal-500 ring-2 ring-[#1a1a1a]"></div>
            </div>
        </div>

        {/* SPY MODE */}
        <div 
            onClick={() => onNavigate('Smart Reply')}
            className="bg-[#1a1a1a] border-4 border-[#2a2a2a] rounded-[30px] p-6 cursor-pointer hover:border-green-500 transition-all group relative overflow-hidden"
        >
            <div className="absolute right-[-20px] bottom-[-20px] text-[80px] opacity-10 group-hover:opacity-20 transition-opacity grayscale group-hover:grayscale-0">🕵️</div>
            <div>
                <h3 className="text-2xl font-black text-white group-hover:text-green-400 transition-colors">Spy Mode</h3>
                <p className="text-gray-500 text-xs font-bold mt-1">UNMASK THE SENDER</p>
            </div>
             <div className="mt-4">
                <span className="text-[10px] font-mono text-green-500 bg-green-900/20 border border-green-500/30 px-2 py-1 rounded">
                    IP • DEVICE • LOCATION
                </span>
            </div>
        </div>

      </div>

      {/* --- 3. LIVE CHAT BANNER --- */}
      <div 
         
         className="bg-gradient-to-r from-blue-600 to-cyan-500 rounded-[30px] p-6 flex items-center justify-between shadow-lg cursor-pointer hover:scale-[1.01] transition-transform"
      >
          <div>
              <h3 className="text-xl font-black text-white">Anonymous Chat Room 👻</h3>
              <p className="text-blue-100 text-xs font-bold">Talk to strangers. Only a specific sender can access your chat channel.</p>
          </div>
          <div className="bg-white/20 p-3 rounded-full">
             <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
          </div>
      </div>

    </div>
  );
}