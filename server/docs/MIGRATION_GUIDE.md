# 🚀 Places API 마이그레이션 가이드

## 개요
기존의 8개 개별 라우터를 하나의 RESTful API로 통합했습니다.

## 📋 변경 사항

### Before (기존 - DEPRECATED)
```javascript
❌ 8개의 개별 엔드포인트:
GET /api/policePlaces?lat=37.5665&lng=126.9780
GET /api/fireStationPlaces?lat=37.5665&lng=126.9780
GET /api/ConvenienceStores?lat=37.5665&lng=126.9780
GET /api/womenPlaces?lat=37.5665&lng=126.9780
GET /api/elderlyPlaces?lat=37.5665&lng=126.9780
GET /api/pharmacyPlaces?lat=37.5665&lng=126.9780
GET /api/cctvPlaces?lat=37.5665&lng=126.9780
GET /api/wheelChairPlaces?lat=37.5665&lng=126.9780
```

### After (새로운 - RESTful)
```javascript
✅ 하나의 통합 엔드포인트:
GET /api/places?category=police&lat=37.5665&lng=126.9780
GET /api/places?category=fire-station&lat=37.5665&lng=126.9780
GET /api/places?category=convenience-store&lat=37.5665&lng=126.9780
GET /api/places?category=women-safe&lat=37.5665&lng=126.9780
GET /api/places?category=elderly-friendly&lat=37.5665&lng=126.9780
GET /api/places?category=pharmacy&lat=37.5665&lng=126.9780
GET /api/places?category=cctv&lat=37.5665&lng=126.9780
GET /api/places?category=wheelchair-accessible&lat=37.5665&lng=126.9780
```

## 🔧 프론트엔드 마이그레이션 방법

### 1. JavaScript/React 코드 변경

#### Before
```javascript
// ❌ 기존 방식 - 8개의 다른 API 호출
const fetchPoliceStations = async (lat, lng) => {
  const response = await fetch(`/api/policePlaces?lat=${lat}&lng=${lng}`);
  return response.json();
};

const fetchFireStations = async (lat, lng) => {
  const response = await fetch(`/api/fireStationPlaces?lat=${lat}&lng=${lng}`);
  return response.json();
};

const fetchConvenienceStores = async (lat, lng) => {
  const response = await fetch(`/api/ConvenienceStores?lat=${lat}&lng=${lng}`);
  return response.json();
};
```

#### After
```javascript
// ✅ 새로운 방식 - 하나의 통합 API
const fetchPlacesByCategory = async (category, lat, lng, options = {}) => {
  const params = new URLSearchParams({
    category,
    lat: lat.toString(),
    lng: lng.toString(),
    ...options
  });
  
  const response = await fetch(`/api/places?${params}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch ${category} places`);
  }
  
  return response.json();
};

// 사용 예시
const policeStations = await fetchPlacesByCategory('police', 37.5665, 126.9780);
const fireStations = await fetchPlacesByCategory('fire-station', 37.5665, 126.9780);
const convenienceStores = await fetchPlacesByCategory('convenience-store', 37.5665, 126.9780, {
  radius: 3000,
  limit: 10
});
```

### 2. 카테고리 매핑 테이블

```javascript
// 기존 URL과 새로운 카테고리 매핑
const CATEGORY_MAPPING = {
  '/api/policePlaces': 'police',
  '/api/fireStationPlaces': 'fire-station',
  '/api/ConvenienceStores': 'convenience-store',
  '/api/womenPlaces': 'women-safe',
  '/api/elderlyPlaces': 'elderly-friendly',
  '/api/pharmacyPlaces': 'pharmacy',
  '/api/cctvPlaces': 'cctv',
  '/api/wheelChairPlaces': 'wheelchair-accessible'
};

// 마이그레이션 헬퍼 함수
const migrateApiCall = (oldUrl, lat, lng) => {
  const category = CATEGORY_MAPPING[oldUrl];
  return fetchPlacesByCategory(category, lat, lng);
};
```

## 🎯 새로운 API 사용법

### 1. 기본 검색
```javascript
GET /api/places?category=police&lat=37.5665&lng=126.9780

// 응답 예시
{
  "success": true,
  "message": "police places retrieved successfully",
  "data": [
    {
      "id": "123456",
      "place_name": "서울중부경찰서",
      "category_name": "공공기관 > 경찰서",
      "phone": "02-123-4567",
      "address_name": "서울 중구 세종대로 99",
      "location": {
        "lat": 37.5665,
        "lng": 126.9780
      },
      "distance": 245,
      "search_category": "police",
      "rank": 1
    }
  ],
  "meta": {
    "total": 15,
    "is_end": true,
    "page_count": 15,
    "search_params": {
      "category": "police",
      "location": { "lat": 37.5665, "lng": 126.9780 },
      "radius": 5000
    },
    "timestamp": "2025-07-21T10:30:00Z"
  }
}
```

### 2. 고급 검색 옵션
```javascript
// 반경과 개수 제한
GET /api/places?category=pharmacy&lat=37.5665&lng=126.9780&radius=3000&limit=5

// 지원되는 카테고리 목록 조회
GET /api/places/categories

// 서비스 상태 확인
GET /api/places/health
```

## ⚠️ 중요 사항

### 1. 하위 호환성
- 기존 API는 당분간 유지됩니다 (DEPRECATED)
- 새로운 기능은 통합 API에만 추가됩니다
- 기존 API는 3개월 후 제거 예정

### 2. 에러 처리 개선
```javascript
// 새로운 에러 응답 형식
{
  "success": false,
  "error": {
    "code": "MISSING_CATEGORY",
    "message": "category parameter is required"
  },
  "timestamp": "2025-07-21T10:30:00Z"
}
```

### 3. 성능 향상
- 통합 서비스로 인한 코드 중복 제거
- 캐싱 및 최적화 적용
- 더 나은 에러 처리

## 📅 마이그레이션 스케줄

1. **1주차**: 새로운 API 배포 및 테스트
2. **2-4주차**: 프론트엔드 코드 점진적 마이그레이션
3. **5-8주차**: 기존 API 사용량 모니터링
4. **9-12주차**: 기존 API 제거 및 정리

## 🆘 문제 해결

### 자주 묻는 질문

**Q: 기존 API가 언제까지 동작하나요?**
A: 3개월간 유지되며, 충분한 공지 후 제거됩니다.

**Q: 응답 형식이 바뀌었나요?**
A: 네, 더 표준화된 RESTful 형식으로 변경되었습니다.

**Q: 성능은 어떻게 되나요?**
A: 통합으로 인해 더 빠르고 효율적입니다.

## 📞 지원
마이그레이션 관련 문의사항은 개발팀에 연락해주세요.
