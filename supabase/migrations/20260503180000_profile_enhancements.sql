-- ============================================================
-- Profile Enhancements Migration
-- 1. New profile fields: alt_email, facebook, instagram, youtube, tiktok, date_of_birth
-- 2. Certificate uploads table
-- 3. Birthday reminders log
-- ============================================================

-- 1. Add new columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS alt_email TEXT,
  ADD COLUMN IF NOT EXISTS facebook TEXT,
  ADD COLUMN IF NOT EXISTS instagram TEXT,
  ADD COLUMN IF NOT EXISTS youtube TEXT,
  ADD COLUMN IF NOT EXISTS tiktok TEXT,
  ADD COLUMN IF NOT EXISTS date_of_birth DATE;

-- 2. Certificate uploads
CREATE TABLE IF NOT EXISTS public.certificate_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending | verified | rejected
  admin_notes TEXT,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.certificate_uploads ENABLE ROW LEVEL SECURITY;

-- Users can view their own certificates
CREATE POLICY "Users view own certificates" ON public.certificate_uploads
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- Users can upload certificates
CREATE POLICY "Users upload certificates" ON public.certificate_uploads
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own pending certificates
CREATE POLICY "Users delete own pending certs" ON public.certificate_uploads
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id AND status = 'pending');

-- Admins manage all certificates
CREATE POLICY "Admins manage certificates" ON public.certificate_uploads
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER certificate_uploads_updated
  BEFORE UPDATE ON public.certificate_uploads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for certificates
INSERT INTO storage.buckets (id, name, public)
VALUES ('certificates', 'certificates', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users upload own certs" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'certificates' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users view own cert files" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'certificates' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.has_role(auth.uid(), 'admin')));

CREATE POLICY "Admins view all cert files" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'certificates' AND public.has_role(auth.uid(), 'admin'));

-- 3. Birthday greetings log (for tracking sent reminders)
CREATE TABLE IF NOT EXISTS public.birthday_greetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  greeting_year INT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, greeting_year)
);
ALTER TABLE public.birthday_greetings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage greetings" ON public.birthday_greetings
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Index for birthday queries
CREATE INDEX IF NOT EXISTS idx_profiles_dob ON public.profiles (date_of_birth);
