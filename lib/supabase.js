// ==============================================================================
// 파일명: lib/supabase.js
// 설명: Supabase 데이터베이스와 안전하게 통신하여 분석 결과를 저장하는 서버 전용 모듈
// ==============================================================================

import { createClient } from '@supabase/supabase-js';

/**
 * Supabase 서버 클라이언트를 생성하여 반환합니다.
 * 백엔드 서버에서만 사용되며, 서비스 롤 키(SUPABASE_SERVICE_ROLE_KEY)를 통해 RLS를 통과합니다.
 * 
 * @returns {import('@supabase/supabase-js').SupabaseClient}
 */
export function getSupabaseAdminClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (
    !supabaseUrl ||
    !serviceRoleKey ||
    supabaseUrl.includes('your_supabase_project_url_here') ||
    serviceRoleKey.includes('your_supabase_service_role_key_here')
  ) {
    const error = new Error('SUPABASE_URL 또는 SUPABASE_SERVICE_ROLE_KEY 환경 변수가 설정되지 않았습니다.');
    error.code = 'CONFIGURATION_ERROR';
    throw error;
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}

/**
 * 감성 분석 성공 결과를 Supabase의 sentiment_analyses 테이블에 1건 삽입(Insert)합니다.
 * 
 * @param {Object} analysisData - 저장할 데이터 객체
 * @param {string} analysisData.inputText - 사용자가 입력한 원문 텍스트
 * @param {'positive'|'negative'|'neutral'} analysisData.sentiment - 감성 라벨
 * @param {number} analysisData.confidence - 추정 신뢰도 (0~100)
 * @param {string} analysisData.reason - 분석 이유
 * @param {string} [analysisData.model] - 사용된 모델명
 * @returns {Promise<string>} 생성된 레코드의 고유 UUID 식별자(id)
 */
export async function saveSentimentAnalysis({ inputText, sentiment, confidence, reason, model }) {
  const supabase = getSupabaseAdminClient();

  const { data, error } = await supabase
    .from('sentiment_analyses')
    .insert([
      {
        input_text: inputText,
        sentiment: sentiment,
        confidence: confidence,
        reason: reason,
        model: model || null
      }
    ])
    .select('id')
    .single();

  if (error || !data) {
    const dbError = new Error('데이터베이스에 분석 결과를 저장하는 데 실패했습니다.');
    dbError.code = 'DATABASE_ERROR';
    dbError.originalError = error ? error.message : 'Unknown database error';
    throw dbError;
  }

  return data.id;
}

