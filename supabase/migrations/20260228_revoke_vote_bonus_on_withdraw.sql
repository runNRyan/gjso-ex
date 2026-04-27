-- 투표 철회 시 지급된 포인트 회수
CREATE OR REPLACE FUNCTION public.revoke_vote_bonus()
RETURNS TRIGGER AS $$
DECLARE
  total_refund INTEGER := 0;
BEGIN
  IF OLD.user_id IS NULL THEN
    RETURN OLD;
  END IF;

  -- point_history에서 해당 투표로 지급된 vote_bonus 합산
  SELECT COALESCE(SUM(amount), 0) INTO total_refund
  FROM public.point_history
  WHERE user_id = OLD.user_id
    AND type = 'vote_bonus'
    AND reference_id = OLD.question_id;

  IF total_refund > 0 THEN
    -- 포인트 차감
    UPDATE public.profiles
    SET point_balance = GREATEST(point_balance - total_refund, 0)
    WHERE id = OLD.user_id;

    -- 지급 내역 삭제
    DELETE FROM public.point_history
    WHERE user_id = OLD.user_id
      AND type = 'vote_bonus'
      AND reference_id = OLD.question_id;
  END IF;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 기존 트리거가 있다면 삭제
DROP TRIGGER IF EXISTS revoke_vote_bonus_trigger ON public.votes;

-- 트리거 생성: 투표 삭제(철회) 시 실행
CREATE TRIGGER revoke_vote_bonus_trigger
  BEFORE DELETE ON public.votes
  FOR EACH ROW
  EXECUTE FUNCTION public.revoke_vote_bonus();
