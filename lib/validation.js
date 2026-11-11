// ==============================================================================
// 파일명: lib/validation.js
// 설명: 클라이언트가 전송한 분석 요청 텍스트의 유효성을 검사하는 모듈
// ==============================================================================

/**
 * 사용자가 입력한 텍스트의 유효성을 검증합니다.
 * 
 * [검증 기준]
 * 1. text 필드가 반드시 존재하고 문자열(string) 타입이어야 합니다.
 * 2. 앞뒤 공백을 제거한 후(trim), 최소 1자 이상이어야 합니다. (빈 문자열 차단)
 * 3. 최대 2,000자까지만 입력을 허용합니다. (과도한 텍스트 요청 차단 및 비용 절감)
 * 
 * @param {any} inputText - 검증할 원본 입력 데이터
 * @returns {{ isValid: boolean, trimmedText?: string, errorCode?: string }} 검증 결과 객체
 */
export function validateAnalyzeInput(inputText) {
  // 1. 문자열 타입 여부 확인
  if (typeof inputText !== 'string') {
    return {
      isValid: false,
      errorCode: 'VALIDATION_ERROR'
    };
  }

  // 2. 앞뒤 공백 제거
  const trimmed = inputText.trim();

  // 3. 빈 문자열 검사 (공백만 있는 경우 포함)
  if (trimmed.length === 0) {
    return {
      isValid: false,
      errorCode: 'VALIDATION_ERROR'
    };
  }

  // 4. 최대 길이 제한 (2,000자 초과 여부 확인)
  if (trimmed.length > 2000) {
    return {
      isValid: false,
      errorCode: 'VALIDATION_ERROR'
    };
  }

  // 모든 검증을 통과한 경우, 불필요한 앞뒤 공백이 제거된 텍스트를 반환
  return {
    isValid: true,
    trimmedText: trimmed
  };
}

