import { API_BASE_URL, PROXY_URL } from '../../config/api';

export const fetchConvenienceStorePlacesData = async (lat, lng) => {
  try {
    // 위치 정보를 쿼리 파라미터로 추가
    const params = new URLSearchParams({
      lat: lat,
      lng: lng
    });
    
    const response = await fetch(`${PROXY_URL}/api/ConvenienceStores?${params}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch Convenience Store places: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error in fetchConvenienceStorePlacesData:", error);
    return [];
  }
};
