// placeApi.js
import { fetchPolicePlacesData } from './filter/policePlacesApi';
import { fetchFireStationPlacesData } from './filter/fireStationPlacesApi';
import { fetchWomenPlacesData } from './filter/womenPlacesApi';
import { fetchElderlyPlacesData } from './filter/elderlyPlacesApi';
import { fetchCCTVPlacesData } from './filter/cctvPlacesApi';
import { fetchConvenienceStorePlacesData } from './filter/convenienceStorePlacesApi';
import { fetchPharmacyPlacesData } from './filter/pharmacyPlacesApi';
import { fetchWheelChairPlacesData } from './filter/wheelChairPlacesApi';

// 이 함수는 필터 이름과 현재 위치를 받아, 해당 카테고리에 따른 데이터를 반환
export async function getPlacesForFilter(filter, currentLocation) {
  try {
    switch (filter) {
      case '편의점':
        return await fetchConvenienceStorePlacesData(currentLocation.lat, currentLocation.lng);
      case '경찰서':
        return await fetchPolicePlacesData(currentLocation.lat, currentLocation.lng);
      case '소방시설':
        return await fetchFireStationPlacesData(currentLocation.lat, currentLocation.lng);
      case '안전비상벨':
        return await fetchWomenPlacesData(currentLocation.lat, currentLocation.lng);
      case '심야약국':
        return await fetchPharmacyPlacesData(currentLocation.lat, currentLocation.lng);
      case '휠체어 충전소':
        return await fetchWheelChairPlacesData(currentLocation.lat, currentLocation.lng);
      case '복지시설':
        return await fetchElderlyPlacesData(currentLocation.lat, currentLocation.lng);
      case '지하철역 엘리베이터':
        // 미리 하드코딩된 지하철역 엘리베이터 좌표 배열을 반환
        return [
          { latitude: 35.851830, longitude: 128.491437 },
          { latitude: 35.851708, longitude: 128.492684 },
          { latitude: 35.853288, longitude: 128.478243 },
          { latitude: 35.852727, longitude: 128.478305 },
          { latitude: 35.851447, longitude: 128.507013 },
          { latitude: 35.850790, longitude: 128.516242 },
          { latitude: 35.857281, longitude: 128.466053 },
          { latitude: 35.856965, longitude: 128.465646 },
        ];
      case '외국인 주의구역':
        // 하드코딩된 외국인 주의구역 좌표
        return [
          { latitude: 35.855788, longitude: 128.494244 },
          { latitude: 35.856083, longitude: 128.494828 },
          { latitude: 35.856141, longitude: 128.493966 },
          { latitude: 35.856049, longitude: 128.493751 },
          { latitude: 35.850626, longitude: 128.485113 },
          { latitude: 35.850802, longitude: 128.486246 },
          { latitude: 35.850590, longitude: 128.484691 },
        ]
      case 'CCTV':
        return await fetchCCTVPlacesData(currentLocation.lat, currentLocation.lng);
      default:
        console.warn(`No matching filter found for: ${filter}`);
        return [];
    }
  } catch (error) {
    console.error(`Error in getPlacesForFilter for ${filter}:`, error);
    return [];
  }
}