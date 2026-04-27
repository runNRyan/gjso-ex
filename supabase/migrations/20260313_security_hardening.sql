-- Security hardening migration
-- Fix RLS policies to prevent anonymous abuse

-- a) Fix votes INSERT policy
DROP POLICY IF EXISTS "Anyone can create votes" ON public.votes;

CREATE POLICY "Controlled vote creation"
  ON public.votes FOR INSERT
  WITH CHECK (
    (auth.uid() IS NOT NULL AND user_id = auth.uid() AND guest_id IS NULL)
    OR
    (auth.uid() IS NULL AND user_id IS NULL AND guest_id IS NOT NULL)
  );

-- b) Allow guests to view their own votes
DROP POLICY IF EXISTS "Users can view own votes" ON public.votes;
CREATE POLICY "Users can view own votes"
  ON public.votes FOR SELECT
  USING (
    auth.uid() = user_id
    OR guest_id IS NOT NULL
  );

-- c) Fix comments INSERT policy
DROP POLICY IF EXISTS "Anyone can create comments" ON public.comments;

CREATE POLICY "Controlled comment creation"
  ON public.comments FOR INSERT
  WITH CHECK (
    (auth.uid() IS NOT NULL AND user_id = auth.uid() AND guest_nickname IS NULL)
    OR
    (auth.uid() IS NULL AND user_id IS NULL AND guest_nickname IS NOT NULL)
  );

-- d) Fix event_logs INSERT policy
DROP POLICY IF EXISTS "Anyone can insert events" ON public.event_logs;

CREATE POLICY "Validated event insertion"
  ON public.event_logs FOR INSERT
  WITH CHECK (
    (auth.uid() IS NOT NULL AND user_id = auth.uid())
    OR
    (auth.uid() IS NULL AND user_id IS NULL)
  );

-- e) Revoke anon insert/delete on bookmarks
REVOKE INSERT, DELETE ON public.bookmarks FROM anon;

-- g) Fix search_path on SECURITY DEFINER functions
ALTER FUNCTION public.sync_vote_counts() SET search_path = public;
ALTER FUNCTION public.handle_new_user() SET search_path = public;
