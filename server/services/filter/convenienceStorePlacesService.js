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
        radius: 1000,    // 5km 반경
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

      // 각 결과에서 위도/경도 정보만 추출하여 반환
      const mappedData = data.documents.map(place => {
        return { 
          name: place.place_name,
          latitude: parseFloat(place.y),  // 카카오 API는 y가 위도(latitude)
          longitude: parseFloat(place.x)  // 카카오 API는 x가 경도(longitude)
        };
      });

      return mappedData;
    } catch (error) {
      console.error('편의점 데이터 가져오기 실패:', error);
      throw new Error('편의점 데이터 가져오기 실패: ' + error.message);
    }
  }
};

module.exports = convenienceStoreService;