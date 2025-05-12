require("dotenv").config(); // .env 파일 로드
const express = require("express");
const cors = require("cors");
const axios = require('axios');

const geocodeRouter = require("./router/geocodeRouter");
const geocode = require('./router/geocode');
const directionRouter = require("./router/directionRouter");
const complaintsRouter = require('./router/complaints');
const preprocessRouter = require('./router/preprocess');
const featureIssuesRouter = require('./router/featureIssues');
const complaintsMapRoutes = require('./router/complaintsMap');
const routeRegister = require('./router/routeRegister');
const riskReportSubmitRouter = require('./router/riskReportSubmit');

const policePlacesRouter = require("./router/filter/policePlacesRouter");
const fireStationRouter = require("./router/filter/fireStationPlacesRouter");
const womenPlacesRouter = require('./router/filter/womenPlacesRouter');
const elderlyPlacesRouter = require('./router/filter/elderlyPlacesRouter');
const pharmacyPlacesRouter = require('./router/filter/pharmacyPlacesRouter');
const cctvPlaceRouter = require("./router/filter/cctvPlaceRouter");
const conveniencesStoreRouter = require("./router/filter/convenienceStorePlacesRouter");
const wheelChairPlacesRouter = require('./router/filter/wheelChairPlacesRouter'); // Add this line

const app = express();
const PORT = 3001;
app.use(express.json());

// CORS 설정
app.use(
  cors({
    origin: [
      "http://15.164.94.96:3000", 
      "http://localhost:3000", // 로컬 작업용
      "https://map-cap-client.vercel.app"
    ],
    credentials: true
  })
);

// 기본 경로 처리
app.get("/", (req, res) => {
  res.send("Express 서버가 실행 중입니다!");
});

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

// 필터링된 장소 API 라우터 연결
app.use('/api/policePlaces', policePlacesRouter);
app.use('/api/fireStationPlaces', fireStationRouter);
app.use('/api/ConvenienceStores', conveniencesStoreRouter);
app.use('/api/womenPlaces', womenPlacesRouter);
app.use('/api/elderlyPlaces', elderlyPlacesRouter);
app.use('/api/pharmacyPlaces', pharmacyPlacesRouter);
app.use('/api/cctvPlaces', cctvPlaceRouter);
app.use('/api/wheelChairPlaces', wheelChairPlacesRouter);

// API 키 확인 로그
const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
console.log('API Key loaded:', GOOGLE_API_KEY ? 'Yes' : 'No');

app.get('/api/places', async (req, res) => {
  try {
    const { location, radius, keyword } = req.query;
    
    // 요청 파라미터 로깅
    console.log('Request params:', { location, radius, keyword });
    console.log('Using API Key:', GOOGLE_API_KEY ? 'Available' : 'Missing');

    if (!GOOGLE_API_KEY) {
      return res.status(500).json({ error: 'API key is not configured' });
    }

    const response = await axios.get(
      'https://maps.googleapis.com/maps/api/place/nearbysearch/json',
      {
        params: {
          location,
          radius,
          keyword,
          key: GOOGLE_API_KEY
        }
      }
    );

    // API 응답 로깅
    console.log('Google API response status:', response.data.status);
    
    if (response.data.status === 'REQUEST_DENIED') {
      console.error('API Key error:', response.data.error_message);
      return res.status(401).json({ 
        error: 'API Key authentication failed',
        details: response.data.error_message 
      });
    }

    res.json(response.data);
  } catch (error) {
    console.error('Server error:', error.message);
    res.status(500).json({ 
      error: 'Failed to fetch places',
      details: error.message 
    });
  }
});

// 서버 실행
app.listen(PORT, () => {

  console.log(`Server running on localhost:${PORT}`);

  console.log('Environment check:');
  console.log('- API Key status:', GOOGLE_API_KEY ? 'Set' : 'Not set');
  console.log('- API Key value:', GOOGLE_API_KEY ? `${GOOGLE_API_KEY.substr(0, 5)}...` : 'Missing');
});