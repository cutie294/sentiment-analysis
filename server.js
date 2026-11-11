// ==============================================================================
// 파일명: server.js
// 설명: Vercel 로그인 없이 로컬 환경에서 웹 화면과 API를 바로 테스트할 수 있는 로컬 개발 서버
// ==============================================================================

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config'; // .env 환경 변수 자동 로드
import analyzeHandler from './api/analyze.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = 3000;

// 지원하는 파일 확장자별 MIME 타입 정의
const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon'
};

const server = http.createServer(async (req, res) => {
  // 요청 URL 파싱 (쿼리 스트링 분리)
  const parsedUrl = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = parsedUrl.pathname;

  // 1. 감성 분석 API 라우트 (/api/analyze)
  if (pathname === '/api/analyze') {
    // Vercel Serverless Function 호환 헬퍼(status, json 메서드) 주입
    res.status = function (statusCode) {
      this.statusCode = statusCode;
      return this;
    };
    res.json = function (data) {
      this.setHeader('Content-Type', 'application/json; charset=UTF-8');
      this.end(JSON.stringify(data));
      return this;
    };

    // 요청 본문(body) 수집
    let bodyData = '';
    req.on('data', (chunk) => {
      bodyData += chunk;
    });

    req.on('end', async () => {
      if (bodyData) {
        try {
          req.body = JSON.parse(bodyData);
        } catch {
          req.body = bodyData;
        }
      } else {
        req.body = {};
      }

      try {
        // 기존 api/analyze.js 핸들러 실행
        await analyzeHandler(req, res);
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json; charset=UTF-8' });
        res.end(JSON.stringify({
          success: false,
          error: { code: 'INTERNAL_ERROR', message: '로컬 서버 내부 오류가 발생했습니다.' }
        }));
      }
    });
    return;
  }

  // 2. 정적 웹 화면 파일 제공 (HTML, CSS, JS, SVG 등)
  let filePath = pathname === '/' ? path.join(__dirname, 'index.html') : path.join(__dirname, pathname);
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=UTF-8' });
        res.end('404 Not Found - 요청하신 파일을 찾을 수 없습니다.');
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=UTF-8' });
        res.end(`500 Server Error: ${err.code}`);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
});

// 3. 서버 시작
server.listen(PORT, () => {
  console.log('====================================================');
  console.log(`🌿 mood / note 로컬 개발 서버가 시작되었습니다!`);
  console.log(`👉 브라우저 주소: http://localhost:${PORT}`);
  console.log(`👉 종료하려면 터미널에서 Ctrl + C 를 누르세요.`);
  console.log('====================================================');
});

