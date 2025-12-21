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
const GROQ_API_KEY = process.env.GROQ_API_KEY; // <--- NEW

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
  id: string; 
  name: string; 
}

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
   🚀 API CLIENTS (Image Generation)
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
      body: JSON.stringify({ prompt, num_steps: 4 }),
    }
  );

  if (!res.ok) throw new Error(`Cloudflare API Error: ${res.statusText}`);
  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

// 3. POLLINATIONS CLIENT
async function runPollinations(modelId: string, prompt: string): Promise<Buffer> {
  const safePrompt = encodeURIComponent(prompt);
  const seed = Math.floor(Math.random() * 1000000);
  const url = `https://image.pollinations.ai/prompt/${safePrompt}?width=1024&height=1920&model=${modelId}&nologo=true&seed=${seed}`;
  
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  if (!res.ok) throw new Error("Pollinations API Error");
  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/* ============================================================
   🎨 MAIN GENERATION ACTION
============================================================ */
export async function generateAndSaveImageAction(
  userPrompt: string, 
  message: string,
  reply: string,
  modelKey: string = 'pollinations-turbo'
) {
  console.log(`🎨 Generating with Model: [${modelKey}]`);
  
  const config = MODEL_MAP[modelKey] || MODEL_MAP['pollinations-turbo'];
  let finalPrompt = "";
  
  if (userPrompt && userPrompt.length > 2) {
     finalPrompt = `${userPrompt}, masterpiece, best quality, 8k, wallpaper, NO TEXT, NO WORDS`;
  } else {
     const randomStyle = PREMIUM_STYLES[Math.floor(Math.random() * PREMIUM_STYLES.length)];
     if (config.provider === 'nebius') {
         finalPrompt = `Abstract background art. Style: ${randomStyle}. High contrast, 8k, cinematic lighting, wallpaper, NO TEXT, NO WORDS`;
     } else {
         finalPrompt = `Abstract background art representing: "${message}". Style: ${randomStyle}. High contrast, 8k, cinematic lighting, wallpaper, NO TEXT, NO WORDS`;
     }
  }

  let imageBuffer: Buffer;

  try {
    if (config.provider === 'nebius') {
        imageBuffer = await runNebius(config.id, finalPrompt);
    } else if (config.provider === 'cloudflare') {
        imageBuffer = await runCloudflare(config.id, finalPrompt);
    } else {
        imageBuffer = await runPollinations(config.id, finalPrompt);
    }

    const processedBuffer = await sharp(imageBuffer)
      .resize({ width: 850, height: 1511, fit: 'cover' }) 
      .webp({ quality: 80 })
      .toBuffer();

    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.webp`;
    
    const { error: uploadError } = await supabase.storage
      .from("card-backgrounds")
      .upload(fileName, processedBuffer, { contentType: "image/webp" });

    if (uploadError) throw new Error("Upload failed");

    const { data: { publicUrl } } = supabase.storage
      .from("card-backgrounds")
      .getPublicUrl(fileName);

    await supabase.from("cards").insert([
      { message, reply, prompt_used: finalPrompt, image_url: publicUrl },
    ]);

    return publicUrl;

  } catch (error: any) {
    console.error("Generation Failed:", error);
    return "https://placehold.co/1080x1920/101010/FFF.png?text=AI+Server+Busy";
  }
}

/* ============================================================
   ⚡ TEXT UTILITIES (Using GROQ 🚀)
============================================================ */

export async function generateSuggestedRepliesAction(message: string) {
  if (!GROQ_API_KEY) {
    console.error("Missing GROQ_API_KEY");
    return ["Nice!", "Cool", "Okay"];
  }

  try {
    // We use the raw message but strip the tag for the AI context if needed, 
    // though the AI usually handles tags fine.
    const cleanMessage = message.replace(/^\[.*?\]\s*/, "");

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant", // Very fast, low latency
        messages: [
          {
            role: "system",
            content: "You are a witty, Gen-Z social media assistant. Respond ONLY with a JSON array of 3 short strings. Example: [\"Slay!\", \"No way 💀\", \"Bet\"]."
          },
          {
            role: "user",
            content: `Generate 3 short, funny, savage, or wholesome replies for this message: "${cleanMessage}". 
            If the message is in Bengali (Banglish/Bangla), reply in that language. If English, use English.
            Return ONLY the JSON array.`
          }
        ],
        temperature: 0.7,
        max_tokens: 150,
      }),
    });

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    // Extract JSON array using Regex to be safe
    const match = content.match(/\[[\s\S]*\]/);
    if (match) {
      return JSON.parse(match[0]);
    } else {
      console.error("Groq JSON Parse Fail", content);
      return ["Loading...", "Error", "Try Again"];
    }

  } catch (error) {
    console.error("Groq API Error:", error);
    return ["Interesting...", "Tell me more", "Who is this?"];
  }
}

// Simple Prompt Improver for the Frontend
export async function generatePromptAction(message: string, reply: string) {
   return ""; 
}