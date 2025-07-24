const fetch = require("node-fetch");

//────────────────────────────────────────────
// TMap 경로 조회 모듈 (tmapService)
//────────────────────────────────────────────
const tmapService = {
  validateCoordinates: (start, goal) => {
    const [startLat, startLng] = start.split(",").map(coord => parseFloat(coord));
    const [endLat, endLng] = goal.split(",").map(coord => parseFloat(coord));

    if ([startLat, startLng, endLat, endLng].some(coord => isNaN(coord))) {
      throw new Error("유효하지 않은 좌표값입니다.");
    }

    return {
      startX: startLng.toString(),
      startY: startLat.toString(),
      endX: endLng.toString(),
      endY: endLat.toString()
    };
  },

  getRoute: async (start, goal) => {
    const coords = tmapService.validateCoordinates(start, goal);
    const response = await tmapService.requestRoute(coords, 10);
    return await tmapService.processResponse(response);
  },

  getMultipleRoutes: async (start, goal) => {
    const coords = tmapService.validateCoordinates(start, goal);
    const routeOptions = [
      { searchOption: 0 },  // 추천경로
      { searchOption: 4 },  // 대로우선
      { searchOption: 10 }  // 최단거리
    ];

    try {
      const routePromises = routeOptions.map(option =>
        tmapService.requestRoute(coords, option.searchOption)
      );

      const responses = await Promise.all(routePromises);
      const routes = await Promise.all(
        responses.map(response => tmapService.processResponse(response))
      );

      routes.forEach((route, index) => {
        if (!route.features || !route.features[0]?.geometry?.coordinates) {
          throw new Error(`유효하지 않은 경로 데이터 (경로 ${index + 1})`);
        }
      });

      return routes;
    } catch (error) {
      console.error('경로 요청 실패:', error);
      throw error;
    }
  },

  requestRoute: async (coords, searchOption = 0) => {
    const { startX, startY, endX, endY } = coords;
    const response = await fetch(
      "https://apis.openapi.sk.com/tmap/routes/pedestrian?version=1",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "appKey": process.env.TMAP_API_KEY,
        },
        body: JSON.stringify({
          startX,
          startY,
          endX,
          endY,
          reqCoordType: "WGS84GEO",
          resCoordType: "WGS84GEO",
          startName: "출발지",
          endName: "도착지",
          searchOption
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('TMap API 오류 응답:', errorText);
      throw new Error(`TMAP API 오류: ${response.status} ${response.statusText}`);
    }

    return response;
  },

  processResponse: async (response) => {
    const data = await response.json();
    
    if (!data.features || !Array.isArray(data.features)) {
      console.error('유효하지 않은 TMap 응답:', data);
      throw new Error("유효하지 않은 응답 데이터입니다.");
    }

    const allCoordinates = [];
    data.features.forEach(feature => {
      if (feature.geometry.type === 'LineString') {
        allCoordinates.push(...feature.geometry.coordinates);
      }
    });

    const uniqueCoordinates = allCoordinates.filter((coord, index, self) =>
      index === self.findIndex(c => 
        c[0] === coord[0] && c[1] === coord[1]
      )
    );

    return {
      ...data,
      features: [
        {
          type: "Feature",
          geometry: {
            type: "LineString",
            coordinates: uniqueCoordinates
          },
          properties: {
            totalDistance: data.features.reduce((sum, feature) => 
              sum + (feature.properties?.distance || 0), 0),
            totalTime: data.features.reduce((sum, feature) => 
              sum + (feature.properties?.time || 0), 0)
          }
        }
      ]
    };
  }
};

//────────────────────────────────────────────
// 외국인 주의 구역 여부 판별 모듈 (foreignAreaService)
//────────────────────────────────────────────
// 실제 구현에 맞게 아래 함수를 구현해주세요.
const foreignAreaService = {
  isInForeignArea: async (lat, lon) => {
    // 예시: 외부 API 또는 로컬 데이터베이스 조회
    // 임시: 무조건 false 반환
    return false;
  }
};

//────────────────────────────────────────────
// 편의점 데이터 조회 모듈 (storeService)
//────────────────────────────────────────────
const storeService = {
  getStoreData: async (coordinates) => {
    try {
      if (!coordinates || coordinates.length === 0) {
        throw new Error('유효하지 않은 좌표 데이터');
      }

      const midIndex = Math.floor(coordinates.length / 2);
      const midCoord = coordinates[midIndex];

      if (!Array.isArray(midCoord) || midCoord.length < 2) {
        console.error('유효하지 않은 중간 지점 좌표:', midCoord);
        throw new Error('유효하지 않은 중간 지점 좌표');
      }

      const midPoint = {
        latitude: parseFloat(midCoord[1]),
        longitude: parseFloat(midCoord[0])
      };

      const response = await fetch(
        `https://dapi.kakao.com/v2/local/search/category.json?category_group_code=CS2&x=${midPoint.longitude}&y=${midPoint.latitude}&radius=1000&size=15`,
        {
          headers: {
            Authorization: `KakaoAK ${process.env.KAKAO_REST_API_KEY}`
          }
        }
      );

      if (!response.ok) {
        throw new Error(`편의점 데이터 가져오기 실패: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.documents) {
        throw new Error('유효하지 않은 데이터 형식');
      }

      return data.documents.map(store => ({
        name: store.place_name,
        latitude: parseFloat(store.y),
        longitude: parseFloat(store.x),
        address: store.road_address_name || store.address_name,
        distance: parseFloat(store.distance)
      }));

    } catch (error) {
      console.error('편의점 데이터 요청 실패:', error);
      return [];
    }
  }
};

//────────────────────────────────────────────
// 안전 경로 평가 및 외국인 주의 구역 회피 모듈 (safetyService)
//────────────────────────────────────────────

// 각 좌표 주변(반경 약 100m 내)에 외국인 주의 구역이 있는지 확인하는 헬퍼 함수
const checkForeignAreaNearby = async (lat, lon) => {
  // 100m에 해당하는 위경도 오프셋 (대략 0.0009도; 실제 값은 위도에 따라 달라질 수 있음)
  const offsets = [
    { dLat: 0, dLon: 0 },          // 중심
    { dLat: 0.0009, dLon: 0 },      // 북
    { dLat: -0.0009, dLon: 0 },     // 남
    { dLat: 0, dLon: 0.0009 },      // 동
    { dLat: 0, dLon: -0.0009 }      // 서
  ];
  for (const offset of offsets) {
    const testLat = lat + offset.dLat;
    const testLon = lon + offset.dLon;
    if (await foreignAreaService.isInForeignArea(testLat, testLon)) {
      return true;
    }
  }
  return false;
};

const safetyService = {
  // 각 경로에 대해 안전 점수를 산출하고, 외국인 주의 구역 회피 효과를 반영하는 함수
  calculateRouteSafety: async (routes, cctvData = []) => {
    return Promise.all(routes.map(async route => {
      const pathCoordinates = route.features[0].geometry.coordinates;
      let coveredSegments = 0;
      const totalSegments = pathCoordinates.length - 1;
      const uniqueCCTVs = new Set();
      const uniqueStores = new Set();
      const nearbyCCTVs = [];
      const nearbyStores = [];

      // 편의점 데이터 조회
      const storeData = await storeService.getStoreData(pathCoordinates);

      // 각 세그먼트를 순회하며 CCTV 또는 편의점이 50m 이내에 존재하면 해당 구간을 커버된 것으로 처리
      for (let i = 0; i < totalSegments; i++) {
        const coord = pathCoordinates[i];
        let segmentCovered = false;
        // CCTV 검사 (50m 이내)
        for (const cctv of cctvData) {
          const distance = calculateDistance(coord[1], coord[0], cctv.latitude, cctv.longitude);
          if (distance <= 50) {
            uniqueCCTVs.add(`${cctv.latitude}-${cctv.longitude}`);
            if (!nearbyCCTVs.find(item => item.latitude === cctv.latitude && item.longitude === cctv.longitude)) {
              nearbyCCTVs.push(cctv);
            }
            segmentCovered = true;
          }
        }
        // 편의점 검사 (50m 이내)
        for (const store of storeData) {
          const distance = calculateDistance(coord[1], coord[0], store.latitude, store.longitude);
          if (distance <= 50) {
            uniqueStores.add(`${store.latitude}-${store.longitude}`);
            if (!nearbyStores.find(item => item.latitude === store.latitude && item.longitude === store.longitude)) {
              nearbyStores.push(store);
            }
            segmentCovered = true;
          }
        }
        if (segmentCovered) {
          coveredSegments++;
        }
      }

      // 커버리지 비율 (세그먼트 중 커버된 비율)
      const coverageRatio = totalSegments > 0 ? Math.min((coveredSegments / totalSegments) * 100, 100) : 0;

      // 외국인 주의 구역 검사 (병렬 처리)
      const foreignAreaResults = await Promise.all(
        pathCoordinates.map(coord => checkForeignAreaNearby(coord[1], coord[0]))
      );
      const foreignAreaCount = foreignAreaResults.filter(result => result).length;
      const foreignRatio = pathCoordinates.length > 0 ? foreignAreaCount / pathCoordinates.length : 0;

      // 외국인 주의 구역 감점: 각 해당 좌표마다 -20점, 최대 -100점
      const penaltyPerPoint = 20;
      const maxPenalty = 100;
      let foreignPenalty = -Math.min(foreignAreaCount * penaltyPerPoint, maxPenalty);
      // 외국인 주의 구역 비율이 30% 이상이면 추가 감점 (-50점)
      if (foreignRatio >= 0.3) {
        foreignPenalty -= 50;
      }

      // 가중치 조정
      // - Coverage Score: coverageRatio * 0.2 (최대 20점)
      // - CCTV Score: 각 CCTV 5점, 최대 20점
      // - 편의점 Score: 각 편의점 3점, 최대 10점
      const coverageScore = coverageRatio * 0.2;
      const cctvScore = Math.min(uniqueCCTVs.size * 5, 20);
      const storeScore = Math.min(uniqueStores.size * 3, 10);
      const baseSafetyScore = coverageScore + cctvScore + storeScore;
      const finalSafetyScore = baseSafetyScore + foreignPenalty;

      return {
        ...route,
        safety: {
          grade: safetyService.calculateSafetyGrade(finalSafetyScore),
          cctvCount: uniqueCCTVs.size,
          storeCount: uniqueStores.size,
          coverageRatio: Math.round(coverageRatio),
          finalScore: finalSafetyScore
        },
        nearbyCCTVs,
        nearbyStores
      };
    }));
  },

  // 안전 점수에 따른 등급 산정 함수
  calculateSafetyGrade: (finalSafetyScore) => {
    if (finalSafetyScore >= 40) {
      return 'A';
    } else if (finalSafetyScore >= 30) {
      return 'B';
    } else if (finalSafetyScore >= 20) {
      return 'C';
    } else {
      return 'D';
    }
  },

  // 여러 경로 중 최종 안전 점수가 가장 높은 경로 선택 (reduce를 이용)
  selectBestRoute: (routes) => {
    if (!routes || routes.length === 0) {
      return null;
    }
    return routes.reduce((best, current) => {
      const currentScore = current.safety.finalScore;
      const bestScore = best ? best.safety.finalScore : -Infinity;
      return currentScore > bestScore ? current : best;
    }, null);
  }
};

//────────────────────────────────────────────
// 거리 계산 함수 (Haversine 공식)
//────────────────────────────────────────────
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // 지구 반경 (미터)
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(Δφ / 2) ** 2 +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};



module.exports = { tmapService, safetyService, storeService };
