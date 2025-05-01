// placeApi.js
import { fetchPolicePlacesData } from './filter/policePlacesApi';
import { fetchFireStationPlacesData } from './filter/fireStationPlacesApi';
import { fetchWomenPlacesData } from './filter/womenPlacesApi';
import { fetchElderlyPlacesData } from './filter/elderlyPlacesApi';
import { fetchCCTVPlacesData } from './filter/cctvPlacesApi';
import { fetchConvenienceStorePlacesData } from './filter/convenienceStorePlacesApi';
import { fetchPharmacyPlacesData } from './filter/pharmacyPlacesApi';
import { fetchWheelChairPlacesData } from './filter/wheelChairPlacesApi';

// 공통 포맷으로 변환하는 함수
function normalizePlaces(data, nameKeys = [], latKey = 'latitude', lngKey = 'longitude') {
  return data.map(item => {
    const name =
      nameKeys.find(key => item[key]) ? item[nameKeys.find(key => item[key])] : '이름 없음';
    return {
      name,
      latitude: item[latKey] || item.lat,
      longitude: item[lngKey] || item.lng,
      ...item
    };
  });
}

// 필터별 장소 정보 요청 함수
export async function getPlacesForFilter(filter, currentLocation) {
  try {
    let rawData;

    switch (filter) {
      case '편의점':
        rawData = await fetchConvenienceStorePlacesData(currentLocation.lat, currentLocation.lng);
        console.log(`[${filter}] 응답 데이터 예시:`, rawData);

        return normalizePlaces(rawData, ['store_name', 'name']);

      case '경찰서':
        rawData = await fetchPolicePlacesData(currentLocation.lat, currentLocation.lng);
        return normalizePlaces(rawData, ['facility_name', 'name']);

      case '소방시설':
        rawData = await fetchFireStationPlacesData(currentLocation.lat, currentLocation.lng);
        return normalizePlaces(rawData, ['facility_name', 'name']);

      case '안전비상벨':
        rawData = await fetchWomenPlacesData(currentLocation.lat, currentLocation.lng);
        return normalizePlaces(rawData, ['title', 'name']);

      case '약국':
        rawData = await fetchPharmacyPlacesData(currentLocation.lat, currentLocation.lng);
        return normalizePlaces(rawData, ['pharmacy_name', 'name']);

      case '휠체어 충전소':
        rawData = await fetchWheelChairPlacesData(currentLocation.lat, currentLocation.lng);
        return normalizePlaces(rawData, ['facility_name', 'name']);

      case '복지시설':
        rawData = await fetchElderlyPlacesData(currentLocation.lat, currentLocation.lng);
        return normalizePlaces(rawData, ['facility_name', 'name']);

      case '지하철역 엘리베이터':
        return normalizePlaces([
          { latitude: 35.851830, longitude: 128.491437 },
          { latitude: 35.851708, longitude: 128.492684 },
          { latitude: 35.853288, longitude: 128.478243 },
          { latitude: 35.852727, longitude: 128.478305 },
          { latitude: 35.851447, longitude: 128.507013 },
          { latitude: 35.850790, longitude: 128.516242 },
          { latitude: 35.857281, longitude: 128.466053 },
          { latitude: 35.856965, longitude: 128.465646 },
        ]);

      case '외국인 주의구역':
        return normalizePlaces([
          { latitude: 35.855788, longitude: 128.494244 },
          { latitude: 35.856083, longitude: 128.494828 },
          { latitude: 35.856141, longitude: 128.493966 },
          { latitude: 35.856049, longitude: 128.493751 },
          { latitude: 35.850626, longitude: 128.485113 },
          { latitude: 35.850802, longitude: 128.486246 },
          { latitude: 35.850590, longitude: 128.484691 },
        ]);

      case 'CCTV':
        rawData = await fetchCCTVPlacesData(currentLocation.lat, currentLocation.lng);
        return normalizePlaces(rawData, ['cctv_name', 'name']);

      default:
        console.warn(`No matching filter found for: ${filter}`);
        return [];
    }
  } catch (error) {
    console.error(`Error in getPlacesForFilter for ${filter}:`, error);
    return [];
  }
}
