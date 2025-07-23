require("dotenv").config();
const fetch = require("node-fetch");
const fs = require("fs");
const path = require("path");

/**
 * 🚀 CLEANED: 통합 장소 검색 서비스 (직접 구현)
 * 카카오 API를 직접 호출하여 장소 검색 제공
 * 로컬 데이터(휠체어 충전소, 안전비상벨) 지원 추가
 * 외부 API(CCTV) 지원 추가
 */
class PlacesService {
  constructor() {
    this.apiKey = process.env.KAKAO_REST_API_KEY;
    
    // 카테고리별 검색 키워드 매핑
    this.categoryKeywords = {
      'police': '경찰서',
      'fire-station': '소방서',
      'pharmacy': '약국',
      'convenience-store': '편의점',
      'hospital': '병원',
      'elderly-friendly': '노인복지시설'
    };

    // 로컬 데이터 카테고리 (dataStorage에서 가져오는 카테고리)
    this.localDataCategories = {
      'wheelchair-accessible': 'wheelChair.json',
      'women-safe': 'sirenBell.json'
    };

    // 외부 API 카테고리 (cctvService 등)
    this.externalApiCategories = {
      'cctv': 'cctvService'
    };

    this.validateApiKey();
  }

  validateApiKey() {
    if (!this.apiKey) {
      throw new Error('KAKAO_REST_API_KEY가 환경 변수에 설정되어 있지 않습니다');
    }
  }

  /**
   * 🚀 CLEANED: 카테고리별 장소 검색 (직접 구현)
   * @param {Object} params 검색 파라미터
   * @param {string} params.category 장소 카테고리
   * @param {number} params.lat 위도
   * @param {number} params.lng 경도
   * @param {number} params.radius 검색 반경 (미터, 기본값: 5000)
   * @param {number} params.limit 결과 개수 (기본값: 15)
   * @returns {Promise<Object>} 검색 결과
   */
  async searchPlacesByCategory({ category, lat, lng, radius, limit }) {
    // 카테고리 검증
    if (!this.categoryKeywords[category] && !this.localDataCategories[category] && !this.externalApiCategories[category]) {
      throw new Error(`지원하지 않는 카테고리입니다: ${category}`);
    }

    console.log(`🔍 ${category} 장소 검색:`, {
      location: `${lat}, ${lng}`,
      radius: radius || 5000,
      limit: limit || 15
    });

    try {
      // 로컬 데이터 카테고리인 경우
      if (this.localDataCategories[category]) {
        console.log(`📁 로컬 데이터에서 ${category} 검색`);
        const result = await this.searchLocalData({ category, lat, lng, radius, limit });
        console.log(`✅ ${category} 로컬 검색 완료: ${result.data.places?.length || 0}개 결과`);
        return result;
      }

      // 외부 API 카테고리인 경우 (CCTV 등)
      if (this.externalApiCategories[category]) {
        console.log(`🌐 외부 API에서 ${category} 검색`);
        const result = await this.searchExternalApi({ category, lat, lng, radius, limit });
        console.log(`✅ ${category} 외부 API 검색 완료: ${result.data.places?.length || 0}개 결과`);
        return result;
      }

      // 카카오 API 검색
      console.log(`🌐 카카오 API에서 ${category} 검색`);
      const result = await this.searchKakaoPlaces({ category, lat, lng, radius, limit });
      console.log(`✅ ${category} 검색 완료: ${result.data.places?.length || 0}개 결과`);
      return result;

    } catch (error) {
      console.error(`❌ ${category} 검색 실패:`, error.message);
      
      if (error.code === 'ECONNABORTED') {
        throw new Error('외부 API 요청 시간 초과');
      }

      throw new Error(`${category} 검색 중 오류 발생: ${error.message}`);
    }
  }

