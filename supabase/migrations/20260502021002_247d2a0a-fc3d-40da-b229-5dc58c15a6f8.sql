
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS hide_phone boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_seen_at timestamptz;
