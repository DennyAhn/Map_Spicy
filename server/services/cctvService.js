const fetch = require("node-fetch");

const cctvService = {
  getCCTVData: async () => {
    try {
      // 환경변수에서 API 키와 URL 가져오기
      const serviceKey = process.env.CCTV_API_KEY;
      const apiUrl = process.env.CCTV_API_URL;
      
      if (!serviceKey) {
        throw new Error('CCTV 서비스 키가 설정되지 않았습니다. .env 파일에 CCTV_API_KEY를 설정해주세요.');
      }
      
      if (!apiUrl) {
        throw new Error('CCTV API URL이 설정되지 않았습니다. .env 파일에 CCTV_API_URL을 설정해주세요.');
      }
      
      // 요청 파라미터 구성
      const queryParams = new URLSearchParams({
        page: '1',
        perPage: '1000',
        serviceKey: serviceKey,
        returnType: 'JSON'  // 응답 형식 지정
      });

      const response = await fetch(`${apiUrl}?${queryParams}`, {
        method: 'GET',
        headers: {
          'accept': 'application/json',
        }
      });

      if (!response.ok) {
        const errorData = await response.text();
        //console.error('API 응답 상세:', errorData);
        throw new Error(`CCTV 데이터 가져오기 실패: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.data) {
        //console.error('API 응답 데이터:', data);
        throw new Error('유효하지 않은 데이터 형식');
      }

      // 데이터 확인을 위한 로그
      //console.log('CCTV 데이터 샘플:', data.data[0]);  // 원본 데이터 확인

      // 필요한 데이터만 매핑하여 반환
      return data.data.map(item => ({
        latitude: parseFloat(item.위도),
        longitude: parseFloat(item.경도),
        address: item.소재지도로명주소,
        purpose: item.설치목적구분,
        cameraCount: parseInt(item.카메라대수) || 1
      }));

    } catch (error) {
      console.error('CCTV 데이터 가져오기 실패:', error.message);
      throw new Error(`CCTV 데이터 가져오기 실패: ${error.message}`);
    }
  }
};

module.exports = cctvService;