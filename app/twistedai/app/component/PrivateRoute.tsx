"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

import { User } from "@supabase/supabase-js"; // Import type for better TypeScript
import HomeUI from "./Ui";

interface PrivateRouteProps {
  children: React.ReactNode;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true); // 1. Add loading state

  useEffect(() => {
    // 2. Check active session immediately
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false); // Stop loading after initial check
    });

    // 3. Listen for changes (Sign in, Sign out)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false); 
    });

    return () => subscription.unsubscribe();
  }, []);

  // 4. Show a spinner while checking connection
 if (loading) {
    return (
      <div className="min-h-screen bg-[#030303] flex flex-col items-center justify-center relative overflow-hidden">
        
        {/* --- 1. Background FX (Matches your Signup Page) --- */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-emerald-900/10 rounded-full blur-[100px] animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-cyan-900/10 rounded-full blur-[100px] animate-pulse" />
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
        </div>

        {/* --- 2. The Premium Loader --- */}
        <div className="relative z-10 flex flex-col items-center gap-8">
            
            {/* Spinner Container */}
            <div className="relative w-24 h-24">
                {/* Outer Ring (Slow Spin) */}
                <div className="absolute inset-0 rounded-full border-2 border-emerald-500/20 border-t-emerald-500 animate-[spin_3s_linear_infinite]"></div>
                
                {/* Middle Ring (Fast Spin Reverse) */}
                <div className="absolute inset-2 rounded-full border-2 border-cyan-500/20 border-b-cyan-500 animate-[spin_1.5s_linear_infinite_reverse]"></div>
                
                {/* Inner Core (Pulse) */}
                <div className="absolute inset-8 bg-emerald-500/20 rounded-full animate-pulse flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.4)]">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                </div>
            </div>

            {/* Text Status */}
            <div className="text-center space-y-2">
                <h2 className="text-emerald-500 font-bold tracking-[0.2em] text-sm animate-pulse">
                    AUTHENTICATING AGENT
                </h2>
                <div className="flex items-center justify-center gap-1">
                    <span className="w-1 h-1 bg-emerald-500/50 rounded-full animate-bounce"></span>
                    <span className="w-1 h-1 bg-emerald-500/50 rounded-full animate-bounce delay-75"></span>
                    <span className="w-1 h-1 bg-emerald-500/50 rounded-full animate-bounce delay-150"></span>
                </div>
                <p className="text-[10px] text-gray-500 font-mono uppercase">
                    Establishing Secure Connection...
                </p>
            </div>

        </div>
      </div>
    );
  }

  // 5. If no user, show Login
  if (!user) {
    return <HomeUI />;
  }

  // 6. If user exists, show the protected content
  return <>{children}</>;
};

export default PrivateRoute;