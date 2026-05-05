-- Add missing INSERT/UPDATE/DELETE policies on certificate_uploads
CREATE POLICY "Users insert own certificates"
  ON public.certificate_uploads FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own certificates"
  ON public.certificate_uploads FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins manage all certificates"
  ON public.certificate_uploads FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Allow admins to see all certificate rows for review
CREATE POLICY "Admins view all certificates"
  ON public.certificate_uploads FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));
