'use server';

import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr'; // <--- IMPORT THIS
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function deleteAccountAction() {
  // FIX 1: In Next.js 15, cookies() is a Promise. You must await it.
  const cookieStore = await cookies();
  
  // 1. ADMIN CLIENT (For Deletion Powers)
  // This uses the standard 'supabase-js' because it uses a hardcoded Service Key
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

  // 2. USER CLIENT (For Identity Check)
  // FIX 2: Use 'createServerClient' from '@supabase/ssr' to correctly read cookies
  const supabaseUser = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing user sessions.
          }
        },
      },
    }
  );

  // 3. Get the User
  const { data: { user }, error: userError } = await supabaseUser.auth.getUser();

  if (userError || !user) {
    return { error: "Not authenticated" };
  }

  // 4. Delete the user (Using Admin Client)
  const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);

  if (deleteError) {
    console.error("Delete failed:", deleteError);
    return { error: deleteError.message };
  }

  // 5. Success
  return { success: true };
}