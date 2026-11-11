// ==============================================================================
// 파일명: build.js
// 설명: Vercel 배포 시 정적 파일(HTML, CSS, JS)을 public 폴더로 자동 구성하는 빌드 스크립트
// ==============================================================================

import fs from 'fs';
import path from 'path';

const publicDir = path.resolve('public');

// 1. public 폴더 생성 (이미 있으면 유지)
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// 2. index.html 복사
fs.copyFileSync(path.resolve('index.html'), path.join(publicDir, 'index.html'));

// 3. css 폴더 복사
const cssDir = path.resolve('css');
if (fs.existsSync(cssDir)) {
  fs.cpSync(cssDir, path.join(publicDir, 'css'), { recursive: true });
}

// 4. js 폴더 복사
const jsDir = path.resolve('js');
if (fs.existsSync(jsDir)) {
  fs.cpSync(jsDir, path.join(publicDir, 'js'), { recursive: true });
}

console.log('✅ 빌드 성공: Vercel 배포를 위한 public 폴더 구성이 완료되었습니다.');

