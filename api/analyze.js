// ==============================================================================
// 파일명: api/analyze.js
// 설명: 한국어 감성 분석 요청을 처리하는 Vercel Serverless Function API 진입점
// ==============================================================================

import 'dotenv/config'; // 로컬 개발 환경에서 .env 파일의 환경 변수를 자동 로드
import { validateAnalyzeInput } from '../lib/validation.js';
import { analyzeSentimentWithAI } from '../lib/openai.js';
import { saveSentimentAnalysis } from '../lib/supabase.js';
import { createErrorResponse } from '../lib/errors.js';

// IP 기반 요청 제한을 위한 메모리 캐시 (서버리스 인스턴스 생명주기 내 1차 방어)
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1분 (60,000ms)
const MAX_REQUESTS_PER_WINDOW = 15; // 1분당 최대 15회 허용

/**
 * 간단한 IP 요청 빈도 제한(Rate Limiting) 검사기
 * 
 * @param {string} clientIp - 클라이언트 IP 주소
 * @returns {boolean} 제한 초과 여부 (true: 초과됨, false: 허용)
 */
function isRateLimited(clientIp) {
  const now = Date.now();
  const clientData = rateLimitMap.get(clientIp);

  if (!clientData || now - clientData.startTime > RATE_LIMIT_WINDOW_MS) {
    rateLimitMap.set(clientIp, { count: 1, startTime: now });
    return false;
  }

  if (clientData.count >= MAX_REQUESTS_PER_WINDOW) {
    return true;
  }

  clientData.count += 1;
  return false;
}

/**
 * Vercel Serverless Handler
 * 
 * @param {import('http').IncomingMessage} req - 들어오는 HTTP 요청 객체
 * @param {import('http').ServerResponse} res - 나가는 HTTP 응답 객체
 */
export default async function handler(req, res) {
  // 1. HTTP 메서드 검증 (POST 요청만 허용)
  if (req.method !== 'POST') {
    const errorResponse = createErrorResponse('METHOD_NOT_ALLOWED');
    res.setHeader('Allow', 'POST');
    return res.status(errorResponse.status).json(errorResponse.body);
  }

  // 2. 요청 빈도 제한(Rate Limit) 확인
  const clientIp = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown-ip';
  if (isRateLimited(clientIp)) {
    const errorResponse = createErrorResponse('RATE_LIMITED');
    return res.status(errorResponse.status).json(errorResponse.body);
  }

  // 3. 요청 본문(body) 유효성 파싱 확인
  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      const errorResponse = createErrorResponse('INVALID_JSON');
      return res.status(errorResponse.status).json(errorResponse.body);
    }
  }

  if (!body || typeof body !== 'object') {
    const errorResponse = createErrorResponse('INVALID_JSON');
    return res.status(errorResponse.status).json(errorResponse.body);
  }

  // 4. 입력 텍스트 유효성 검사 (길이 1~2,000자, 공백 등)
  const validationResult = validateAnalyzeInput(body.text);
  if (!validationResult.isValid) {
    const errorResponse = createErrorResponse(validationResult.errorCode || 'VALIDATION_ERROR');
    return res.status(errorResponse.status).json(errorResponse.body);
  }

  const cleanText = validationResult.trimmedText;

  try {
    // 5. OpenAI API 호출을 통한 감성 분석 수행
    const aiResult = await analyzeSentimentWithAI(cleanText);

    // 6. Supabase 데이터베이스에 결과 1건 저장
    // ※ 주의: DB 저장이 실패하면 성공으로 처리하지 않고 오류를 반환합니다.
    const recordId = await saveSentimentAnalysis({
      inputText: cleanText,
      sentiment: aiResult.sentiment,
      confidence: aiResult.confidence,
      reason: aiResult.reason,
      model: aiResult.model
    });

    // 7. 클라이언트에 성공 결과 반환
    return res.status(200).json({
      success: true,
      data: {
        id: recordId,
        sentiment: aiResult.sentiment,
        confidence: aiResult.confidence,
        reason: aiResult.reason
      }
    });
  } catch (error) {
    // 보안 규칙: 원문 입력값과 API 키, 스택 트레이스는 클라이언트에 절대 반환하지 않습니다.
    const errorCode = error.code || 'INTERNAL_ERROR';
    const errorResponse = createErrorResponse(errorCode);
    
    return res.status(errorResponse.status).json(errorResponse.body);
  }
}

