# Map Spicy API 문서

> 안전한 경로 검색 및 장소 정보 제공 서비스

## 📋 개요

Map Spicy는 여성, 고령자, 휠체어 이용자 등을 위한 안전한 경로 검색과 주변 편의시설 정보를 제공하는 서비스입니다.

##  서버 정보

- **개발 서버**: `http://localhost:3001`
- **프로덕션 서버**: `https://moyak.store`
- **Swagger 문서**: `http://localhost:3001/api-docs`

##  API 카테고리

### 1.  경로 검색 API

#### 일반 최단경로 검색
```http
GET /direction/normal-direction?start=37.5665,126.9780&goal=37.5663,126.9779
```

#### 안전 경로 검색
```http
GET /direction/safe-direction?start=37.5665,126.9780&goal=37.5663,126.9779
```

**응답 예시:**
```json
{
  "success": true,
  "data": {
    "features": [
      {
        "geometry": {
          "type": "LineString",
          "coordinates": [[126.9780, 37.5665], [126.9779, 37.5663]]
        },
        "properties": {
          "totalDistance": 1250,
          "totalTime": 900
        }
      }
    ],
    "safety": {
      "grade": "A",
      "score": 85,
      "cctvCount": 12,
      "storeCount": 3
    },
    "nearbyCCTVs": [...],
    "nearbyStores": [...]
  }
}
```

### 2.  장소 검색 API (RESTful)

#### 지원 카테고리 조회
```http
GET /api/places/categories
```

#### 카테고리별 장소 검색
```http
GET /api/places?category=police&lat=37.5665&lng=126.9780&radius=3000&limit=10
```

**지원 카테고리:**
- `police` - 경찰서
- `fire-station` - 소방서
- `convenience-store` - 편의점
- `women-safe` - 안전비상벨
- `pharmacy` - 약국
- `wheelchair-accessible` - 휠체어 충전소
- `elderly-friendly` - 복지시설
- `cctv` - CCTV

**파라미터:**
- `category` (필수): 검색할 장소 카테고리
- `lat` (필수): 위도
- `lng` (필수): 경도
- `radius` (선택): 검색 반경(미터, 기본값: 5000)
- `limit` (선택): 결과 개수(기본값: 15, 최대: 15)

### 3.  민원 및 위험구간 API

#### 민원 등록
```http
POST /api/preprocess/analyze
Content-Type: application/json

{
  "title": "민원 제목",
  "content": "민원 내용",
  "category": "안전",
  "location": "서울시 강남구"
}
```

#### 위험구간 신고
```http
POST /api/risk-report-submit
Content-Type: application/json

{
  "reason": "조명 부족",
  "category": "lighting",
  "start_lat": 37.5665,
  "start_lng": 126.9780,
  "end_lat": 37.5663,
  "end_lng": 126.9779,
  "user_type": "women",
  "age": 25
}
```

#### 위험구간 조회
```http
GET /api/complaintsmap
```

### 4.  기타 API

#### 지오코딩 (주소 ↔ 좌표 변환)
```http
GET /geocode?address=서울시청
GET /api/geocode?lat=37.5665&lng=126.9780
```

#### 1:1 문의 등록
```http
POST /api/feature-issues
Content-Type: application/json

{
  "title": "문의 제목",
  "content": "문의 내용"
}
```

##  에러 응답 형식

모든 API는 다음과 같은 일관된 에러 응답 형식을 사용합니다:

```json
{
  "success": false,
  "error": "에러 메시지"
}
```

**주요 HTTP 상태 코드:**
- `200` - 성공
- `400` - 잘못된 요청 (필수 파라미터 누락 등)
- `401` - 인증 오류
- `404` - 리소스를 찾을 수 없음
- `500` - 서버 내부 오류

##  테스트 방법

### 1. Swagger UI 사용
브라우저에서 `http://localhost:3001/api-docs`에 접속하여 인터랙티브한 API 테스트

### 2. cURL 예시
```bash
# 안전 경로 검색
curl "http://localhost:3001/direction/safe-direction?start=37.5665,126.9780&goal=37.5663,126.9779"

# 주변 경찰서 검색
curl "http://localhost:3001/api/places?category=police&lat=37.5665&lng=126.9780&limit=5"

# 지원 카테고리 조회
curl "http://localhost:3001/api/places/categories"
```

### 3. JavaScript 예시
```javascript
// 안전 경로 검색
const response = await fetch(
  'http://localhost:3001/direction/safe-direction?start=37.5665,126.9780&goal=37.5663,126.9779'
);
const data = await response.json();

// 주변 편의점 검색
const places = await fetch(
  'http://localhost:3001/api/places?category=convenience-store&lat=37.5665&lng=126.9780'
);
const placesData = await places.json();
```

##  성능 및 제한사항

- **캐싱**: 경로 검색 결과는 클라이언트에서 캐싱됩니다
- **응답 시간**: 평균 응답 시간은 200-500ms입니다
- **지원 지역**: 대구 계명대 성서캠퍼스

##  개발자 가이드

### 환경 설정
```bash
# 서버 실행
cd server
npm install
npm start

# 클라이언트 실행
cd client
npm install
npm start
```

### 환경 변수
```env
# .env 파일
PORT=3001
GOOGLE_API_KEY=your_google_api_key
TMAP_API_KEY=your_tmap_api_key
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=password
DB_NAME=map_spicy
```

##  지원 및 문의

- **이메일**: gyeonghyeongib@gmail.com
- **GitHub**: https://github.com/asd1702/Map-Spicy
- **문서 버전**: v1.0.0
- **마지막 업데이트**: 2025-07-23

---

💡 **참고**: 모든 API는 CORS가 활성화되어 있으며, 개발 환경에서는 `http://localhost:3000`에서의 요청을 허용합니다.
