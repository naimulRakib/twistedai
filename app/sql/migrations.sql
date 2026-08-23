-- ============================================================
-- TWISTEDAI — FULL PUBLIC SCHEMA RESET + REBUILD
-- Run in Supabase SQL Editor
-- ============================================================

-- STEP 1: Drop all existing public tables cleanly
-- ============================================================
DROP TABLE IF EXISTS public.live_chat      CASCADE;
DROP TABLE IF EXISTS public.messages       CASCADE;
DROP TABLE IF EXISTS public.linkhistory    CASCADE;
DROP TABLE IF EXISTS public.short_links    CASCADE;
DROP TABLE IF EXISTS public.links          CASCADE;
DROP TABLE IF EXISTS public.cards          CASCADE;
DROP TABLE IF EXISTS public.notes          CASCADE;
DROP TABLE IF EXISTS public.profiles       CASCADE;

-- Drop old functions
DROP FUNCTION IF EXISTS public.increment_views(UUID);
DROP FUNCTION IF EXISTS public.increment_short_link_clicks(TEXT);
DROP FUNCTION IF EXISTS public.handle_new_user();


-- ============================================================
-- STEP 2: PROFILES
-- ============================================================
CREATE TABLE public.profiles (
  id           UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username     TEXT        UNIQUE,
  email        TEXT        UNIQUE,
  display_name TEXT,
  avatar_url   TEXT,
  bio          TEXT,
  is_active    BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_profiles_username ON public.profiles(username);
CREATE INDEX idx_profiles_email    ON public.profiles(email);

-- Auto-create profile on sign-up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, username, email)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'username',
    NEW.email
  ) ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_any"  ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert_own"  ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own"  ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);


