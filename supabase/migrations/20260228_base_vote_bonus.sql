-- 모든 투표에 기본 1P + 초기 답변자(첫 20명)에게 추가 10P
CREATE OR REPLACE FUNCTION public.award_early_vote_bonus()
RETURNS TRIGGER AS $$
DECLARE
  vote_position INTEGER;
BEGIN
  IF NEW.user_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- 기본 투표 보너스: 모든 투표자에게 10P
  UPDATE public.profiles
  SET point_balance = point_balance + 10
  WHERE id = NEW.user_id;

  INSERT INTO public.point_history (user_id, amount, type, reference_id)
  VALUES (NEW.user_id, 10, 'vote_bonus', NEW.question_id);

  -- 초기 답변자 보너스: 첫 20명에게 추가 10P
  SELECT count(*) INTO vote_position
  FROM public.votes
  WHERE question_id = NEW.question_id;

  IF vote_position <= 20 THEN
    UPDATE public.profiles
    SET point_balance = point_balance + 10
    WHERE id = NEW.user_id;

    INSERT INTO public.point_history (user_id, amount, type, reference_id)
    VALUES (NEW.user_id, 10, 'vote_bonus', NEW.question_id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