  /**
   * 🚀 카카오 API를 통한 장소 검색 (직접 구현)
   * @param {Object} params 검색 파라미터
   */
  async searchKakaoPlaces({ category, lat, lng, radius, limit }) {
    const baseURL = 'https://dapi.kakao.com/v2/local/search/keyword.json';
    const keyword = this.categoryKeywords[category];
    const searchRadius = radius || 5000;
    const searchLimit = Math.min(limit || 15, 15);

    const searchParams = new URLSearchParams({
      query: keyword,
      x: lng,
      y: lat,
      radius: searchRadius,
      size: searchLimit
    });

    const response = await fetch(`${baseURL}?${searchParams}`, {
      method: 'GET',
      headers: {
        'Authorization': `KakaoAK ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    if (!response.ok) {
      throw new Error(`카카오 API 요청 실패: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    const transformedData = this.transformKakaoData(data.documents, category);

    return {
      success: true,
      data: {
        places: transformedData,
        meta: {
          total: data.meta?.total_count || transformedData.length,
          is_end: data.meta?.is_end !== false,
          page_count: transformedData.length,
          search_params: {
            category,
            keyword,
            location: { lat, lng },
            radius: searchRadius
          },
          source: 'direct_search'
        }
      }
    };
  }

  /**
   * 🚀 로컬 데이터에서 장소 검색 (휠체어 충전소, 안전비상벨)
   * @param {Object} params 검색 파라미터
   */
  async searchLocalData({ category, lat, lng, radius, limit }) {
    const fileName = this.localDataCategories[category];
    const filePath = path.join(__dirname, '../dataStorage', fileName);
    
    try {
      // JSON 파일 읽기
      const rawData = fs.readFileSync(filePath, 'utf8');
      const localData = JSON.parse(rawData);
      
      console.log(`📂 ${fileName}에서 ${localData.length}개 데이터 로드`);

      // 거리 계산 및 필터링
      const searchRadius = radius || 5000; // 기본 5km
      const searchLimit = Math.min(limit || 15, 15);

      const filteredData = localData
        .map(item => {
          const itemLat = this.extractLatitude(item);
          const itemLng = this.extractLongitude(item);
          
          if (!itemLat || !itemLng) return null;

          const distance = this.calculateDistance(lat, lng, itemLat, itemLng);
          
          // 반경 내에 있는 데이터만 포함
          if (distance <= searchRadius) {
            return {
              ...item,
              distance: Math.round(distance),
              location: {
                lat: itemLat,
                lng: itemLng
              }
            };
          }
          return null;
        })
        .filter(item => item !== null)
        .sort((a, b) => a.distance - b.distance) // 거리순 정렬
        .slice(0, searchLimit);

      // 표준 형식으로 변환
      const transformedData = this.transformLocalData(filteredData, category);

      return {
        success: true,
        data: {
          places: transformedData,
          meta: {
            total: filteredData.length,
            is_end: true,
            page_count: transformedData.length,
            search_params: {
              category,
              keyword: this.categoryKeywords[category] || category,
              location: { lat, lng },
              radius: searchRadius
            },
            source: 'local_storage'
          }
        }
      };

    } catch (error) {
      console.error(`로컬 데이터 검색 오류 (${category}):`, error);
      throw new Error(`로컬 데이터 읽기 실패: ${error.message}`);
    }
  }

  /**
   * 🚀 외부 API에서 장소 검색 (CCTV 등)
   * @param {Object} params 검색 파라미터
   */
  async searchExternalApi({ category, lat, lng, radius, limit }) {
    try {
      let externalData = [];

      // CCTV 데이터 처리
      if (category === 'cctv') {
        console.log(`📡 CCTV API에서 데이터 가져오기`);
        const cctvService = require('./cctvService');
        externalData = await cctvService.getCCTVData();
        console.log(`📂 CCTV API에서 ${externalData.length}개 데이터 로드`);
      }

      // 거리 계산 및 필터링
      const searchRadius = radius || 5000; // 기본 5km
      const searchLimit = Math.min(limit || 15, 15);

      const filteredData = externalData
        .map(item => {
          const itemLat = item.latitude;
          const itemLng = item.longitude;
          
          if (!itemLat || !itemLng) return null;

          const distance = this.calculateDistance(lat, lng, itemLat, itemLng);
          
          // 반경 내에 있는 데이터만 포함
          if (distance <= searchRadius) {
            return {
              ...item,
              distance: Math.round(distance),
              location: {
                lat: itemLat,
                lng: itemLng
              }
            };
          }
          return null;
        })
        .filter(item => item !== null)
        .sort((a, b) => a.distance - b.distance) // 거리순 정렬
        .slice(0, searchLimit);

      // 표준 형식으로 변환
      const transformedData = this.transformExternalData(filteredData, category);

      return {
        success: true,
        data: {
          places: transformedData,
          meta: {
            total: filteredData.length,
            is_end: true,
            page_count: transformedData.length,
            search_params: {
              category,
              keyword: 'CCTV',
              location: { lat, lng },
              radius: searchRadius
            },
            source: 'external_api'
          }
        }
      };

    } catch (error) {
      console.error(`외부 API 검색 오류 (${category}):`, error);
      throw new Error(`외부 API 데이터 가져오기 실패: ${error.message}`);
    }
  }

  /**
   * 카카오 API 응답 데이터를 표준 형식으로 변환
   * @param {Array} documents 카카오 API 응답 데이터
   * @param {string} category 카테고리
   * @returns {Array} 변환된 데이터
   */
  transformKakaoData(documents, category) {
    return documents.map((place, index) => ({
      id: place.id,
      place_name: place.place_name,
      category_name: place.category_name,
      category_group_code: place.category_group_code,
      phone: place.phone || null,
      address_name: place.address_name,
      road_address_name: place.road_address_name || null,
      location: {
        lat: parseFloat(place.y),
        lng: parseFloat(place.x)
      },
      distance: place.distance ? parseInt(place.distance) : null,
      place_url: place.place_url || null,
      search_category: category,
      rank: index + 1
    }));
  }

  /**
   * 로컬 데이터에서 위도 추출
   */
  extractLatitude(item) {
    return item.위도 || item.WGS84위도 || item.latitude || null;
  }

  /**
   * 로컬 데이터에서 경도 추출
   */
  extractLongitude(item) {
    return item.경도 || item.WGS84경도 || item.longitude || null;
  }

  /**
   * 두 지점 간 거리 계산 (미터 단위)
   */
  calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371000; // 지구 반지름 (미터)
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  /**
   * 로컬 데이터를 표준 형식으로 변환
   */
  transformLocalData(localData, category) {
    return localData.map((item, index) => {
      let transformedItem = {
        id: `local-${category}-${index}`,
        location: item.location,
        distance: item.distance,
        search_category: category,
        rank: index + 1
      };

      // 휠체어 충전소 데이터 변환
      if (category === 'wheelchair-accessible') {
        transformedItem = {
          ...transformedItem,
          place_name: item.시설명 || `휠체어 충전소 ${index + 1}`,
          category_name: '복지시설 > 휠체어 충전소',
          address_name: item.소재지지번주소 || item.소재지도로명주소,
          road_address_name: item.소재지도로명주소,
          phone: null,
          place_url: null,
          // 추가 정보
          설치장소설명: item.설치장소설명,
          운영시간: `${item.평일운영시작시각}-${item.평일운영종료시각}`,
          동시사용가능대수: item.동시사용가능대수,
          공기주입가능여부: item.공기주입가능여부,
          휴대전화충전가능여부: item.휴대전화충전가능여부
        };
      }
      
      // 안전비상벨 데이터 변환
      if (category === 'women-safe') {
        transformedItem = {
          ...transformedItem,
          place_name: item.설치위치 || `안전비상벨 ${index + 1}`,
          category_name: '안전시설 > 여성안전 > 안전비상벨',
          address_name: item.소재지지번주소 || item.소재지도로명주소,
          road_address_name: item.소재지도로명주소,
          phone: null,
          place_url: null,
          // 추가 정보
          설치목적: item.설치목적,
          설치장소유형: item.설치장소유형,
          연계방식: item.연계방식,
          경찰연계유무: item.경찰연계유무,
          관리기관명: item.관리기관명
        };
      }

      return transformedItem;
    });
  }

  /**
   * 외부 API 데이터를 표준 형식으로 변환
   */
  transformExternalData(externalData, category) {
    return externalData.map((item, index) => {
      let transformedItem = {
        id: `external-${category}-${index}`,
        location: item.location,
        distance: item.distance,
        search_category: category,
        rank: index + 1
      };

      // CCTV 데이터 변환
      if (category === 'cctv') {
        transformedItem = {
          ...transformedItem,
          place_name: `CCTV ${index + 1}`,
          category_name: '보안시설 > CCTV',
          address_name: item.address,
          road_address_name: item.address,
          phone: null,
          place_url: null,
          // 추가 정보
          설치목적: item.purpose,
          카메라대수: item.cameraCount
        };
      }

      return transformedItem;
    });
  }

  /**
   * 지원되는 카테고리 목록 반환
   * @returns {Array} 카테고리 목록
   */
  getSupportedCategories() {
    return [...Object.keys(this.categoryKeywords), ...Object.keys(this.localDataCategories), ...Object.keys(this.externalApiCategories)];
  }

  /**
   * 카테고리별 키워드 반환
   * @param {string} category 카테고리
   * @returns {string} 검색 키워드
   */
  getCategoryKeyword(category) {
    return this.categoryKeywords[category] || null;
  }
}

module.exports = new PlacesService();
