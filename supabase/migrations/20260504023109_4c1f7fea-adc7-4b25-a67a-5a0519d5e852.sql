
-- 1) Create documents bucket (private; admins can view all, users upload/manage own)
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users upload own documents"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users read own documents"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users update own documents"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users delete own documents"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Admins read all documents"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'documents' AND public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins delete all documents"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'documents' AND public.has_role(auth.uid(), 'admin'::public.app_role));

-- 2) Backfill: regenerate coou_id where year segment doesn't match graduation_year
UPDATE public.profiles
SET coou_id = 'COOU-ALUM-' || graduation_year::text || '-' ||
              LPAD((1000 + floor(random() * 9000))::int::text, 4, '0')
WHERE coou_id IS NOT NULL
  AND graduation_year IS NOT NULL
  AND split_part(coou_id, '-', 3) <> graduation_year::text;
