-- 기간별 랭킹 조회를 위한 RPC 함수
-- point_history에 RLS가 적용되어 있으므로 SECURITY DEFINER로 전체 집계 가능하게 함

CREATE OR REPLACE FUNCTION get_period_rankings(start_date timestamp with time zone)
RETURNS TABLE(
  user_id uuid,
  nickname text,
  user_level integer,
  total_points bigint
) AS $$
  SELECT
    ph.user_id,
    p.nickname,
    p.user_level,
    SUM(ph.amount)::bigint AS total_points
  FROM point_history ph
  JOIN profiles p ON p.id = ph.user_id
  WHERE ph.created_at >= start_date
  GROUP BY ph.user_id, p.nickname, p.user_level
  ORDER BY total_points DESC
  LIMIT 100;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 기간별 랭킹에서 활동한 사용자 수 조회
CREATE OR REPLACE FUNCTION get_period_user_count(start_date timestamp with time zone)
RETURNS bigint AS $$
  SELECT COUNT(DISTINCT user_id)::bigint
  FROM point_history
  WHERE created_at >= start_date;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- point_history created_at 인덱스 (기간별 조회 성능 향상)
CREATE INDEX IF NOT EXISTS idx_point_history_created_at
  ON public.point_history(created_at DESC);
