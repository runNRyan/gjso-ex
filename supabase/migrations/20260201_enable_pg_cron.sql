-- pg_cron 확장 활성화: 질문 자동 마감 스케줄링에 사용
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;

-- pg_cron이 public 스키마의 테이블에 접근할 수 있도록 권한 부여
GRANT USAGE ON SCHEMA public TO postgres;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres;
