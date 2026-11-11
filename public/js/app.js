// ==============================================================================
// 파일명: js/app.js
// 설명: mood / note 클라이언트 이벤트 처리 및 감성 분석 API 연동 스크립트
// ==============================================================================

document.addEventListener('DOMContentLoaded', () => {
  // 1. DOM 요소 취득 (문서 명세 계약 ID 준수)
  const form = document.getElementById('sentimentForm');
  const textInput = document.getElementById('textInput');
  const charCount = document.getElementById('charCount');
  const analyzeButton = document.getElementById('analyzeButton');
  const loadingMessage = document.getElementById('loadingMessage');
  const resultSection = document.getElementById('resultSection');
  const sentimentLabel = document.getElementById('sentimentLabel');
  const confidenceValue = document.getElementById('confidenceValue');
  const reasonText = document.getElementById('reasonText');
  const errorMessage = document.getElementById('errorMessage');
  const errorText = document.getElementById('errorText');
  const resetButton = document.getElementById('resetButton');

  // 감성 라벨 한국어 매핑 및 아이콘/클래스 정보
  const SENTIMENT_META = {
    positive: {
      text: '긍정',
      badgeClass: 'sentiment-positive',
      icon: '🌿'
    },
    negative: {
      text: '부정',
      badgeClass: 'sentiment-negative',
      icon: '🍂'
    },
    neutral: {
      text: '중립',
      badgeClass: 'sentiment-neutral',
      icon: '☁️'
    }
  };

  /**
   * 2. 글자 수 실시간 갱신 및 유효성 피드백
   */
  function updateCharCount() {
    const length = textInput.value.length;
    charCount.textContent = length.toLocaleString();

    // 2,000자에 근접했을 때 시각적 경고 색상 적용
    if (length >= 1950) {
      charCount.classList.add('limit-near');
    } else {
      charCount.classList.remove('limit-near');
    }
  }

  textInput.addEventListener('input', updateCharCount);

  /**
   * 3. UI 상태 제어 헬퍼 함수
   */

  // 오류 메시지 숨기기
  function hideError() {
    errorMessage.classList.add('hidden');
    errorText.textContent = '';
  }

  // 오류 메시지 노출 (XSS 방지를 위해 textContent 사용)
  function showError(message) {
    errorText.textContent = message;
    errorMessage.classList.remove('hidden');
    resultSection.classList.add('hidden'); // 오류 시 이전 결과 숨김
  }

  // 로딩 상태 설정 (요청 중 중복 클릭 방지)
  function setLoadingState(isLoading) {
    if (isLoading) {
      analyzeButton.disabled = true;
      analyzeButton.classList.add('loading');
      loadingMessage.classList.remove('hidden');
      hideError();
    } else {
      analyzeButton.disabled = false;
      analyzeButton.classList.remove('loading');
      loadingMessage.classList.add('hidden');
    }
  }

  /**
   * 4. 감성 분석 결과 화면 표시
   * 보안 규칙: 사용자 입력값이나 서버 응답 텍스트는 innerHTML 대신 textContent를 사용합니다.
   */
  function renderResult(data) {
    const meta = SENTIMENT_META[data.sentiment] || {
      text: data.sentiment,
      badgeClass: 'sentiment-neutral',
      icon: '•'
    };

    // 기존 감성 클래스 초기화 후 신규 클래스 적용
    sentimentLabel.className = 'sentiment-badge ' + meta.badgeClass;
    sentimentLabel.textContent = `${meta.icon} ${meta.text}`;

    // 신뢰도 백분율 표시 (정수 %)
    confidenceValue.textContent = `${data.confidence}%`;

    // 분석 이유 표시 (textContent 사용으로 안전하게 출력)
    reasonText.textContent = data.reason;

    // 결과 섹션 노출 및 스크롤 포커스 이동
    resultSection.classList.remove('hidden');
    resultSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  /**
   * 5. 분석 요청 폼 제출 이벤트 핸들러
   */
  form.addEventListener('submit', async (e) => {
    e.preventDefault(); // 기본 폼 새로고침 동작 방지

    const rawText = textInput.value;
    const trimmedText = rawText.trim();

    // 프런트엔드 1차 검증: 빈 값 제출 차단
    if (!trimmedText) {
      showError('분석할 문장을 1자 이상 입력해 주세요.');
      textInput.focus();
      return;
    }

    // 프런트엔드 1차 검증: 2,000자 초과 차단
    if (trimmedText.length > 2000) {
      showError('입력 문장은 최대 2,000자까지 가능합니다.');
      textInput.focus();
      return;
    }

    // 로딩 시작
    setLoadingState(true);

    try {
      // 서버리스 API (/api/analyze) 호출
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text: trimmedText })
      });

      const result = await response.json().catch(() => null);

      // HTTP 상태 코드 또는 응답 success 플래그 확인
      if (!response.ok || !result || !result.success) {
        const errorMsg = result?.error?.message || '분석 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.';
        showError(errorMsg);
        return;
      }

      // 필수 응답 필드 검증
      if (!result.data || !result.data.sentiment || result.data.confidence === undefined || !result.data.reason) {
        showError('분석 결과 형식이 올바르지 않습니다.');
        return;
      }

      // 성공 결과 렌더링
      renderResult(result.data);
    } catch (networkError) {
      // 서버 연결 불가 및 네트워크 오류 처리
      showError('서버와의 통신에 실패했습니다. 네트워크 연결을 확인하고 다시 시도해 주세요.');
    } finally {
      // 로딩 종료
      setLoadingState(false);
    }
  });

  /**
   * 6. "다시 분석하기" 버튼 클릭 시 상태 초기화
   */
  resetButton.addEventListener('click', () => {
    resultSection.classList.add('hidden');
    hideError();
    textInput.value = '';
    updateCharCount();
    textInput.focus();
  });

  // 초기 글자 수 표시 갱신
  updateCharCount();
});

