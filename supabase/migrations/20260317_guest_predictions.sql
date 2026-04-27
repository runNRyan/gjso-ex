-- Allow guest predictions (user_id nullable, guest_id added)
ALTER TABLE public.predictions
  ALTER COLUMN user_id DROP NOT NULL,
  ADD COLUMN guest_id TEXT;

-- Guest prediction uniqueness
ALTER TABLE public.predictions
  ADD CONSTRAINT predictions_question_guest_unique UNIQUE(question_id, guest_id);

-- Ensure either user_id or guest_id is set, not both
ALTER TABLE public.predictions
  ADD CONSTRAINT predictions_user_or_guest CHECK (
    (user_id IS NOT NULL AND guest_id IS NULL) OR
    (user_id IS NULL AND guest_id IS NOT NULL)
  );

-- Add guest_migrated flag to profiles (new users default FALSE, existing users set TRUE)
ALTER TABLE public.profiles
  ADD COLUMN guest_migrated BOOLEAN NOT NULL DEFAULT FALSE;

-- Mark all existing users as already migrated (only new sign-ups get migration)
UPDATE public.profiles SET guest_migrated = TRUE;

-- RLS: Allow guest prediction inserts
CREATE POLICY "Guest prediction creation"
  ON public.predictions FOR INSERT
  WITH CHECK (
    (auth.uid() IS NOT NULL AND user_id = auth.uid() AND guest_id IS NULL)
    OR
    (auth.uid() IS NULL AND user_id IS NULL AND guest_id IS NOT NULL)
  );
