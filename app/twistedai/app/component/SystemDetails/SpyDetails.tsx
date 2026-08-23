import React from 'react';
import { EyeOff, MapPin, Bot, MessageCircle, Ghost, AlertOctagon, Ban, Laugh } from 'lucide-react';

const CartoonSpyMode = () => {
  return (
    <div className="min-h-screen bg-blue-100 p-6 flex items-center justify-center font-comic selection:bg-yellow-300 selection:text-purple-900 rounded-3xl" style={{ fontFamily: '"Comic Sans MS", "Comic Sans", cursive' }}>
      
      {/* Background Pattern */}
      <div className="fixed inset-0 pointer-events-none opacity-20" style={{
        backgroundImage: 'radial-gradient(circle, #a855f7 2px, transparent 2px), radial-gradient(circle, #3b82f6 2px, transparent 2px)',
        backgroundSize: '40px 40px',
        backgroundPosition: '0 0, 20px 20px'
      }}></div>

      {/* Main Container Board */}
      <div className="relative w-full max-w-3xl bg-white border-[8px] border-purple-400 rounded-[3rem] shadow-[0_10px_0_#9333ea] overflow-hidden">
        
        {/* Header Header */}
        <div className="bg-purple-400 p-6 flex items-center justify-between border-b-4 border-purple-600">
          <div className="flex items-center gap-4">
            <div className="bg-yellow-300 p-3 rounded-full border-4 border-black transform -rotate-12 shadow-[4px_4px_0_black]">
              <EyeOff className="w-8 h-8 text-black" />
            </div>
            <h1 className="text-4xl font-black text-white uppercase tracking-wider transform -rotate-2 text-stroke-black">
              SPY MODE!
            </h1>
          </div>
          <div className="bg-red-400 text-white font-bold px-4 py-2 rounded-full border-4 border-red-700 shadow-[2px_2px_0_#b91c1c] transform rotate-6 text-sm">
            JUST FOR FUN!
          </div>
        </div>

        {/* Content Body */}
        <div className="p-8 space-y-8 bg-gradient-to-b from-purple-50 to-blue-50">

          {/* 1. The "Fun" Disclaimer Bubble */}
          <div className="relative bg-yellow-100 border-4 border-yellow-400 rounded-2xl p-6 shadow-[6px_6px_0_#eab308]">
            <div className="absolute -top-6 -left-4 transform rotate-[-15deg]">
              <Laugh className="w-12 h-12 text-yellow-600 drop-shadow-md" />
            </div>
            <p className="text-lg text-yellow-800 font-bold leading-snug ml-6">
              "This mode is just for fun and will be disabled as soon as possible!"
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 2. Ethics Panel */}
            <div className="bg-red-100 border-4 border-red-300 rounded-2xl p-5 shadow-[4px_4px_0_#fca5a5]">
              <div className="flex items-center gap-2 mb-3 text-red-600 font-bold text-xl">
                <AlertOctagon className="w-6 h-6" />
                Ethical Note!
              </div>
              <p className="text-red-800 font-medium">
                Accessing public data is unethical; however, we ensure that no harm is done here. You cannot access others' messaging data using random message IDs! Only the channel creator can access Spy Data!
              </p>
            </div>
            
            {/* 3. Location Panel */}
            <div className="bg-blue-100 border-4 border-blue-300 rounded-2xl p-5 shadow-[4px_4px_0_#93c5fd]">
              <div className="flex items-center gap-2 mb-3 text-blue-600 font-bold text-xl">
                <MapPin className="w-6 h-6" />
                Location Info
              </div>
              <div className="w-full bg-blue-200 h-4 rounded-full border-2 border-blue-400 mb-2 overflow-hidden relative">
                <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-blue-600 z-10">Is it here? Or there?</div>
                <div className="bg-blue-400 h-full w-[80%] rounded-full animate-pulse"></div>
              </div>
              <p className="text-blue-800 font-medium text-right text-sm">Location is 80% accurate, but not fully functional.</p>
            </div>
          </div>

          {/* 4. AI Disabled & Confusion */}
          <div className="space-y-6">
             {/* AI Banner */}
            <div className="flex items-center justify-center gap-3 bg-gray-200 border-4 border-gray-400 p-3 rounded-xl text-gray-600 font-bold shadow-[4px_4px_0_#9ca3af]">
              <Bot className="w-6 h-6 text-gray-500" />
              <Ban className="w-5 h-5 text-red-500" />
              We have disabled the Web LLM AI model in Spy Mode for security reasons!
            </div>

            {/* Confusion Bubbles */}
            <div className="bg-green-100 border-4 border-green-400 rounded-3xl p-6 relative shadow-[6px_6px_0_#4ade80]">
              <div className="absolute -top-5 right-10 bg-green-400 text-white font-bold px-4 py-1 rounded-full border-2 border-green-600 transform rotate-6">
                CONFUSION TACTICS!
              </div>
              <p className="text-green-800 font-bold mb-4 text-center">
                Confuse them by showing them their own data, like:
              </p>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <MessageCircle className="w-8 h-8 text-blue-500 transform -scale-x-100" />
                  <div className="bg-white border-2 border-blue-400 p-4 rounded-2xl rounded-tl-none shadow-sm">
                    "<span className="text-purple-600 font-extrabold">Hey Mac user, so rich, huh?</span>"
                  </div>
                </div>
                <div className="flex items-start gap-3 justify-end">
                  <div className="bg-white border-2 border-orange-400 p-4 rounded-2xl rounded-tr-none shadow-sm text-right">
                    "Hey, <span className="text-orange-600 font-extrabold">Cumilla insider! How is it going?</span>"
                  </div>
                  <MessageCircle className="w-8 h-8 text-orange-500" />
                </div>
              </div>
            </div>
          </div>

          {/* 5. The Twist / Fun Fact */}
          <div className="flex items-center gap-4 justify-center p-4 bg-purple-200 border-4 border-dashed border-purple-400 rounded-xl transform -rotate-1">
            <Ghost className="w-8 h-8 text-purple-600 animate-bounce" />
            <p className="text-purple-800 font-bold text-lg">
              <span className="text-purple-600 font-extrabold underline decoration-wavy">Fun fact:</span> It won't remain an anonymous chat for much longer, haha!
            </p>
          </div>

        </div>

        {/* Footer Warning Tape */}
        <div className="bg-yellow-400 p-4 border-t-4 border-black flex items-center justify-center gap-2">
          <AlertOctagon className="w-6 h-6 text-black" />
          <p className="text-black font-black uppercase tracking-tight text-center text-sm md:text-base">
            Spy mode will be disabled or strictly limited in the official web app!
          </p>
          <AlertOctagon className="w-6 h-6 text-black" />
        </div>

      </div>
    </div>
  );
};

export default CartoonSpyMode;