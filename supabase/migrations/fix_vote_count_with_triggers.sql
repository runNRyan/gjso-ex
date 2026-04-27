-- 투표 카운트를 자동으로 관리하는 트리거 생성
-- 이렇게 하면 race condition 없이 정확한 카운팅이 가능합니다

-- 투표 카운트 업데이트 함수
CREATE OR REPLACE FUNCTION public.sync_vote_counts()
RETURNS TRIGGER AS $$
BEGIN
  -- INSERT: 새 투표 추가
  IF (TG_OP = 'INSERT') THEN
    IF NEW.choice = 'a' THEN
      UPDATE public.questions
      SET vote_count_a = vote_count_a + 1
      WHERE id = NEW.question_id;
    ELSIF NEW.choice = 'b' THEN
      UPDATE public.questions
      SET vote_count_b = vote_count_b + 1
      WHERE id = NEW.question_id;
    END IF;
    RETURN NEW;

  -- UPDATE: 투표 변경 (A -> B 또는 B -> A)
  ELSIF (TG_OP = 'UPDATE') THEN
    -- 기존 선택 감소
    IF OLD.choice = 'a' THEN
      UPDATE public.questions
      SET vote_count_a = vote_count_a - 1
      WHERE id = OLD.question_id;
    ELSIF OLD.choice = 'b' THEN
      UPDATE public.questions
      SET vote_count_b = vote_count_b - 1
      WHERE id = OLD.question_id;
    END IF;

    -- 새 선택 증가
    IF NEW.choice = 'a' THEN
      UPDATE public.questions
      SET vote_count_a = vote_count_a + 1
      WHERE id = NEW.question_id;
    ELSIF NEW.choice = 'b' THEN
      UPDATE public.questions
      SET vote_count_b = vote_count_b + 1
      WHERE id = NEW.question_id;
    END IF;
    RETURN NEW;

  -- DELETE: 투표 철회
  ELSIF (TG_OP = 'DELETE') THEN
    IF OLD.choice = 'a' THEN
      UPDATE public.questions
      SET vote_count_a = vote_count_a - 1
      WHERE id = OLD.question_id;
    ELSIF OLD.choice = 'b' THEN
      UPDATE public.questions
      SET vote_count_b = vote_count_b - 1
      WHERE id = OLD.question_id;
    END IF;
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 기존 트리거가 있다면 삭제
DROP TRIGGER IF EXISTS sync_vote_counts_trigger ON public.votes;

-- 트리거 생성
CREATE TRIGGER sync_vote_counts_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.votes
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_vote_counts();

-- 기존 데이터의 카운트를 재계산 (혹시 모를 불일치 해결)
UPDATE public.questions q
SET
  vote_count_a = COALESCE((
    SELECT COUNT(*)
    FROM public.votes v
    WHERE v.question_id = q.id AND v.choice = 'a'
  ), 0),
  vote_count_b = COALESCE((
    SELECT COUNT(*)
    FROM public.votes v
    WHERE v.question_id = q.id AND v.choice = 'b'
  ), 0);
