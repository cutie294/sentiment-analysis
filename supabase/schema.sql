-- ==============================================================================
-- 파일명: supabase/schema.sql
-- 설명: Supabase 전체 스키마 정의 (초기 마이그레이션과 동일한 최신 스키마)
-- 상세 마이그레이션 이력은 supabase/migrations/ 폴더를 참조하세요.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.sentiment_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  input_text TEXT NOT NULL,
  sentiment TEXT NOT NULL CHECK (sentiment IN ('positive', 'negative', 'neutral')),
  confidence INTEGER NOT NULL CHECK (confidence BETWEEN 0 AND 100),
  reason TEXT NOT NULL,
  model TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS sentiment_analyses_created_at_idx 
  ON public.sentiment_analyses (created_at DESC);

ALTER TABLE public.sentiment_analyses ENABLE ROW LEVEL SECURITY;

