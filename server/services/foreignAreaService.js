const mysql = require('mysql2/promise');
const fetch = require('node-fetch');
require('dotenv').config();

// DB 접속 정보
const dbConfig = {
  host: 'localhost',
  port: 3307,
  user: 'root',
  password: 'Aa5051140',
  database: 'map'
};

// Connection Pool 생성
const pool = mysql.createPool({
  host: dbConfig.host,
  port: dbConfig.port,
  user: dbConfig.user,
  password: dbConfig.password,
  database: dbConfig.database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// 캐시 만료 시간 (TTL: 밀리초 단위, 예시로 1시간)
const CACHE_TTL = 60 * 60 * 1000;

// 주소 캐시 (메모리) - 각 값은 { value: 좌표, timestamp: 생성 시각 }
const addressCache = new Map();

// API 호출 사이 딜레이 (예: 200ms)
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// 주소 -> 좌표 변환 함수 (Kakao Geocoding API, 캐싱 및 딜레이 적용)
async function getCoordinatesFromAddress(address) {
  const cached = addressCache.get(address);
  const now = Date.now();
  if (cached && (now - cached.timestamp < CACHE_TTL)) {
    return cached.value;
  }
  const apiKey = process.env.KAKAO_REST_API_KEY;
  const url = `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(address)}`;
  try {
    await sleep(200);
    const response = await fetch(url, {
      headers: { Authorization: `KakaoAK ${apiKey}` }
    });
    if (!response.ok) {
      console.error('Geocode API 실패:', response.status);
      return null;
    }
    const data = await response.json();
    if (data.documents && data.documents.length > 0) {
      const doc = data.documents[0];
      const coords = {
        lat: parseFloat(doc.y),
        lng: parseFloat(doc.x)
      };
      addressCache.set(address, { value: coords, timestamp: now });
      return coords;
    }
    return null;
  } catch (error) {
    console.error('Geocode 처리 중 오류:', error);
    return null;
  }
}

// 캐시 변수 (DB 조회 결과를 재사용) - 캐시 구조: { value, timestamp }
let foreignAddressesCache = null;
let foreignAreasWithCoordinatesCache = null;
// 캐싱 Promise (DB 조회 및 API 호출 결과를 한 번만 수행)
let foreignAreasWithCoordinatesPromise = null;

const foreignAreaService = {
  // DB에서 address만 조회 (한 번 조회 후 캐시 사용, TTL 적용)
  getForeignAddresses: async () => {
    const now = Date.now();
    if (foreignAddressesCache && (now - foreignAddressesCache.timestamp < CACHE_TTL)) {
      return foreignAddressesCache.value;
    }
    try {
      console.log('[getForeignAddresses] DB 접속 시작.');
      const [rows] = await pool.execute('SELECT address FROM foreign_areas');
      console.log('[getForeignAddresses] DB 접속 및 쿼리 실행 성공.');
      const addresses = rows.map(row => row.address);
      foreignAddressesCache = { value: addresses, timestamp: now };
      return addresses;
    } catch (error) {
      console.error('[getForeignAddresses] 주소 조회 실패:', error);
      return [];
    }
  },

  // DB에서 address 조회 후 지도 API를 통해 좌표 받아오기 (병렬 처리, 캐시 및 Promise 사용)
  getForeignAreasWithCoordinates: async () => {
    const now = Date.now();
    if (foreignAreasWithCoordinatesCache && (now - foreignAreasWithCoordinatesCache.timestamp < CACHE_TTL)) {
      return foreignAreasWithCoordinatesCache.value;
    }
    if (foreignAreasWithCoordinatesPromise) {
      return await foreignAreasWithCoordinatesPromise;
    }
    foreignAreasWithCoordinatesPromise = (async () => {
      try {
        console.log('[getForeignAreasWithCoordinates] DB 접속 시작.');
        const [rows] = await pool.execute('SELECT address FROM foreign_areas');
        console.log('[getForeignAreasWithCoordinates] DB 접속 및 쿼리 실행 성공.');
        // 병렬 처리로 각 주소에 대해 좌표 조회
        const areasWithCoordinates = await Promise.all(
          rows.map(async row => {
            const coords = await getCoordinatesFromAddress(row.address);
            if (coords) {
              return {
                address: row.address,
                lat: coords.lat,
                lng: coords.lng
              };
            }
            return null;
          })
        );
        const filteredAreas = areasWithCoordinates.filter(item => item !== null);
        foreignAreasWithCoordinatesCache = { value: filteredAreas, timestamp: now };
        return filteredAreas;
      } catch (error) {
        console.error('[getForeignAreasWithCoordinates] 외국인 주의 구역 조회 실패:', error);
        return [];
      } finally {
        foreignAreasWithCoordinatesPromise = null;
      }
    })();
    return await foreignAreasWithCoordinatesPromise;
  },

  // Haversine 공식을 이용한 거리 계산 (미터 단위)
  calculateDistance: (lat1, lng1, lat2, lng2) => {
    const R = 6371e3; // 지구 반경 (미터)
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(Δφ / 2) ** 2 +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  },

  // 입력 좌표가 외국인 주의 구역 내에 있는지 (반경 100m 이내)
  isInForeignArea: async (lat, lng) => {
    const areas = await foreignAreaService.getForeignAreasWithCoordinates();
    const threshold = 100; // 100 미터
    return areas.some(area => {
      const distance = foreignAreaService.calculateDistance(lat, lng, area.lat, area.lng);
      return distance <= threshold;
    });
  }
};

module.exports = {
  ...foreignAreaService,
  getCoordinatesFromAddress
};
