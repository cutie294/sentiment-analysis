-- ==============================================================================
-- 파일명: supabase/migrations/001_create_sentiment_analyses_table.sql
-- 설명: 한국어 감성 분석 결과를 저장하기 위한 sentiment_analyses 테이블 생성 스크립트
-- ==============================================================================

-- 1. sentiment_analyses (감성 분석 결과) 테이블 생성
-- 이미 테이블이 존재할 경우 오류가 나지 않도록 IF NOT EXISTS 옵션을 적용합니다.
CREATE TABLE IF NOT EXISTS public.sentiment_analyses (
  -- id: 각 분석 기록의 고유 식별자 (UUID v4 자동 생성)
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- input_text: 사용자가 입력한 원문 문장 (필수값)
  input_text TEXT NOT NULL,

  -- sentiment: AI가 판별한 감성 라벨 ('positive', 'negative', 'neutral' 중 하나만 허용)
  sentiment TEXT NOT NULL CHECK (sentiment IN ('positive', 'negative', 'neutral')),

  -- confidence: 모델이 추정한 신뢰도 (0 이상 100 이하의 정수값만 허용)
  confidence INTEGER NOT NULL CHECK (confidence BETWEEN 0 AND 100),

  -- reason: AI가 해당 감성으로 판단한 구체적인 한국어 설명 (필수값)
  reason TEXT NOT NULL,

  -- model: 분석에 사용된 AI 모델명 (예: 'gpt-4o-mini', 추후 모델 변경 시 추적 가능)
  model TEXT,

  -- created_at: 레코드가 생성된 일시 (기본값: 데이터가 입력된 현재 시간 UTC)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. 생성 일시(created_at) 역순 정렬 조회를 위한 인덱스 생성
-- 최근 분석 데이터를 빠르게 조회하고 성능 저하를 방지하기 위해 인덱스를 생성합니다.
CREATE INDEX IF NOT EXISTS sentiment_analyses_created_at_idx 
  ON public.sentiment_analyses (created_at DESC);

-- 3. Row Level Security (행 단위 보안, RLS) 활성화
-- 웹 브라우저(익명 사용자)가 악의적으로 데이터를 직접 읽거나 변조하지 못하도록 보호합니다.
-- 백엔드 서버는 비밀키(SUPABASE_SERVICE_ROLE_KEY)를 사용하여 안전하게 저장 작업을 수행합니다.
ALTER TABLE public.sentiment_analyses ENABLE ROW LEVEL SECURITY;

-- 4. 백엔드 서버(service_role)에 테이블 권한 부여
GRANT ALL ON TABLE public.sentiment_analyses TO service_role;
GRANT USAGE ON SCHEMA public TO service_role;

-- 5. 테이블 및 컬럼 한글 설명(주석) 추가 (관리 및 협업 편의성 향상)
COMMENT ON TABLE public.sentiment_analyses IS '한국어 텍스트 감성 분석 결과 저장 테이블';
COMMENT ON COLUMN public.sentiment_analyses.id IS '분석 고유 식별 번호 (UUID)';
COMMENT ON COLUMN public.sentiment_analyses.input_text IS '사용자가 입력한 분석 대상 문장';
COMMENT ON COLUMN public.sentiment_analyses.sentiment IS '감성 분류 결과 (positive: 긍정, negative: 부정, neutral: 중립)';
COMMENT ON COLUMN public.sentiment_analyses.confidence IS 'AI 모델 추정 신뢰도 (0~100%)';
COMMENT ON COLUMN public.sentiment_analyses.reason IS '감성 판단 근거 및 이유';
COMMENT ON COLUMN public.sentiment_analyses.model IS '분석에 사용된 OpenAI 모델명';
COMMENT ON COLUMN public.sentiment_analyses.created_at IS '분석 결과 생성 시각';
