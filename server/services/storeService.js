const fetch = require("node-fetch");

const storeService = {
  getStoreData: async (coordinates) => {
    try {
      // 경로의 중간 지점 계산
      const midIndex = Math.floor(coordinates.length / 2);
      const midPoint = {
        latitude: coordinates[midIndex][1],
        longitude: coordinates[midIndex][0]
      };

      //console.log('편의점 검색 중심점:', midPoint);

      const response = await fetch(
        `https://dapi.kakao.com/v2/local/search/category.json?category_group_code=CS2&x=${midPoint.longitude}&y=${midPoint.latitude}&radius=1000&size=15`,
        {
          headers: {
            Authorization: `KakaoAK ${process.env.KAKAO_REST_API_KEY}`
          }
        }
      );

      if (!response.ok) {
        throw new Error(`편의점 데이터 가져오기 실패: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.documents) {
        throw new Error('유효하지 않은 데이터 형식');
      }

      const stores = data.documents.map(store => ({
        name: store.place_name,
        latitude: parseFloat(store.y),
        longitude: parseFloat(store.x),
        address: store.road_address_name || store.address_name,
        distance: parseFloat(store.distance)
      }));

      /*console.log('편의점 데이터 처리 완료:', {
        count: stores.length,
        sample: stores[0]
      });
*/
      return stores;

    } catch (error) {
      console.error('편의점 데이터 요청 실패:', error);
      return [];
    }
  }
};

module.exports = storeService;

