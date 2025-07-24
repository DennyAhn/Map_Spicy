// safetyServiceOptimized.js
const fetch = require("node-fetch");
const tmapService = require('./tmapService');
const storeService = require('./storeService'); // 통합된 storeService 모듈 사용
const { LRUCache } = require('lru-cache');

const storeCache = new LRUCache({
  max: 100,
  ttl: 1000 * 60 * 5
});

// 좌표 개수 최적화를 위한 decimation 함수 (점의 개수가 많으면 샘플링)
const decimateCoordinates = (coords, maxPoints = 100) => {
  if (coords.length <= maxPoints) return coords;
  const step = Math.floor(coords.length / maxPoints);
  return coords.filter((_, index) => index % step === 0);
};

// 간단하게 "거친" 판단을 위해 위/경도 차이를 체크 (1도 약 111km)
const isWithinRoughBounds = (lat1, lon1, lat2, lon2, maxMeters) => {
  const latDiff = Math.abs(lat1 - lat2) * 111000;
  const lonDiff = Math.abs(lon1 - lon2) * 111000 * Math.cos(lat1 * Math.PI / 180);
  return latDiff <= maxMeters && lonDiff <= maxMeters;
};

// 기존 Haversine 공식 그대로 사용 (필요한 경우 라이브러리 사용 고려)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // 지구 반지름(m)
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const safetyService = {
  calculateRouteSafety: async (routes, cctvData) => {
    return Promise.all(routes.map(async route => {
      // 경로 좌표를 적당한 해상도로 줄인다 (최대 100점 등)
      let pathCoordinates = decimateCoordinates(route.features[0].geometry.coordinates, 100);
      
      let coveredSegments = 0;
      const totalSegments = pathCoordinates.length - 1;
      const uniqueCCTVs = new Set();
      const uniqueStores = new Set();
      const nearbyCCTVs = [];
      const nearbyStores = [];
      
      // 캐싱: 중간 좌표(반올림)를 키로 사용하여 storeData 캐시 조회
      const midIndex = Math.floor(pathCoordinates.length / 2);
      const midCoord = pathCoordinates[midIndex];
      const cacheKey = `${midCoord[0].toFixed(3)}_${midCoord[1].toFixed(3)}`;
      
      let storeData = storeCache.get(cacheKey);
      if (!storeData) {
        storeData = await storeService.getStoreData(pathCoordinates);
        storeCache.set(cacheKey, storeData);
      }
      
      pathCoordinates.forEach(coord => {
        let segmentHasCCTV = false;
        let segmentHasStore = false;
        
        // CCTV 체크: 거친 필터링 후 정확한 계산
        cctvData.forEach(cctv => {
          if (!isWithinRoughBounds(coord[1], coord[0], cctv.latitude, cctv.longitude, 60)) return;
          const distance = calculateDistance(coord[1], coord[0], cctv.latitude, cctv.longitude);
          if (distance <= 60) {
            if (!segmentHasCCTV) {
              coveredSegments++;
              segmentHasCCTV = true;
            }
            const cctvKey = `${cctv.latitude}-${cctv.longitude}`;
            if (!uniqueCCTVs.has(cctvKey)) {
              uniqueCCTVs.add(cctvKey);
              nearbyCCTVs.push(cctv);
            }
          }
        });
        
        // 편의점(스토어) 체크
        storeData.forEach(store => {
          if (!isWithinRoughBounds(coord[1], coord[0], store.latitude, store.longitude, 70)) return;
          const distance = calculateDistance(coord[1], coord[0], store.latitude, store.longitude);
          if (distance <= 70) {
            if (!segmentHasStore) {
              coveredSegments++;
              segmentHasStore = true;
            }
            const storeKey = `${store.latitude}-${store.longitude}`;
            if (!uniqueStores.has(storeKey)) {
              uniqueStores.add(storeKey);
              nearbyStores.push(store);
            }
          }
        });
      });
      
      const coverageRatio = totalSegments > 0 ? Math.min((coveredSegments / totalSegments) * 100, 100) : 0;
      
      return {
        ...route,
        safety: {
          grade: safetyService.calculateSafetyGrade(coverageRatio, uniqueCCTVs.size, uniqueStores.size),
          cctvCount: uniqueCCTVs.size,
          storeCount: uniqueStores.size,
          coverageRatio: Math.round(coverageRatio)
        },
        nearbyCCTVs,
        nearbyStores
      };
    }));
  },

  calculateSafetyGrade: (coverageRatio, cctvCount, storeCount) => {
    const totalSafetyPoints = cctvCount + (cctvCount * 0.5) + (storeCount * 0.5);
    if (coverageRatio >= 80 && totalSafetyPoints >= 6) {
      return 'A';
    } else if (coverageRatio >= 60 && totalSafetyPoints >= 4) {
      return 'B';
    } else if (coverageRatio >= 40 && totalSafetyPoints >= 2) {
      return 'C';
    } else {
      return 'D';
    }
  },

  selectBestRoute: (routes) => {
    if (!routes || routes.length === 0) {
      return null;
    }

    const calculateSafetyScore = (route) => {
      const safety = route.safety;
      const gradeScore = { 'A': 100, 'B': 70, 'C': 30 };
      let score = gradeScore[safety.grade] || 0;
      score += Math.min(safety.cctvCount * 2, 20);
      score += Math.min(safety.storeCount * 1, 10);
      score += safety.coverageRatio * 0.2;
      return score;
    };

    return routes.reduce((best, current) => {
      const currentScore = calculateSafetyScore(current);
      const bestScore = best ? calculateSafetyScore(best) : -1;
      return currentScore > bestScore ? current : best;
    }, null);
  }
};

module.exports = { safetyService };
