-- Add UPDATE and DELETE policies for votes table
CREATE POLICY "Users can update own votes"
  ON public.votes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own votes"
  ON public.votes FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger to update vote counts automatically
CREATE OR REPLACE FUNCTION update_vote_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.choice = 'a' THEN
      UPDATE public.questions SET vote_count_a = vote_count_a + 1 WHERE id = NEW.question_id;
    ELSE
      UPDATE public.questions SET vote_count_b = vote_count_b + 1 WHERE id = NEW.question_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.choice <> NEW.choice THEN
      IF OLD.choice = 'a' THEN
        UPDATE public.questions SET vote_count_a = vote_count_a - 1, vote_count_b = vote_count_b + 1 WHERE id = NEW.question_id;
      ELSE
        UPDATE public.questions SET vote_count_a = vote_count_a + 1, vote_count_b = vote_count_b - 1 WHERE id = NEW.question_id;
      END IF;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.choice = 'a' THEN
      UPDATE public.questions SET vote_count_a = vote_count_a - 1 WHERE id = OLD.question_id;
    ELSE
      UPDATE public.questions SET vote_count_b = vote_count_b - 1 WHERE id = OLD.question_id;
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_vote_change
  AFTER INSERT OR UPDATE OR DELETE ON public.votes
  FOR EACH ROW
  EXECUTE FUNCTION update_vote_counts();