-- ============================================================
-- STEP 3: LINKS
-- ============================================================
CREATE TABLE public.links (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_user_id UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name            TEXT        NOT NULL,
  view_count      INTEGER     NOT NULL DEFAULT 0,
  is_public_inbox BOOLEAN     NOT NULL DEFAULT FALSE,
  is_active       BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_links_creator    ON public.links(creator_user_id);
CREATE INDEX idx_links_created_at ON public.links(created_at DESC);

CREATE TRIGGER links_updated_at
  BEFORE UPDATE ON public.links
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.increment_views(link_uuid UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.links SET view_count = view_count + 1 WHERE id = link_uuid;
END;
$$;
GRANT EXECUTE ON FUNCTION public.increment_views(UUID) TO anon, authenticated;

ALTER TABLE public.links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "links_select_any"    ON public.links FOR SELECT USING (true);
CREATE POLICY "links_insert_own"    ON public.links FOR INSERT TO authenticated WITH CHECK (auth.uid() = creator_user_id);
CREATE POLICY "links_update_own"    ON public.links FOR UPDATE TO authenticated USING (auth.uid() = creator_user_id);
CREATE POLICY "links_delete_own"    ON public.links FOR DELETE TO authenticated USING (auth.uid() = creator_user_id);


-- ============================================================
-- STEP 4: LINK HISTORY
-- ============================================================
CREATE TABLE public.linkhistory (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_user_id UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  link_id         UUID        REFERENCES public.links(id) ON DELETE SET NULL,
  content         TEXT        NOT NULL,
  author_name     TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_linkhistory_creator    ON public.linkhistory(creator_user_id);
CREATE INDEX idx_linkhistory_created_at ON public.linkhistory(created_at DESC);

ALTER TABLE public.linkhistory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "linkhistory_select_own" ON public.linkhistory FOR SELECT TO authenticated USING (auth.uid() = creator_user_id);
CREATE POLICY "linkhistory_insert_own" ON public.linkhistory FOR INSERT TO authenticated WITH CHECK (auth.uid() = creator_user_id);
CREATE POLICY "linkhistory_delete_own" ON public.linkhistory FOR DELETE TO authenticated USING (auth.uid() = creator_user_id);


-- ============================================================
-- STEP 5: SHORT LINKS
-- ============================================================
CREATE TABLE public.short_links (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug         TEXT        NOT NULL UNIQUE,
  original_url TEXT        NOT NULL,
  creator_id   UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  click_count  INTEGER     NOT NULL DEFAULT 0,
  is_active    BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_short_links_slug      ON public.short_links(slug);
CREATE       INDEX idx_short_links_creator    ON public.short_links(creator_id);

CREATE OR REPLACE FUNCTION public.increment_short_link_clicks(link_slug TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.short_links SET click_count = click_count + 1 WHERE slug = link_slug;
END;
$$;
GRANT EXECUTE ON FUNCTION public.increment_short_link_clicks(TEXT) TO anon, authenticated;

ALTER TABLE public.short_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "short_links_select_all"  ON public.short_links FOR SELECT USING (true);
CREATE POLICY "short_links_insert_own"  ON public.short_links FOR INSERT TO authenticated WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "short_links_delete_own"  ON public.short_links FOR DELETE TO authenticated USING (auth.uid() = creator_id);


-- ============================================================
-- STEP 6: MESSAGES
-- ============================================================
CREATE TABLE public.messages (
  id          BIGSERIAL   PRIMARY KEY,
  link_id     UUID        NOT NULL REFERENCES public.links(id) ON DELETE CASCADE,
  content     TEXT        NOT NULL,
  author_name TEXT        NOT NULL DEFAULT 'Anonymous',
  reply       TEXT,
  is_public   BOOLEAN     NOT NULL DEFAULT FALSE,
  is_read     BOOLEAN     NOT NULL DEFAULT FALSE,
  spy         JSONB,
  master_id   TEXT,
  lat         TEXT,
  lng         TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_messages_link_id    ON public.messages(link_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX idx_messages_is_public  ON public.messages(is_public);
CREATE INDEX idx_messages_is_read    ON public.messages(is_read);
CREATE INDEX idx_messages_spy_master ON public.messages USING gin(spy);

CREATE TRIGGER messages_updated_at
  BEFORE UPDATE ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
-- Anyone can send (anonymous senders)
CREATE POLICY "messages_insert_anon"   ON public.messages FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "messages_insert_auth"   ON public.messages FOR INSERT TO authenticated WITH CHECK (true);
-- Owner sees all their messages
CREATE POLICY "messages_select_owner"  ON public.messages FOR SELECT TO authenticated
  USING (link_id IN (SELECT id FROM public.links WHERE creator_user_id = auth.uid()));
-- Public sees only is_public=true
CREATE POLICY "messages_select_public" ON public.messages FOR SELECT TO anon USING (is_public = true);
-- Owner updates replies, visibility
CREATE POLICY "messages_update_owner"  ON public.messages FOR UPDATE TO authenticated
  USING (link_id IN (SELECT id FROM public.links WHERE creator_user_id = auth.uid()));
-- Owner deletes
CREATE POLICY "messages_delete_owner"  ON public.messages FOR DELETE TO authenticated
  USING (link_id IN (SELECT id FROM public.links WHERE creator_user_id = auth.uid()));

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;


-- ============================================================
-- STEP 7: LIVE CHAT
-- ============================================================
CREATE TABLE public.live_chat (
  id              BIGSERIAL   PRIMARY KEY,
  link_id         UUID        REFERENCES public.links(id) ON DELETE SET NULL,
  master_id       TEXT        NOT NULL,
  content         TEXT        NOT NULL,
  sender_name     TEXT,
  creator_user_id UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_live_chat_master_id ON public.live_chat(master_id);
CREATE INDEX idx_live_chat_link_id   ON public.live_chat(link_id);
CREATE INDEX idx_live_chat_created   ON public.live_chat(created_at DESC);

ALTER TABLE public.live_chat ENABLE ROW LEVEL SECURITY;
CREATE POLICY "live_chat_select_any" ON public.live_chat FOR SELECT USING (true);
CREATE POLICY "live_chat_insert_any" ON public.live_chat FOR INSERT WITH CHECK (true);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_chat;


-- ============================================================
-- STEP 8: CARDS
-- ============================================================
CREATE TABLE public.cards (
  id          BIGSERIAL   PRIMARY KEY,
  message     TEXT,
  reply       TEXT,
  prompt_used TEXT,
  image_url   TEXT,
  model_used  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_cards_created_at ON public.cards(created_at DESC);

ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cards_select_all" ON public.cards FOR SELECT USING (true);
CREATE POLICY "cards_insert_any" ON public.cards FOR INSERT WITH CHECK (true);


-- ============================================================
-- STEP 9: STORAGE BUCKETS
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('card-backgrounds', 'card-backgrounds', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('our-collection', 'our-collection', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS
CREATE POLICY "storage_card_bg_upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'card-backgrounds');
CREATE POLICY "storage_card_bg_select" ON storage.objects FOR SELECT USING (bucket_id IN ('card-backgrounds', 'our-collection'));


-- ============================================================
-- DONE
-- ============================================================
SELECT 'TwistedAI database rebuilt successfully!' AS status;
