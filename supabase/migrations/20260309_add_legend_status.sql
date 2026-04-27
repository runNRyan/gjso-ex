-- 1. question_status enum에 'legend' 추가
ALTER TYPE public.question_status ADD VALUE IF NOT EXISTS 'legend';

-- 2. RLS 정책 업데이트: legend 상태 질문도 조회 가능
DROP POLICY IF EXISTS "Published questions are viewable by everyone" ON public.questions;
CREATE POLICY "Published questions are viewable by everyone"
  ON public.questions FOR SELECT
  USING (status = 'published' OR status = 'closed' OR status = 'legend');

-- 3. close_expired_questions() 함수 수정: golden/silver → status='legend'
CREATE OR REPLACE FUNCTION public.close_expired_questions()
RETURNS INTEGER AS $$
DECLARE
  closed_count INTEGER := 0;
  q RECORD;
  pred RECORD;
  total_votes INTEGER;
  pct_a NUMERIC(4,1);
  b_type TEXT;
  winning_choice TEXT;
  is_hit BOOLEAN;
  reward INTEGER;
  new_status TEXT;
BEGIN
  FOR q IN
    SELECT id, vote_count_a, vote_count_b
    FROM public.questions
    WHERE status = 'published'
      AND close_at IS NOT NULL
      AND close_at <= NOW()
    FOR UPDATE
  LOOP
    total_votes := q.vote_count_a + q.vote_count_b;

    IF total_votes = 0 THEN
      b_type := 'normal';
    ELSE
      pct_a := ROUND((q.vote_count_a::NUMERIC / total_votes) * 100, 1);
      IF pct_a = 50.0 THEN
        b_type := 'golden';
      ELSIF pct_a BETWEEN 40.0 AND 60.0 THEN
        b_type := 'silver';
      ELSE
        b_type := 'normal';
      END IF;
    END IF;

    -- golden/silver → legend, normal → closed
    IF b_type IN ('golden', 'silver') THEN
      new_status := 'legend';
    ELSE
      new_status := 'closed';
    END IF;

    UPDATE public.questions
    SET status = new_status, closed_at = NOW(), balance_type = b_type
    WHERE id = q.id;

    IF b_type = 'golden' THEN
      winning_choice := 'golden';
    ELSIF q.vote_count_a > q.vote_count_b THEN
      winning_choice := 'a';
    ELSIF q.vote_count_b > q.vote_count_a THEN
      winning_choice := 'b';
    ELSE
      winning_choice := 'golden';
    END IF;

    FOR pred IN
      SELECT id, user_id, prediction
      FROM public.predictions
      WHERE question_id = q.id AND is_correct IS NULL
    LOOP
      is_hit := (pred.prediction = winning_choice);

      IF is_hit THEN
        IF pred.prediction = 'golden' THEN
          reward := 1000;
        ELSE
          reward := 100;
        END IF;
      ELSE
        reward := 0;
      END IF;

      UPDATE public.predictions
      SET is_correct = is_hit, reward_points = reward
      WHERE id = pred.id;

      IF is_hit AND reward > 0 THEN
        UPDATE public.profiles
        SET point_balance = point_balance + reward
        WHERE id = pred.user_id;

        INSERT INTO public.point_history (user_id, amount, type, reference_id)
        VALUES (pred.user_id, reward, 'prediction_reward', q.id);
      END IF;
    END LOOP;

    closed_count := closed_count + 1;
  END LOOP;

  RETURN closed_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. 기존 golden/silver closed 질문을 legend로 마이그레이션
UPDATE public.questions
SET status = 'legend'
WHERE status = 'closed' AND balance_type IN ('golden', 'silver');
