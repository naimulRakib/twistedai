'use client';

import React, { useEffect, useState } from 'react';
import { getDynamicAvatarUrl } from '../utils/getAvatarUrl';

interface Props {
  uid: string;
  className?: string;
}

export default function ProfileImage({ uid, className = "w-24 h-24" }: Props) {
  // Default to DiceBear until we find the real image
  const [src, setSrc] = useState(`https://api.dicebear.com/9.x/identicon/svg?seed=${uid}&backgroundColor=c0aede`);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchImage = async () => {
      if (!uid) return;
      
      // Call our utility function
      const url = await getDynamicAvatarUrl(uid);
      
      if (url) {
        setSrc(url);
      }
      setLoading(false);
    };

    fetchImage();
  }, [uid]);

  return (
    <div className={`relative rounded-full overflow-hidden border-2 border-emerald-500/50 ${className}`}>
      {loading && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center animate-pulse">
           <div className="w-full h-full bg-emerald-900/20"></div>
        </div>
      )}
      
      <img 
        src={src} 
        alt="Profile" 
        className="w-full h-full object-cover bg-black"
        // Fallback if the constructed URL somehow fails
        onError={(e) => { e.currentTarget.src = `https://api.dicebear.com/9.x/micah/svg?seed=${uid}`; }}
      />
    </div>
  );
}
