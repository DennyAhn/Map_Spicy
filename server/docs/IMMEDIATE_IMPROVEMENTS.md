# 🚀 즉시 실행 가능한 개선 작업

## 1단계: 중복 파일 제거 (5분)

```bash
# 1. 기존 레거시 프록시 팩토리 제거
rm /home/asd1802/map_spicy/server/router/legacyProxyFactory.js

# 2. 중복 places 라우터 정리
rm /home/asd1802/map_spicy/server/router/places.js
rm /home/asd1802/map_spicy/server/router/placesRouter.js

# 3. index.js에서 import 수정
```

## 2단계: 파일명 표준화 (10분)

```bash
# 모든 라우터를 xxxRouter.js 형식으로 통일
mv geocode.js geocodeRouter.js
mv complaints.js complaintsRouter.js  
mv featureIssues.js featureIssuesRouter.js
mv preprocess.js preprocessRouter.js
```

## 3단계: 서비스 통합 (30분)

### Before: 복잡한 구조
```
/services
├── unifiedPlacesService.js (래퍼)
└── /filter
    ├── policePlacesService.js
    ├── convenienceStorePlacesService.js
    └── ... (6개 더)
```

### After: 단순한 구조  
```
/services
├── PlacesService.js (완전 통합)
├── DirectionService.js
└── GeocodingService.js
```

## 4단계: API 구조 정리 (20분)

### 현재: 혼재된 구조
```
/api/policePlaces (레거시)
/api/places?category=police (신규)
/direction (비표준)
/geocode (비표준)
```

### 목표: 일관된 RESTful 구조
```
/api/v1/places
/api/v1/directions  
/api/v1/geocoding
/api/v1/complaints
```

## 즉시 실행 명령어

```bash
cd /home/asd1802/map_spicy/server

# 1. 중복 파일 제거
rm router/legacyProxyFactory.js
rm router/places.js  
rm router/placesRouter.js

# 2. 파일명 표준화
cd router
mv geocode.js geocodeRouter.js
mv complaints.js complaintsRouter.js
mv featureIssues.js featureIssuesRouter.js
mv preprocess.js preprocessRouter.js
mv riskReportSubmit.js riskReportSubmitRouter.js
mv routeRegister.js routeRegisterRouter.js
mv complaintsMap.js complaintsMapRouter.js

# 3. 백업 생성
cp ../index.js ../index.js.backup
```
