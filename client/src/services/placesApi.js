// placeApi.js - RESTful API 방식으로 전면 개편
import { API_BASE_URL } from '../config/api';

// 카테고리 매핑 (클라이언트 필터명 → 서버 카테고리명)
const categoryMapping = {
  '편의점': 'convenience-store',
  '경찰서': 'police',
  '소방시설': 'fire-station',
  '안전비상벨': 'women-safe',      // 수정: women-safety → women-safe
  '약국': 'pharmacy',
  '휠체어 충전소': 'wheelchair-accessible',  // 수정: wheelchair → wheelchair-accessible
  '복지시설': 'elderly-friendly',   // 수정: elderly → elderly-friendly
  'CCTV': 'cctv',
  '지하철역 엘리베이터': 'subway-elevator',
  '외국인 주의구역': 'foreigner-warning'
};

// RESTful API를 통한 장소 데이터 요청
export async function getPlacesForFilter(filter, currentLocation) {
  try {
    const category = categoryMapping[filter];
    
    if (!category) {
      console.warn(`지원하지 않는 카테고리: ${filter}`);
      return [];
    }

    // 하드코딩 데이터를 사용하는 카테고리들
    if (filter === '지하철역 엘리베이터') {
      return [
          { latitude: 35.851830, longitude: 128.491437 },
          { latitude: 35.851708, longitude: 128.492684 },
          { latitude: 35.853288, longitude: 128.478243 },
          { latitude: 35.852727, longitude: 128.478305 },
          { latitude: 35.851447, longitude: 128.507013 },
          { latitude: 35.850790, longitude: 128.516242 },
          { latitude: 35.857281, longitude: 128.466053 },
          { latitude: 35.856965, longitude: 128.465646 }
      ];
    }

    if (filter === '외국인 주의구역') {
      return [
          { latitude: 35.855788, longitude: 128.494244 },
          { latitude: 35.856083, longitude: 128.494828 },
          { latitude: 35.856141, longitude: 128.493966 },
          { latitude: 35.856049, longitude: 128.493751 },
          { latitude: 35.850626, longitude: 128.485113 },
          { latitude: 35.850802, longitude: 128.486246 },
          { latitude: 35.850590, longitude: 128.484691 }
      ];
    }

    console.log(`[${filter}] RESTful API 요청: category=${category}`);

    // RESTful API 호출
    const params = new URLSearchParams({
      category: category,
      lat: currentLocation.lat,
      lng: currentLocation.lng,
      radius: '5000',
      limit: '15'
    });

    const response = await fetch(`${API_BASE_URL}/api/places?${params}`);
    
    if (!response.ok) {
      throw new Error(`API 요청 실패: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || 'API 응답 오류');
    }

    console.log(`[${filter}] ${result.data.length}개 데이터 수신`);
    
    // 서버 응답 데이터를 클라이언트 형식으로 변환
    const normalizedData = result.data.map(item => ({
      ...item,
      // 위치 정보 정규화
      latitude: item.location?.lat || item.latitude,
      longitude: item.location?.lng || item.longitude,
      // 기존 이름 필드 정규화  
      name: item.place_name || item.name,
      address: item.address_name || item.address
    }));

    console.log(`[${filter}] 데이터 정규화 완료:`, normalizedData[0]?.latitude ? '위치정보 있음' : '위치정보 없음');
    
    return normalizedData;

  } catch (error) {
    console.error(`[${filter}] 데이터 요청 실패:`, error);
    return [];
  }
}
