-- 복합 인덱스 추가: 메인 피드 + 관리자 대시보드 쿼리 최적화
-- 기존 단일 인덱스(status, published_at)를 복합 인덱스로 대체

-- 1. 복합 인덱스가 대체하는 단일 인덱스 삭제
DROP INDEX IF EXISTS idx_questions_status;
DROP INDEX IF EXISTS idx_questions_published_at;

-- 2. 메인 피드 쿼리 최적화: WHERE status = 'published' AND published_at <= now()
CREATE INDEX IF NOT EXISTS idx_questions_status_published_at
  ON public.questions(status, published_at DESC);

-- 3. 랭킹 페이지 최적화: ORDER BY point_balance DESC
CREATE INDEX IF NOT EXISTS idx_profiles_point_balance
  ON public.profiles(point_balance DESC);
