-- 모든 투표 데이터 리셋
-- 주의: 이 스크립트는 모든 투표 데이터를 삭제합니다!

-- 1. 모든 투표 데이터 삭제 (트리거가 자동으로 vote_count 업데이트)
DELETE FROM public.votes;

-- 2. vote_count 재계산 (안전장치)
UPDATE public.questions
SET
  vote_count_a = 0,
  vote_count_b = 0;

-- 3. 확인
SELECT
  COUNT(*) as total_votes_remaining,
  (SELECT COUNT(*) FROM questions WHERE vote_count_a > 0 OR vote_count_b > 0) as questions_with_votes
FROM votes;
