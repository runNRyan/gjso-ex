-- 이벤트 로그 테이블
CREATE TABLE IF NOT EXISTS public.event_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type TEXT NOT NULL,
  user_id UUID REFERENCES public.profiles(id),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_event_logs_event_type ON public.event_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_event_logs_created_at ON public.event_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_event_logs_user_id ON public.event_logs(user_id);

-- RLS: Anyone can insert events, only admins can read
ALTER TABLE public.event_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert events"
  ON public.event_logs FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view all events"
  ON public.event_logs FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND user_type = 'admin')
  );
