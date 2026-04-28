-- Add moderation status to jobs
ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS reviewed_by uuid;

-- Validation trigger (no CHECK constraint to stay flexible)
CREATE OR REPLACE FUNCTION public.validate_job_status()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.status NOT IN ('pending','approved','rejected') THEN
    RAISE EXCEPTION 'Invalid job status: %', NEW.status;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS jobs_validate_status ON public.jobs;
CREATE TRIGGER jobs_validate_status
BEFORE INSERT OR UPDATE ON public.jobs
FOR EACH ROW EXECUTE FUNCTION public.validate_job_status();

-- Backfill existing rows so previously-posted jobs remain visible
UPDATE public.jobs SET status = 'approved' WHERE status = 'pending' AND posted_by IS NULL;

-- Replace the public-read policy to filter on status
DROP POLICY IF EXISTS "Jobs viewable by all" ON public.jobs;

CREATE POLICY "Approved jobs viewable by all"
ON public.jobs
FOR SELECT
TO public
USING (status = 'approved');

CREATE POLICY "Users view own job submissions"
ON public.jobs
FOR SELECT
TO authenticated
USING (auth.uid() = posted_by);

-- Allow authenticated users to submit jobs (status will default to pending)
CREATE POLICY "Users submit jobs for review"
ON public.jobs
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = posted_by);

CREATE INDEX IF NOT EXISTS idx_jobs_status ON public.jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_posted_by ON public.jobs(posted_by);