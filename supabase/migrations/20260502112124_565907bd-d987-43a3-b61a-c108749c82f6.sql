-- Create a security-invoker view that masks phone/whatsapp when hide_phone is true
-- and the viewer is not the profile owner or an admin.
CREATE OR REPLACE VIEW public.profiles_public
WITH (security_invoker=on) AS
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
  p.city,
  p.state,
  p.country,
  p.linkedin,
  p.github,
  p.twitter,
  p.website,
  p.graduation_year,
  p.department,
  p.verified,
  p.suspended,
  p.hide_phone,
  p.last_seen_at,
  p.created_at,
  p.updated_at
FROM public.profiles p;

GRANT SELECT ON public.profiles_public TO authenticated, anon;