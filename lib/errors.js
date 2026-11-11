// ==============================================================================
// 파일명: lib/errors.js
// 설명: 서버에서 발생하는 다양한 오류를 표준 규격의 사용자 친화적인 응답으로 변환하는 모듈
// ==============================================================================

/**
 * 프로젝트 표준 에러 정의 맵
 * 각 에러 코드별 HTTP 상태 코드(statusCode)와 사용자에게 표시할 한국어 메시지(message)를 관리합니다.
 */
export const ERROR_DEFINITIONS = {
  // 1. 요청 형식 관련 오류 (400번대)
  INVALID_JSON: {
    status: 400,
    message: '요청 본문 형식이 올바르지 않습니다. JSON 형식을 확인해 주세요.'
  },
  VALIDATION_ERROR: {
    status: 400,
    message: '1자 이상 2,000자 이하의 문장을 입력해 주세요.'
  },
  METHOD_NOT_ALLOWED: {
    status: 405,
    message: '지원하지 않는 요청 방식(HTTP Method)입니다. POST 요청만 허용됩니다.'
  },
  RATE_LIMITED: {
    status: 429,
    message: '요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.'
  },

  // 2. 서버 설정 및 외부 연동 오류 (500번대)
  CONFIGURATION_ERROR: {
    status: 500,
    message: '서버 환경 변수 설정에 문제가 있습니다. 서비스 운영자에게 문의해 주세요.'
  },
  AI_SERVICE_ERROR: {
    status: 502,
    message: 'AI 분석 서비스와 통신하지 못했습니다. 잠시 후 다시 시도해 주세요.'
  },
  AI_RESPONSE_INVALID: {
    status: 502,
    message: 'AI 분석 결과를 올바르게 읽지 못했습니다. 다시 시도해 주세요.'
  },
  DATABASE_ERROR: {
    status: 503,
    message: '결과를 데이터베이스에 안전하게 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.'
  },
  INTERNAL_ERROR: {
    status: 500,
    message: '일시적인 서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.'
  }
};

/**
 * 표준 API 에러 응답 객체를 생성하는 헬퍼 함수
 * 
 * @param {string} code - ERROR_DEFINITIONS에 정의된 에러 코드 문자열
 * @param {string} [customMessage] - 기본 메시지 대신 전달할 커스텀 메시지 (선택 사항)
 * @returns {{ status: number, body: { success: boolean, error: { code: string, message: string } } }}
 */
export function createErrorResponse(code, customMessage) {
  const definition = ERROR_DEFINITIONS[code] || ERROR_DEFINITIONS.INTERNAL_ERROR;
  
  return {
    status: definition.status,
    body: {
      success: false,
      error: {
        code: code in ERROR_DEFINITIONS ? code : 'INTERNAL_ERROR',
        message: customMessage || definition.message
      }
    }
  };
}

