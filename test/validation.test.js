// ==============================================================================
// 파일명: test/validation.test.js
// 설명: 입력 검증(validation) 및 에러 규격(errors) 단위 테스트
// ==============================================================================

import test from 'node:test';
import assert from 'node:assert';
import { validateAnalyzeInput } from '../lib/validation.js';
import { createErrorResponse } from '../lib/errors.js';

test('유효한 한글 문장 입력 시 정상 통과', () => {
  const result = validateAnalyzeInput('오늘 하루도 정말 보람차고 행복했습니다.');
  assert.strictEqual(result.isValid, true);
  assert.strictEqual(result.trimmedText, '오늘 하루도 정말 보람차고 행복했습니다.');
});

test('앞뒤 공백이 있는 문장은 공백을 제거(trim)하여 반환', () => {
  const result = validateAnalyzeInput('   감사한 하루   ');
  assert.strictEqual(result.isValid, true);
  assert.strictEqual(result.trimmedText, '감사한 하루');
});

test('빈 문자열이나 공백만 입력된 경우 검증 실패', () => {
  const emptyResult = validateAnalyzeInput('');
  assert.strictEqual(emptyResult.isValid, false);
  assert.strictEqual(emptyResult.errorCode, 'VALIDATION_ERROR');

  const spacesResult = validateAnalyzeInput('     ');
  assert.strictEqual(spacesResult.isValid, false);
  assert.strictEqual(spacesResult.errorCode, 'VALIDATION_ERROR');
});

test('2,000자 초과 입력 시 검증 실패', () => {
  const longText = '가'.repeat(2001);
  const result = validateAnalyzeInput(longText);
  assert.strictEqual(result.isValid, false);
  assert.strictEqual(result.errorCode, 'VALIDATION_ERROR');
});

test('문자열이 아닌 타입 입력 시 검증 실패', () => {
  const numberResult = validateAnalyzeInput(12345);
  assert.strictEqual(numberResult.isValid, false);
  assert.strictEqual(numberResult.errorCode, 'VALIDATION_ERROR');

  const nullResult = validateAnalyzeInput(null);
  assert.strictEqual(nullResult.isValid, false);
  assert.strictEqual(nullResult.errorCode, 'VALIDATION_ERROR');
});

test('표준 에러 응답 형식 규격 검증', () => {
  const response = createErrorResponse('VALIDATION_ERROR');
  assert.strictEqual(response.status, 400);
  assert.strictEqual(response.body.success, false);
  assert.strictEqual(response.body.error.code, 'VALIDATION_ERROR');
  assert.ok(response.body.error.message.includes('문장을 입력해 주세요'));
});

