require("dotenv").config(); // .env 파일 로드
const express = require("express");
const cors = require("cors");

const geocodeRouter = require("./router/geocodeRouter");
const geocode = require('./router/geocode');
const directionRouter = require("./router/directionRouter");
const complaintsRouter = require('./router/complaints');
const preprocessRouter = require('./router/preprocess');
const featureIssuesRouter = require('./router/featureIssues');
const complaintsMapRoutes = require('./router/complaintsMap');
const routeRegister = require('./router/routeRegister');
const riskReportSubmitRouter = require('./router/riskReportSubmit');

// 🚀 RESTful 통합 Places 라우터 (유일한 Places API)
const restfulPlacesRouter = require('./router/restfulPlaces');

// Swagger 설정
const { specs, swaggerUi, setup } = require('./swagger');

// 에러 핸들링 미들웨어 import
const { globalErrorHandler, notFoundHandler } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3001;
app.use(express.json());

// 정적 파일 서빙 (HTML API 문서용)
app.use('/public', express.static('public'));

// CORS 설정 - 환경변수 기반
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',')
  : [
      "http://15.164.94.96:3000", 
      "http://localhost:3000", // 로컬 작업용
      "https://map-cap-client.vercel.app", // Vercel 클라이언트
      "https://moyak.store", // 프로덕션 도메인
      "https://www.moyak.store"
    ];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true
  })
);

// 기본 경로 처리
app.get("/", (req, res) => {
  res.send("Express 서버가 실행 중입니다!");
});

/**
 * @swagger
 * /:
 *   get:
 *     summary: 서버 상태 확인
 *     tags: [System]
 *     responses:
 *       200:
 *         description: 서버 정상 작동
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 *               example: "Express 서버가 실행 중입니다!"
 */

// 라우터 연결
app.use("/geocode", geocodeRouter);
app.use('/api/geocode', geocode);
app.use("/direction", directionRouter);
app.use('/api/complaints', complaintsRouter);
app.use('/api/preprocess', preprocessRouter);
app.use('/api/feature-issues', featureIssuesRouter);
app.use('/api/complaintsmap', complaintsMapRoutes);
app.use('/api/router/register', routeRegister);
app.use('/api/risk-report-submit', riskReportSubmitRouter);

//  PRIMARY: RESTful 통합 Places API (유일한 Places API)
app.use('/api/places', restfulPlacesRouter);

//  Swagger API 문서
app.use('/api-docs', swaggerUi.serve, setup);
app.get('/api-docs/swagger.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(specs);
});

// 404 핸들러 (모든 라우트 뒤에 위치)
app.use(notFoundHandler);

// 글로벌 에러 핸들러 (맨 마지막에 위치)
app.use(globalErrorHandler);

// 서버 실행
app.listen(PORT, () => {
  console.log(` 서버가 http://localhost:${PORT}에서 실행 중입니다.`);
  console.log(` 지원 API:`);
  console.log(`    RESTful: GET /api/places?category=police&lat=37.5665&lng=126.9780`);
  console.log(` API 문서: http://localhost:${PORT}/api-docs`);
  console.log(` 지원 카테고리: http://localhost:${PORT}/api/places/categories`);
});
