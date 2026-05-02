ALTER TABLE public.profiles ALTER COLUMN hide_phone SET DEFAULT true;
UPDATE public.profiles SET hide_phone = true WHERE hide_phone IS NULL OR hide_phone = false;