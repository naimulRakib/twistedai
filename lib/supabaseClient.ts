import { createBrowserClient } from "@supabase/ssr";

// ✅ Uses @supabase/ssr for proper auth persistence in Next.js
// This ensures cookies/session are maintained correctly client-side
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
