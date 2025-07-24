# RESTful API 설계 가이드

## 🎯 RESTful 원칙 준수 사항

### 1. 자원(Resource) 중심 설계
```
✅ 올바른 예시:
GET    /api/places           - 모든 장소 조회
GET    /api/places/:id       - 특정 장소 조회  
POST   /api/places           - 새 장소 생성
PUT    /api/places/:id       - 장소 전체 수정
PATCH  /api/places/:id       - 장소 부분 수정
DELETE /api/places/:id       - 장소 삭제

❌ 잘못된 예시:
GET    /api/getPlaces        - 동사 사용
POST   /api/createPlace      - 동사 사용
GET    /api/places/search    - 동사적 의미
```

### 2. HTTP 메서드 의미 준수
```
GET    - 조회 (멱등성, 안전)
POST   - 생성 (비멱등성)
PUT    - 전체 수정 (멱등성)
PATCH  - 부분 수정 (비멱등성)
DELETE - 삭제 (멱등성)
```

### 3. 상태 코드 의미 준수
```
200 - OK (성공)
201 - Created (생성 성공)
204 - No Content (삭제 성공, 응답 본문 없음)
400 - Bad Request (클라이언트 요청 오류)
401 - Unauthorized (인증 실패)
403 - Forbidden (권한 없음)
404 - Not Found (자원 없음)
500 - Internal Server Error (서버 오류)
```

### 4. URL 네이밍 규칙
```
✅ kebab-case 사용
/api/fire-stations
/api/police-stations
/api/convenience-stores

❌ 다른 케이스 혼용
/api/fireStations      (camelCase)
/api/FireStations      (PascalCase) 
/api/fire_stations     (snake_case)
```

## 🔄 현재 API를 RESTful로 변경

### Before (기존)
```javascript
❌ 비RESTful 설계:
GET /api/policePlaces
GET /api/fireStationPlaces  
GET /api/ConvenienceStores
GET /api/preprocess        (동사)
POST /api/router/register  (동사)
```

### After (RESTful)
```javascript
✅ RESTful 설계:
GET /api/places?category=police
GET /api/places?category=fire-station
GET /api/places?category=convenience-store
POST /api/preprocessing
POST /api/routes
```

## 📊 API 응답 형식 표준화

### 성공 응답
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    // 실제 데이터
  },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "timestamp": "2025-07-21T10:30:00Z"
  }
}
```

### 에러 응답
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input parameters",
    "details": [
      {
        "field": "location",
        "message": "location is required"
      }
    ]
  },
  "timestamp": "2025-07-21T10:30:00Z"
}
```

## 🚀 사용 예시

### 1. 장소 검색 (카테고리별)
```bash
# 경찰서 검색
GET /api/places?location=37.5665,126.9780&category=police&radius=1000

# 편의점 검색  
GET /api/places?location=37.5665,126.9780&category=convenience-store&limit=10

# 키워드 검색
GET /api/places?location=37.5665,126.9780&keyword=스타벅스
```

### 2. 장소 상세 정보
```bash
GET /api/places/ChIJN1t_tDeuEmsRUsoyG83frY4
```

### 3. 페이지네이션 (향후 구현)
```bash
GET /api/places?page=2&limit=20&location=37.5665,126.9780
```

## ✅ RESTful 체크리스트

- [x] 자원 중심 URL 설계
- [x] HTTP 메서드 의미적 사용
- [x] 적절한 상태 코드 반환
- [x] 일관된 네이밍 규칙 (kebab-case)
- [x] 표준화된 응답 형식
- [x] 입력 검증
- [x] 에러 처리
- [ ] 페이지네이션 (TODO)
- [ ] 정렬/필터링 (TODO)
- [ ] API 버저닝 (TODO)
- [ ] HATEOAS (TODO)
