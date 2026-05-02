
-- 1. Add new profile columns
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS date_of_birth date,
  ADD COLUMN IF NOT EXISTS current_address text,
  ADD COLUMN IF NOT EXISTS certificate_url text;

-- 2. Recreate privacy view to include new fields
DROP VIEW IF EXISTS public.profiles_public;
CREATE VIEW public.profiles_public
WITH (security_invoker = on)
AS
SELECT
  p.id,
  p.user_id,
  p.display_name,
  p.email,
  p.avatar_url,
  p.bio,
  CASE
    WHEN p.hide_phone IS NOT TRUE THEN p.phone
    WHEN auth.uid() = p.user_id THEN p.phone
    WHEN public.has_role(auth.uid(), 'admin'::public.app_role) THEN p.phone
    ELSE NULL
  END AS phone,
  CASE
    WHEN p.hide_phone IS NOT TRUE THEN p.whatsapp
    WHEN auth.uid() = p.user_id THEN p.whatsapp
    WHEN public.has_role(auth.uid(), 'admin'::public.app_role) THEN p.whatsapp
    ELSE NULL
  END AS whatsapp,
  p.address,
  p.current_address,
  p.city,
  p.state,
  p.country,
  p.linkedin,
  p.github,
  p.twitter,
  p.website,
  p.graduation_year,
  p.department,
  p.date_of_birth,
  CASE
    WHEN auth.uid() = p.user_id THEN p.certificate_url
    WHEN public.has_role(auth.uid(), 'admin'::public.app_role) THEN p.certificate_url
    ELSE NULL
  END AS certificate_url,
  p.verified,
  p.suspended,
  p.hide_phone,
  p.last_seen_at,
  p.created_at,
  p.updated_at
FROM public.profiles p;

GRANT SELECT ON public.profiles_public TO authenticated, anon;

-- 3. Certificates storage bucket (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('certificates', 'certificates', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Users read own certificates" ON storage.objects;
DROP POLICY IF EXISTS "Admins read all certificates" ON storage.objects;
DROP POLICY IF EXISTS "Users upload own certificates" ON storage.objects;
DROP POLICY IF EXISTS "Users update own certificates" ON storage.objects;
DROP POLICY IF EXISTS "Users delete own certificates" ON storage.objects;

CREATE POLICY "Users read own certificates"
ON storage.objects FOR SELECT
USING (bucket_id = 'certificates' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Admins read all certificates"
ON storage.objects FOR SELECT
USING (bucket_id = 'certificates' AND public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Users upload own certificates"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'certificates' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users update own certificates"
ON storage.objects FOR UPDATE
USING (bucket_id = 'certificates' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users delete own certificates"
ON storage.objects FOR DELETE
USING (bucket_id = 'certificates' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 4. Enable realtime publication for chat (so messages update live in production)
ALTER TABLE public.chat_messages REPLICA IDENTITY FULL;
ALTER TABLE public.chat_channels REPLICA IDENTITY FULL;
ALTER TABLE public.chat_channel_members REPLICA IDENTITY FULL;
ALTER TABLE public.profiles REPLICA IDENTITY FULL;

DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
  EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_channels;
  EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_channel_members;
  EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
  EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;

-- 5. Index for upcoming birthdays
CREATE INDEX IF NOT EXISTS idx_profiles_dob_month_day
  ON public.profiles ((EXTRACT(MONTH FROM date_of_birth)), (EXTRACT(DAY FROM date_of_birth)))
  WHERE date_of_birth IS NOT NULL;
