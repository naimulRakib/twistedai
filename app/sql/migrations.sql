-- ============================================================
-- TWST.FUN DATABASE MIGRATIONS
-- Run these in your Supabase SQL Editor in order
-- ============================================================

-- 1. Add view_count column to links table
ALTER TABLE links 
ADD COLUMN IF NOT EXISTS view_count integer DEFAULT 0 NOT NULL;

-- 2. Create the increment_views RPC function (called from client-side safely)
CREATE OR REPLACE FUNCTION increment_views(link_uuid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE links
  SET view_count = view_count + 1
  WHERE id = link_uuid;
END;
$$;

-- Grant execute permission to anonymous users (they're the ones viewing links)
GRANT EXECUTE ON FUNCTION increment_views(uuid) TO anon;
GRANT EXECUTE ON FUNCTION increment_views(uuid) TO authenticated;

-- 3. RLS Policy: Allow anyone to call increment_views
-- (Already handled via SECURITY DEFINER + GRANT above)

-- 4. Ensure short_links table has the right structure
-- (Should already exist — this is just a safety check)
ALTER TABLE short_links
ADD COLUMN IF NOT EXISTS click_count integer DEFAULT 0 NOT NULL;

-- 5. Increment short link click count when redirected
CREATE OR REPLACE FUNCTION increment_short_link_clicks(link_slug text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE short_links
  SET click_count = click_count + 1
  WHERE slug = link_slug;
END;
$$;

GRANT EXECUTE ON FUNCTION increment_short_link_clicks(text) TO anon;
GRANT EXECUTE ON FUNCTION increment_short_link_clicks(text) TO authenticated;

-- 6. RLS for messages table: anyone can INSERT (for anonymous senders)
-- Make sure this policy exists:
CREATE POLICY IF NOT EXISTS "Allow anonymous inserts to messages"
ON messages FOR INSERT
TO anon
WITH CHECK (true);

-- 7. RLS for live_chat: any authenticated user + anon with correct master_id
CREATE POLICY IF NOT EXISTS "Allow authenticated reads on live_chat"
ON live_chat FOR SELECT
TO authenticated
USING (true);

CREATE POLICY IF NOT EXISTS "Allow inserts on live_chat"
ON live_chat FOR INSERT
TO authenticated
WITH CHECK (true);

-- ============================================================
-- SUMMARY OF CHANGES:
-- • links.view_count: tracks how many times each link was opened
-- • increment_views(uuid): safely bumps view count from browser
-- • short_links.click_count: tracks short link redirect count
-- • increment_short_link_clicks(text): bumps short link count
-- ============================================================
