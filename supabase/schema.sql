-- 결정소 MVP 데이터베이스 스키마

-- UUID 확장 활성화
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 사용자 권한 타입
CREATE TYPE user_type AS ENUM ('guest', 'ghost', 'member', 'admin');

-- 사용자 프로필 테이블 (Supabase Auth 확장)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT,
  nickname TEXT UNIQUE NOT NULL, -- 자동 생성 (guest_xxx), 나중에 변경 가능
  provider TEXT, -- google/kakao/local
  user_type user_type DEFAULT 'member', -- 사용자 유형: guest/ghost/member/admin (회원가입 시 member)
  user_level INTEGER DEFAULT 1 CHECK (user_level > 0), -- 사용자 레벨 (1부터 시작)
  point_balance INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 질문 테이블
CREATE TABLE IF NOT EXISTS public.questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft', -- draft/published/closed/hidden
  published_at TIMESTAMP WITH TIME ZONE,
  close_at TIMESTAMP WITH TIME ZONE,
  closed_at TIMESTAMP WITH TIME ZONE,
  vote_count_a INTEGER DEFAULT 0,
  vote_count_b INTEGER DEFAULT 0,
  balance_type TEXT, -- null/normal/silver/golden
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES public.profiles(id)
);

-- 투표 테이블
CREATE TABLE IF NOT EXISTS public.votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id),
  guest_id TEXT, -- 브라우저 fingerprint
  choice TEXT NOT NULL CHECK (choice IN ('a', 'b')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(question_id, user_id),
  UNIQUE(question_id, guest_id),
  CHECK (
    (user_id IS NOT NULL AND guest_id IS NULL) OR
    (user_id IS NULL AND guest_id IS NOT NULL)
  )
);

-- 예측 테이블
CREATE TABLE IF NOT EXISTS public.predictions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  prediction TEXT NOT NULL CHECK (prediction IN ('a', 'b', 'golden')),
  is_correct BOOLEAN,
  reward_points INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(question_id, user_id)
);

-- 댓글 테이블
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id),
  guest_nickname TEXT,
  content TEXT NOT NULL,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CHECK (
    (user_id IS NOT NULL AND guest_nickname IS NULL) OR
    (user_id IS NULL AND guest_nickname IS NOT NULL)
  )
);

-- 질문 제보 테이블
CREATE TABLE IF NOT EXISTS public.suggested_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new', -- new/reviewed/used
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 포인트 히스토리 테이블
CREATE TABLE IF NOT EXISTS public.point_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  type TEXT NOT NULL, -- vote_bonus/prediction_reward
  reference_id UUID, -- question_id 등
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_questions_status_published_at ON public.questions(status, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_point_balance ON public.profiles(point_balance DESC);
CREATE INDEX IF NOT EXISTS idx_votes_question_id ON public.votes(question_id);
CREATE INDEX IF NOT EXISTS idx_votes_user_id ON public.votes(user_id);
CREATE INDEX IF NOT EXISTS idx_predictions_question_id ON public.predictions(question_id);
CREATE INDEX IF NOT EXISTS idx_predictions_user_id ON public.predictions(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_question_id ON public.comments(question_id);
CREATE INDEX IF NOT EXISTS idx_point_history_user_id ON public.point_history(user_id);

-- RLS (Row Level Security) 정책
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suggested_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.point_history ENABLE ROW LEVEL SECURITY;

-- Profiles: 모든 사용자가 조회 가능, 본인만 수정 가능
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Questions: 모든 사용자가 published 질문 조회 가능
CREATE POLICY "Published questions are viewable by everyone"
  ON public.questions FOR SELECT
  USING (status = 'published' OR status = 'closed');

-- Votes: 모든 사용자가 생성 가능, 본인 투표만 조회/수정/삭제 가능
CREATE POLICY "Anyone can create votes"
  ON public.votes FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can view own votes"
  ON public.votes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own votes"
  ON public.votes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own votes"
  ON public.votes FOR DELETE
  USING (auth.uid() = user_id);

-- Predictions: 로그인 사용자만 생성 가능
CREATE POLICY "Authenticated users can create predictions"
  ON public.predictions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own predictions"
  ON public.predictions FOR SELECT
  USING (auth.uid() = user_id);

-- Comments: 모든 사용자가 조회 가능, 생성 가능
CREATE POLICY "Comments are viewable by everyone"
  ON public.comments FOR SELECT
  USING (NOT is_deleted);

CREATE POLICY "Anyone can create comments"
  ON public.comments FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update own comments"
  ON public.comments FOR UPDATE
  USING (auth.uid() = user_id);

-- Suggested Questions: 로그인 사용자만 생성 가능
CREATE POLICY "Authenticated users can create suggested questions"
  ON public.suggested_questions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own suggested questions"
  ON public.suggested_questions FOR SELECT
  USING (auth.uid() = user_id);

-- Point History: 본인 히스토리만 조회 가능
CREATE POLICY "Users can view own point history"
  ON public.point_history FOR SELECT
  USING (auth.uid() = user_id);

-- 트리거: updated_at 자동 업데이트
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON public.comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 트리거: 회원가입 시 자동 프로필 생성 (임시 닉네임 자동 생성)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  temp_nickname TEXT;
BEGIN
  -- 임시 닉네임 생성: guest_ + UUID의 앞 8자리
  temp_nickname := 'guest_' || substring(NEW.id::text from 1 for 8);

  INSERT INTO public.profiles (id, email, nickname, provider)
  VALUES (
    NEW.id,
    NEW.email,
    temp_nickname,
    COALESCE(NEW.raw_app_meta_data->>'provider', 'local')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
