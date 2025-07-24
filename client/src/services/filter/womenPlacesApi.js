import { API_BASE_URL } from '../../config/api';

export const fetchWomenPlacesData = async (lat, lng) => {
  try {
    // 위치 정보를 쿼리 파라미터로 추가
    const params = new URLSearchParams({
      lat: lat,
      lng: lng
    });
    
    const response = await fetch(`${API_BASE_URL}/api/womenPlaces?${params}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch women places: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error in fetchWomenPlacesData:", error);
    return [];
  }
};