-- 중복된 투표 트리거와 함수 정리
-- 문제: 3개의 트리거가 중복되어 1번 투표가 3번 카운팅됨

-- 1. 중복 트리거 삭제 (최신 sync_vote_counts_trigger만 남김)
DROP TRIGGER IF EXISTS on_vote_change ON public.votes;
DROP TRIGGER IF EXISTS update_vote_count_trigger ON public.votes;

-- 2. 중복 함수 삭제 (최신 sync_vote_counts()만 남김)
DROP FUNCTION IF EXISTS update_vote_count();
DROP FUNCTION IF EXISTS update_vote_counts();

-- 3. vote_count 재계산 (잘못 카운팅된 데이터 수정)
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

-- 4. 최종 확인: sync_vote_counts_trigger만 남아있어야 함
-- SELECT trigger_name FROM information_schema.triggers WHERE event_object_table = 'votes';
