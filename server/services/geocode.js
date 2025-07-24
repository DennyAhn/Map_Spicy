const fetch = require('node-fetch');

class GeocodeService {
  async getAddress(req, res) {
    const { latitude, longitude } = req.query;
    
    try {
      const response = await fetch(
        `https://naveropenapi.apigw.ntruss.com/map-reversegeocode/v2/gc?coords=${longitude},${latitude}&output=json&orders=roadaddr,addr`,
        {
          headers: {
            'X-NCP-APIGW-API-KEY-ID': process.env.NAVER_CLIENT_ID,
            'X-NCP-APIGW-API-KEY': process.env.NAVER_CLIENT_SECRET
          }
        }
      );

      const data = await response.json();
      
      if (data.status.code === 0 && data.results && data.results.length > 0) {
        const result = data.results[0];
        let address = '';

        // 도로명 주소가 있는 경우
        if (result.land) {
          address = result.land.addition0.value + ' ' +
                   result.land.name + ' ' +
                   (result.land.number1 || '') +
                   (result.land.number2 ? '-' + result.land.number2 : '');
        } 
        // 지번 주소
        else {
          address = result.region.area1.name + ' ' + 
                   result.region.area2.name + ' ' + 
                   result.region.area3.name + ' ' + 
                   (result.region.area4.name || '') +
                   (result.land?.number1 ? ' ' + result.land.number1 : '') +
                   (result.land?.number2 ? '-' + result.land.number2 : '');
        }
        
        res.json({ address });
      } else {
        res.status(404).json({ error: '주소를 찾을 수 없습니다.' });
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      res.status(500).json({ error: '주소 변환 중 오류가 발생했습니다.' });
    }
  }
}

module.exports = new GeocodeService();
