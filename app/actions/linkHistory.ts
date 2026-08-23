"use server";

import { prisma } from "@/lib/prisma";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// ── Helper: get the current authenticated user ID ─────────────────────────
async function getAuthUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const supabase = createServerClient(
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
            );
          } catch {}
        },
      },
    }
  );
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}

// ── FETCH link history for current user ──────────────────────────────────
export async function fetchLinkHistoryAction() {
  const userId = await getAuthUserId();
  if (!userId) return { error: "Not authenticated.", data: null };

  try {
    const data = await prisma.linkhistory.findMany({
      where: { creator_user_id: userId },
      orderBy: { created_at: "desc" },
    });
    return { data, error: null };
  } catch (err: any) {
    console.error("fetchLinkHistoryAction error:", err);
    return { error: "Could not load link history.", data: null };
  }
}

// ── DELETE a link channel and all associated data ─────────────────────────
export async function deleteLinkChannelAction(linkHistoryId: string) {
  const userId = await getAuthUserId();
  if (!userId) return { error: "Not authenticated." };

  try {
    // Find the linkhistory record to get the link URL/ID
    const historyItem = await prisma.linkhistory.findUnique({
      where: { id: linkHistoryId },
    });

    if (!historyItem || historyItem.creator_user_id !== userId) {
      return { error: "Unauthorized." };
    }

    // Extract the UUID from the stored URL (last segment)
    const linkId = historyItem.content.split("/").pop();

    if (linkId) {
      // Delete messages first (FK constraint)
      await prisma.messages.deleteMany({ where: { link_id: linkId } });
      // Delete the link
      await prisma.links.deleteMany({ where: { id: linkId } });
    }

    // Delete the history record
    await prisma.linkhistory.delete({ where: { id: linkHistoryId } });

    return { error: null };
  } catch (err: any) {
    console.error("deleteLinkChannelAction error:", err);
    return { error: "Delete failed." };
  }
}
