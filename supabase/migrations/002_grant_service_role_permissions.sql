-- ==============================================================================
-- 파일명: supabase/migrations/002_grant_service_role_permissions.sql
-- 설명: 백엔드 서버(service_role)가 sentiment_analyses 테이블에 데이터를 정상적으로
--       저장(INSERT) 및 조회(SELECT)할 수 있도록 데이터베이스 권한을 부여하는 스크립트
-- ==============================================================================

-- 1. sentiment_analyses 테이블에 대한 모든 CRUD 권한을 service_role에게 부여
GRANT ALL ON TABLE public.sentiment_analyses TO service_role;

-- 2. 관리자(postgres) 역할에 대한 기본 권한 확인
GRANT ALL ON TABLE public.sentiment_analyses TO postgres;

-- 3. public 스키마 사용 권한 보장
GRANT USAGE ON SCHEMA public TO service_role;

