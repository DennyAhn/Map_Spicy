require("dotenv").config(); // .env 파일 로드
const express = require("express");
const cors = require("cors");
const axios = require('axios');
const geocodeRouter = require("./router/geocodeRouter");
const geocode = require('./router/geocode');
const directionRouter = require("./router/directionRouter");
const placesRouter = require('./router/placesRouter');

const app = express();
const PORT = 3001;
app.use(express.json());

// CORS 설정
app.use(
  cors({
    origin: "http://localhost:3000", // React 앱에서 오는 요청을 허용
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

app.use('/api/places', placesRouter);

app.use(cors());

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
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('Environment check:');
  console.log('- API Key status:', GOOGLE_API_KEY ? 'Set' : 'Not set');
  console.log('- API Key value:', GOOGLE_API_KEY ? `${GOOGLE_API_KEY.substr(0, 5)}...` : 'Missing');
});

// 박기성 왔다감
// 안현진 확인함