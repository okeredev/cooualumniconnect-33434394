
-- Add alt email, more social links, certificate verification status
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS alt_email text,
  ADD COLUMN IF NOT EXISTS facebook text,
  ADD COLUMN IF NOT EXISTS instagram text,
  ADD COLUMN IF NOT EXISTS youtube text,
  ADD COLUMN IF NOT EXISTS tiktok text,
  ADD COLUMN IF NOT EXISTS telegram text,
  ADD COLUMN IF NOT EXISTS certificate_status text NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS certificate_reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS certificate_reviewed_by uuid,
  ADD COLUMN IF NOT EXISTS certificate_review_notes text;

-- Validate cert status values
CREATE OR REPLACE FUNCTION public.validate_certificate_status()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.certificate_status NOT IN ('none','pending','verified','rejected') THEN
    RAISE EXCEPTION 'Invalid certificate status: %', NEW.certificate_status;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS profiles_validate_cert_status ON public.profiles;
CREATE TRIGGER profiles_validate_cert_status
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.validate_certificate_status();

-- Auto-set status to 'pending' whenever a user uploads/changes a cert,
-- unless an admin is the one updating (preserve admin decisions).
CREATE OR REPLACE FUNCTION public.handle_certificate_upload()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.certificate_url IS DISTINCT FROM OLD.certificate_url THEN
    IF NEW.certificate_url IS NULL THEN
      NEW.certificate_status := 'none';
      NEW.certificate_reviewed_at := NULL;
      NEW.certificate_reviewed_by := NULL;
      NEW.certificate_review_notes := NULL;
    ELSIF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
      NEW.certificate_status := 'pending';
      NEW.certificate_reviewed_at := NULL;
      NEW.certificate_reviewed_by := NULL;
    END IF;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS profiles_handle_cert_upload ON public.profiles;
CREATE TRIGGER profiles_handle_cert_upload
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.handle_certificate_upload();

-- Recreate the profiles_public view to include new fields and keep contact privacy
DROP VIEW IF EXISTS public.profiles_public;
CREATE VIEW public.profiles_public WITH (security_invoker = on) AS
SELECT
  p.id, p.user_id, p.display_name, p.email, p.alt_email, p.avatar_url, p.bio,
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
  p.address, p.current_address, p.city, p.state, p.country,
  p.linkedin, p.github, p.twitter, p.website,
  p.facebook, p.instagram, p.youtube, p.tiktok, p.telegram,
  p.graduation_year, p.department, p.date_of_birth,
  CASE
    WHEN auth.uid() = p.user_id THEN p.certificate_url
    WHEN public.has_role(auth.uid(), 'admin'::public.app_role) THEN p.certificate_url
    ELSE NULL
  END AS certificate_url,
  p.certificate_status,
  p.verified, p.suspended, p.hide_phone, p.last_seen_at,
  p.created_at, p.updated_at
FROM public.profiles p;

GRANT SELECT ON public.profiles_public TO authenticated, anon;
