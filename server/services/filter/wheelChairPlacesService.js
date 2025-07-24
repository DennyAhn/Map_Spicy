require('dotenv').config();
const fs = require('fs');
const path = require('path');

// Load the JSON data from file
const loadWheelChairData = () => {
  try {
    const jsonPath = path.join(__dirname, '../../dataStorage/wheelChair.json');
    const rawData = fs.readFileSync(jsonPath, 'utf8');
    return JSON.parse(rawData);
  } catch (error) {
    console.error('Error loading wheelchair data:', error);
    return [];
  }
};

// Calculate distance between two points using Haversine formula
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c; // Distance in km
  return distance;
};

const wheelChairPlacesService = {
  getWheelChairPlacesData: async (lat, lng) => {
    try {
      console.log(`위치 정보: lat=${lat}, lng=${lng}`);
      
      // Default coordinates if not provided
      const userLat = parseFloat(lat) || 35.8312;
      const userLng = parseFloat(lng) || 128.5325;
      
      // Load data from JSON file
      const wheelChairData = loadWheelChairData();
      console.log(`로드된 휠체어 충전소 데이터: ${wheelChairData.length}개`);
      
      // Filter locations within radius (5km)
      const radius = 5; // 5km radius
      const nearbyLocations = wheelChairData.filter(station => {
        const distance = calculateDistance(
          userLat, 
          userLng, 
          station.위도, 
          station.경도
        );
        return distance <= radius;
      });
      
      console.log(`필터링된 위치: ${nearbyLocations.length}개`);
      
      // Map the data to match the expected output format
      const mappedData = nearbyLocations.map(station => ({
        latitude: station.위도,
        longitude: station.경도,
        name: station.시설명,
        address: station.소재지도로명주소,
        openingHours: `평일: ${station.평일운영시작시각}-${station.평일운영종료시각}`,
        phoneNumber: station.관리기관전화번호
      }));
      
      return mappedData;
      
    } catch (error) {
      console.error('휠체어 충전소 데이터 가져오기 실패:', error);
      console.error('에러 스택:', error.stack);
      
      // Return default location on error
      return [{
        latitude: parseFloat(lat) || 35.8312,
        longitude: parseFloat(lng) || 128.5325
      }];
    }
  }
};

module.exports = wheelChairPlacesService;
