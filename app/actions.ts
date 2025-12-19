'use server'

import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';
import { Buffer } from 'node:buffer';

/* ============================================================
   🔐 ENV CONFIGURATION
============================================================ */
const NEBIUS_API_KEY = process.env.NEBIUS_API_KEY;
const CLOUDFLARE_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const CLOUDFLARE_TOKEN = process.env.CLOUDFLARE_API_TOKEN;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/* ============================================================
   🎨 PRESET STYLES (For Random Injection)
============================================================ */
const PREMIUM_STYLES = [
  "Cyberpunk Neon City, rain reflections, futuristic",
  "Studio Ghibli Anime Style, lush green, clouds, dreamy",
  "Vaporwave Aesthetic, pink and blue gradients, retro 80s grid",
  "Dark Fantasy, gothic architecture, moody fog, mysterious",
  "Minimalist Abstract, geometric shapes, bauhaus, clean lines",
  "Cinematic Sci-Fi, space nebula, stars, quantum realm",
  "Oil Painting Impasto, thick brush strokes, starry night vibe",
  "Unreal Engine 5 Render, isometric 3D room, cozy lighting"
];

/* ============================================================
   🎛️ MODEL CONFIGURATION MAP
============================================================ */
type Provider = 'nebius' | 'cloudflare' | 'pollinations';

interface ModelConfig {
  provider: Provider;
  id: string; // The ID sent to the API
  name: string; // Human readable name
}

// You can pass these keys from your frontend dropdown
const MODEL_MAP: Record<string, ModelConfig> = {
  // --- NEBIUS (High Quality) ---
  'nebius-flux': { provider: 'nebius', id: 'black-forest-labs/flux-schnell', name: 'Nebius Flux (Best)' },

  // --- CLOUDFLARE (Fast & Varied) ---
  'cf-flux': { provider: 'cloudflare', id: '@cf/black-forest-labs/flux-1-schnell', name: 'Cloudflare Flux' },
  'cf-sdxl': { provider: 'cloudflare', id: '@cf/bytedance/stable-diffusion-xl-lightning', name: 'Cloudflare SDXL (Fast)' },
  'cf-dreamshaper': { provider: 'cloudflare', id: '@cf/lykon/dreamshaper-8-lcm', name: 'Cloudflare Dreamshaper (3D)' },

  // --- POLLINATIONS (Free / Backup) ---
  'pollinations-flux': { provider: 'pollinations', id: 'flux', name: 'Pollinations Flux' },
  'pollinations-turbo': { provider: 'pollinations', id: 'turbo', name: 'Pollinations Turbo' },
  'pollinations-dark': { provider: 'pollinations', id: 'any-dark', name: 'Pollinations Dark Mode' },
};

/* ============================================================
   🚀 API CLIENTS
============================================================ */

