const PROXY_URL = 'http://localhost:3001';

export async function fetchPlacesData(category, currentLocation) {
  try {
    const searchKeywords = {
      '편의점': 'convenience store',
      '소방시설': 'fire station',
      '경찰서': 'police station',
      '공사현장': 'construction site',
      '범죄주의구간': 'crime hotspot',
      '안전비상벨': 'emergency bell',
      'CCTV': 'cctv',
      '지하철역 엘레베이터': 'subway elevator',
      '심야약국': 'pharmacy',
      '휠체어 충전소': 'wheelchair charging station',
      '복지시설': 'welfare facility'
    };

    const keyword = searchKeywords[category] || category;
    const { lat, lng } = currentLocation;
    
    console.log(`Searching for ${keyword} near ${lat},${lng}`);

    const locationString = `${lat},${lng}`;
    
    const queryParams = new URLSearchParams({
      location: locationString,
      radius: '5000',
      keyword: keyword
    });

    const response = await fetch(`${PROXY_URL}/api/places?${queryParams}`);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch places');
    }

    const data = await response.json();
    console.log('API Response:', data);

    if (data.status === 'REQUEST_DENIED') {
      throw new Error(data.error_message || 'API request was denied');
    }

    if (!data.results || !Array.isArray(data.results)) {
      console.warn('No results found or invalid response format');
      return [];
    }

    return data.results.map(place => ({
      name: place.name,
      latitude: place.geometry.location.lat,
      longitude: place.geometry.location.lng,
      address: place.vicinity,
      placeId: place.place_id
    }));
  } catch (error) {
    console.error('Error fetching places:', error);
    return [];
  }
}