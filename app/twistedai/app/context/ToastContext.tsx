'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

// --- TYPES ---
type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  toast: {
    success: (msg: string) => void;
    error: (msg: string) => void;
    info: (msg: string) => void;
  };
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// --- 🍬 THE SUPER CARTOON TOAST 🍬 ---
const ToastItem = ({ id, message, type, onClose }: Toast & { onClose: (id: number) => void }) => {
  const [isExiting, setIsExiting] = useState(false);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => onClose(id), 400); // Wait for exit animation
  };

  useEffect(() => {
    const timer = setTimeout(handleClose, 4000);
    return () => clearTimeout(timer);
  }, []);

  // 🎨 CARTOON STYLES
  const styles = {
    success: {
      bg: 'bg-[#a3e635]', // Neon Lime
      icon: '🎉',
      title: 'YAY!',
      bar: 'bg-green-600'
    },
    error: {
      bg: 'bg-[#ff90e8]', // Hot Pink
      icon: '💣',
      title: 'OOPS!',
      bar: 'bg-pink-600'
    },
    info: {
      bg: 'bg-[#2dd4bf]', // Teal/Cyan
      icon: '👀',
      title: 'HEY!',
      bar: 'bg-teal-700'
    }
  };

  const style = styles[type];

  return (
    <div 
      onClick={handleClose}
      className={`
        relative w-[350px] cursor-pointer overflow-hidden
        border-4 border-black rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]
        ${style.bg}
        transition-all duration-300 ease-in-out
        ${isExiting 
            ? 'opacity-0 translate-x-[100%] rotate-12' // Yeet off screen
            : 'opacity-100 translate-x-0 animate-bounce-in' // Bouncy entrance
        }
        hover:translate-y-[-2px] hover:shadow-[10px_10px_0px_0px_rgba(0,0,0,1)]
        active:translate-y-[2px] active:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
      `}
    >
      {/* Content Layout */}
      <div className="flex items-stretch">
        
        {/* Icon Section */}
        <div className="flex items-center justify-center px-5 border-r-4 border-black bg-white/20 text-4xl">
          {style.icon}
        </div>

        {/* Text Section */}
        <div className="p-4 flex-1 min-w-0">
          <h4 className="font-black text-2xl tracking-tighter text-black leading-none mb-1 uppercase italic">
            {style.title}
          </h4>
          <p className="font-bold text-black text-sm leading-tight font-mono break-words">
            {message}
          </p>
        </div>

        {/* Close 'X' */}
        <button className="px-3 flex items-start pt-2 hover:text-white transition-colors text-black font-black text-xl">
          ✕
        </button>
      </div>

      {/* Retro Progress Bar */}
      <div className="h-2 w-full bg-black/20 border-t-4 border-black">
        <div className={`h-full ${style.bar} animate-[progress_4s_linear_forwards] origin-left`}></div>
      </div>

      {/* ✨ Sparkles (Decoration) */}
      <div className="absolute top-1 right-8 text-black opacity-20 text-xl font-black pointer-events-none">+</div>
      <div className="absolute bottom-2 left-16 text-black opacity-20 text-xs font-black pointer-events-none">✦</div>

      {/* CSS for the BOUNCE animation */}
      <style jsx>{`
        @keyframes bounce-in {
          0% { transform: scale(0.5) translateY(-100px); opacity: 0; }
          60% { transform: scale(1.1) translateY(10px); opacity: 1; }
          100% { transform: scale(1) translateY(0); }
        }
        .animate-bounce-in {
          animation: bounce-in 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
        @keyframes progress {
          0% { width: 100%; }
          100% { width: 0%; }
        }
      `}</style>
    </div>
  );
};

// --- PROVIDER (Standard Logic) ---
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((message: string, type: ToastType) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const toast = {
    success: (msg: string) => addToast(msg, 'success'),
    error: (msg: string) => addToast(msg, 'error'),
    info: (msg: string) => addToast(msg, 'info'),
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
    
      <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-4 pointer-events-none">
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto">
            <ToastItem {...t} onClose={removeToast} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within a ToastProvider');
  return context.toast;
};