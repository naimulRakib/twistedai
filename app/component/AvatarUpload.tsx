'use client';

import React, { useState } from 'react';

import { useToast } from '../context/ToastContext';
import { supabase } from '@/lib/supabaseClient';
interface Props {
  uid: string;
  url: string | null;
  onUploadComplete: (newUrl: string) => void;
}

export default function AvatarUpload({ uid, url, onUploadComplete }: Props) {
  const toast =useToast();
 
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(url);

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);

      if (!event.target.files || event.target.files.length === 0) {
        return;
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const filePath = `avatars/${uid}/${Date.now()}.${fileExt}`;

      // 1. Upload Image
      const { error: uploadError } = await supabase.storage
        .from('user-uploads')
        .upload(filePath, file, { upsert: true });
        console.log(uploadError);
      if (uploadError) throw uploadError;

      // 2. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('user-uploads')
        .getPublicUrl(filePath);
        

      // 3. SMART UPDATE: Check if profile exists first
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', uid)
        .single();

      let error;
      
      if (existingProfile) {
        // A. Profile exists? UPDATE it.
        const { error: updateErr } = await supabase
          .from('profiles')
          .update({ avatar_url: publicUrl })
          .eq('id', uid);
        error = updateErr;
      } else {
        // B. Profile missing? INSERT it.
        // We generate a random username if one is missing
        const randomName = `Agent_${uid.slice(0,4)}`;
        const { error: insertErr } = await supabase
          .from('profiles')
          .insert({ 
            id: uid, 
            avatar_url: publicUrl,
            username: randomName,
            display_name: 'Ghost Agent'
          });
        error = insertErr;
      }

      if (error) throw error;

      // 4. Success
      setPreview(publicUrl);
      onUploadComplete(publicUrl);
      toast.success("Profile Picture Updated! 📸");

    } catch (error: any) {
      console.error("Upload Error:", error);
      toast.error('Error: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative group cursor-pointer">
        <div className="absolute -inset-1 bg-gradient-to-tr from-emerald-500 to-cyan-500 rounded-full blur opacity-40 group-hover:opacity-80 transition duration-500"></div>
        <label htmlFor="avatar-upload" className="relative block w-32 h-32 rounded-full p-[2px] bg-gradient-to-tr from-emerald-500 to-cyan-500 overflow-hidden cursor-pointer">
            <img 
               
           
                className={`w-full h-full object-cover bg-black rounded-full transition-opacity duration-300 ${uploading ? 'opacity-50' : 'opacity-100'}`} 
            />
            {uploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
            )}
            <input
                type="file"
                id="avatar-upload"
                accept="image/*"
                onChange={uploadAvatar}
                disabled={uploading}
                className="hidden"
            />
        </label>
      </div>
      <p className="text-xs text-emerald-500/70 font-mono uppercase tracking-widest">
        {uploading ? 'UPLOADING...' : 'TAP TO CHANGE & RELOAD TO SEE'}
      </p>
    </div>
  );
}