// 1. NEBIUS CLIENT
async function runNebius(modelId: string, prompt: string): Promise<Buffer> {
  if (!NEBIUS_API_KEY) throw new Error("Missing NEBIUS_API_KEY");
  
  const res = await fetch("https://api.studio.nebius.ai/v1/images/generations", {
    method: "POST",
    headers: { "Authorization": `Bearer ${NEBIUS_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: modelId,
      prompt: prompt,
      response_format: "b64_json",
      width: 1024, height: 1024, num_inference_steps: 4, seed: Math.floor(Math.random() * 1000000)
    }),
  });

  if (!res.ok) throw new Error(`Nebius API Error: ${res.statusText}`);
  const data = await res.json();
  return Buffer.from(data.data?.[0]?.b64_json, 'base64');
}

// 2. CLOUDFLARE CLIENT
async function runCloudflare(modelId: string, prompt: string): Promise<Buffer> {
  if (!CLOUDFLARE_ID || !CLOUDFLARE_TOKEN) throw new Error("Missing CLOUDFLARE Keys");

  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ID}/ai/run/${modelId}`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${CLOUDFLARE_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, num_steps: 4 }), // SDXL Lightning needs low steps
    }
  );

  if (!res.ok) throw new Error(`Cloudflare API Error: ${res.statusText}`);
  
  // CF returns raw binary data usually
  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

// 3. POLLINATIONS CLIENT (Free)
async function runPollinations(modelId: string, prompt: string): Promise<Buffer> {
  const safePrompt = encodeURIComponent(prompt);
  const seed = Math.floor(Math.random() * 1000000);
  
  // URL GET Request
  const url = `https://image.pollinations.ai/prompt/${safePrompt}?width=1024&height=1920&model=${modelId}&nologo=true&seed=${seed}`;
  
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0' } // Prevent bot blocking
  });

  if (!res.ok) throw new Error("Pollinations API Error");
  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/* ============================================================
   🎨 MAIN GENERATION ACTION
============================================================ */
export async function generateAndSaveImageAction(
  userPrompt: string, // Can be empty, or a specific command like "Naruto"
  message: string,
  reply: string,
  modelKey: string = 'pollinations-turbo' // Default model
) {
  console.log(`🎨 Generating with Model: [${modelKey}]`);
  
  // Select Model Config FIRST to decide prompt strategy
  const config = MODEL_MAP[modelKey] || MODEL_MAP['pollinations-turbo'];

  // 1. Smart Prompt Construction
  let finalPrompt = "";
  
  // Did the user give a specific visual command? (e.g. "Batman")
  if (userPrompt && userPrompt.length > 2) {
     finalPrompt = `${userPrompt}, masterpiece, best quality, 8k, wallpaper, NO TEXT, NO WORDS`;
  } else {
     // No command? Pick a random style based on the Vibe
     const randomStyle = PREMIUM_STYLES[Math.floor(Math.random() * PREMIUM_STYLES.length)];
     
     // ⚡ FIX: Nebius models (Flux) are very literal. If we include the message text in quotes, 
     // it tries to write that text in the image. We skip the message string completely for Nebius.
     if (config.provider === 'nebius') {
         finalPrompt = `Abstract background art. Style: ${randomStyle}. High contrast, 8k, cinematic lighting, wallpaper, NO TEXT, NO WORDS`;
     } else {
         finalPrompt = `Abstract background art representing: "${message}". Style: ${randomStyle}. High contrast, 8k, cinematic lighting, wallpaper, NO TEXT, NO WORDS`;
     }
  }

  let imageBuffer: Buffer;

  try {
    // 2. Route to Provider
    if (config.provider === 'nebius') {
        imageBuffer = await runNebius(config.id, finalPrompt);
    } else if (config.provider === 'cloudflare') {
        imageBuffer = await runCloudflare(config.id, finalPrompt);
    } else {
        imageBuffer = await runPollinations(config.id, finalPrompt);
    }

    // 3. Process Image (Compress & Resize for Mobile Stories)
    const processedBuffer = await sharp(imageBuffer)
      .resize({ width: 850, height: 1511, fit: 'cover' }) // 9:16 Aspect Ratio
      .webp({ quality: 80 })
      .toBuffer();

    // 4. Upload to Supabase
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.webp`;
    
    const { error: uploadError } = await supabase.storage
      .from("card-backgrounds")
      .upload(fileName, processedBuffer, { contentType: "image/webp" });

    if (uploadError) throw new Error("Upload failed");

    const { data: { publicUrl } } = supabase.storage
      .from("card-backgrounds")
      .getPublicUrl(fileName);

    // 5. Save Record
    await supabase.from("cards").insert([
      { message, reply, prompt_used: finalPrompt, image_url: publicUrl },
    ]);

    return publicUrl;

  } catch (error: any) {
    console.error("Generation Failed:", error);
    // Fallback Placeholder if AI breaks
    return "https://placehold.co/1080x1920/101010/FFF.png?text=AI+Server+Busy";
  }
}

/* ============================================================
   ⚡ TEXT UTILITIES (Pollinations GPT-4o-Mini)
============================================================ */

export async function generateSuggestedRepliesAction(message: string) {
  const prompt = `Generate 3 short, witty, Gen-Z style replies for the message: "${message}". 
  Rules: If Bangla, reply Bangla. If English, reply English. 
  Return ONLY a JSON array ["A", "B", "C"].`;

  try {
    const url = `https://text.pollinations.ai/${encodeURIComponent(prompt)}?model=openai&seed=${Math.random()}`;
    const res = await fetch(url);
    const text = await res.text();
    // Extract JSON from text
    const match = text.match(/\[[\s\S]*\]/);
    return match ? JSON.parse(match[0]) : ["Interesting...", "Tell me more", "Who is this?"];
  } catch {
    return ["Nice!", "Cool", "Okay"];
  }
}

// Simple Prompt Improver for the Frontend
export async function generatePromptAction(message: string, reply: string) {
   // We don't really need this anymore since logic is inside generateAndSaveImageAction
   // But keeping it for compatibility if your UI calls it
   return ""; 
}