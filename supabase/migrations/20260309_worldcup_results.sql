-- 불호 월드컵 결과 공유용 테이블
CREATE TABLE IF NOT EXISTS worldcup_results (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  champion_text TEXT NOT NULL,
  personality_type TEXT,
  personality_emoji TEXT,
  personality_subtitle TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 공개 읽기 허용 (공유 링크로 접근)
ALTER TABLE worldcup_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read worldcup results"
  ON worldcup_results FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert worldcup results"
  ON worldcup_results FOR INSERT
  WITH CHECK (true);
