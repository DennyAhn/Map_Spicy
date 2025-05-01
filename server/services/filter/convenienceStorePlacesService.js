require("dotenv").config();
const fetch = require("node-fetch");

const convenienceStoreService = {
  getConvenienceStorePlacesData: async (lat, lng) => {
    try {
      // 카카오 REST API 키를 환경 변수에서 가져옴
      const KAKAO_REST_API_KEY = process.env.KAKAO_REST_API_KEY;
      if (!KAKAO_REST_API_KEY) {
        throw new Error('KAKAO_REST_API_KEY가 환경 변수에 설정되어 있지 않습니다');
      }

      console.log(`편의점 장소 요청 위치: lat=${lat}, lng=${lng}`);
      
      // 카카오 로컬 키워드 검색 API 호출
      const url = 'https://dapi.kakao.com/v2/local/search/keyword.json';
      const params = new URLSearchParams({
        query: '편의점', // 검색 키워드
        x: lng,          // 경도
        y: lat,          // 위도
        radius: 1000,    // 1km 반경
        size: 15         // 검색 결과 수
      });
      
      console.log('카카오 키워드 API 요청 URL:', `${url}?${params}`);

      const response = await fetch(`${url}?${params}`, {
        method: 'GET',
        headers: {
          Authorization: `KakaoAK ${KAKAO_REST_API_KEY}`
        }
      });

      console.log('카카오 API 응답 상태코드:', response.status);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`카카오 API 조회 실패: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      // 응답 내 결과가 없는 경우 처리
      if (!data.documents || data.documents.length === 0) {
        console.error("카카오 API로부터 결과를 찾을 수 없음");
        return [];
      }

      console.log(`카카오 API에서 ${data.documents.length}개의 결과 반환됨`);
      console.log('첫 번째 편의점 데이터 예시:', data.documents[0]);

      // 거리 계산 함수
      const calculateDistance = (lat1, lng1, lat2, lng2) => {
        const R = 6371; // 지구 반지름(km)
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const a = 
          Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
          Math.sin(dLng/2) * Math.sin(dLng/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = R * c;
        
        // 거리를 km 또는 m 단위로 반환
        if (distance >= 1) {
          return `${distance.toFixed(1)}km`;
        } else {
          return `${Math.round(distance * 1000)}m`;
        }
      };

      // 각 결과에서 필요한 정보 추출하여 반환
      const mappedData = data.documents.map(place => {
        const distance = calculateDistance(
          parseFloat(lat), 
          parseFloat(lng), 
          parseFloat(place.y), 
          parseFloat(place.x)
        );
        
        // 방문자 리뷰 정보 (실제 API에서는 없으므로 랜덤으로 생성)
        const visitors = Math.floor(Math.random() * 100) + 1;
        
        const placeData = { 
          id: place.id,                               // 장소 ID
          name: place.place_name,                     // 장소명
          address: place.road_address_name || place.address_name, // 도로명 주소 또는 지번 주소
          jibunAddress: place.address_name,           // 지번 주소
          roadAddress: place.road_address_name,       // 도로명 주소
          distance: distance,                         // 현재 위치에서의 거리
          phone: place.phone || '',                   // 전화번호 (있을 경우)
          category: place.category_name || '편의점',    // 카테고리
          latitude: parseFloat(place.y),              // 위도
          longitude: parseFloat(place.x)              // 경도

        };
        
        // 각 장소 데이터 로깅
        console.log('장소 데이터:', JSON.stringify(placeData));
        
        return placeData;
      });

      // 최종 응답 데이터 로깅
      if (mappedData.length > 0) {
        console.log('최종 응답 데이터 예시:', JSON.stringify(mappedData[0]));
        console.log('총 반환 데이터 수:', mappedData.length);
      }

      return mappedData;
    } catch (error) {
      console.error('편의점 데이터 가져오기 실패:', error);
      throw new Error('편의점 데이터 가져오기 실패: ' + error.message);
    }
  }
};

module.exports = convenienceStoreService;