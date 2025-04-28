export const fetchCCTVPlacesData = async (lat, lng) => {
  try {
    console.log(`CCTV 데이터 요청: lat=${lat}, lng=${lng}`);
    
    // 위치 정보를 쿼리 파라미터로 추가
    const params = new URLSearchParams({
      lat: lat,
      lng: lng
    });
    
    const PROXY_URL = 'http://localhost:3001';
    const url = `${PROXY_URL}/api/cctvPlaces?${params}`;
    console.log('요청 URL:', url);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      // 상태 코드와 응답 텍스트 출력
      const errorText = await response.text();
      console.error(`서버 오류 (${response.status}): ${errorText}`);
      throw new Error(`Failed to fetch cctv places: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`CCTV 데이터 ${data.length}개 수신 성공`);
    return data;
  } catch (error) {
    console.error("Error in fetchCCTVPlacesData:", error);
    // 오류 발생 시 빈 배열 반환
    return [];
  }
};