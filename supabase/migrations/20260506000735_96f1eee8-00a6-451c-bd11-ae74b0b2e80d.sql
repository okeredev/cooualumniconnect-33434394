
-- Validation trigger to prevent manipulation of votes
CREATE OR REPLACE FUNCTION public.validate_vote()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_active boolean;
  v_starts timestamptz;
  v_ends timestamptz;
  v_verified boolean;
  v_cand_election uuid;
BEGIN
  IF NEW.user_id IS NULL OR NEW.user_id <> auth.uid() THEN
    RAISE EXCEPTION 'Vote user_id must match authenticated user';
  END IF;

  SELECT verified INTO v_verified FROM public.profiles WHERE user_id = NEW.user_id;
  IF COALESCE(v_verified, false) = false THEN
    RAISE EXCEPTION 'Only verified alumni may vote';
  END IF;

  SELECT active, starts_at, ends_at INTO v_active, v_starts, v_ends
  FROM public.elections WHERE id = NEW.election_id;
  IF v_active IS NULL THEN
    RAISE EXCEPTION 'Election not found';
  END IF;
  IF COALESCE(v_active, false) = false THEN
    RAISE EXCEPTION 'Election is not active';
  END IF;
  IF now() < v_starts OR now() > v_ends THEN
    RAISE EXCEPTION 'Voting is not open for this election';
  END IF;

  SELECT election_id INTO v_cand_election FROM public.election_candidates WHERE id = NEW.candidate_id;
  IF v_cand_election IS NULL OR v_cand_election <> NEW.election_id THEN
    RAISE EXCEPTION 'Candidate does not belong to this election';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_vote_before_insert ON public.votes;
CREATE TRIGGER validate_vote_before_insert
BEFORE INSERT ON public.votes
FOR EACH ROW EXECUTE FUNCTION public.validate_vote();

-- Realtime: full row data + add to publication
ALTER TABLE public.votes REPLICA IDENTITY FULL;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.votes;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.election_candidates;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.elections;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
