const foreignAreaService = require('./services/foreignAreaService');
require('dotenv').config();

(async () => {
  console.log('테스트 시작');
  const apiKey = process.env.KAKAO_REST_API_KEY;
  console.log(apiKey);
  // 1. DB에서 address만 조회하여 출력
  const addresses = await foreignAreaService.getForeignAddresses();
  console.log('DB에서 조회된 주소 데이터:', addresses);

  if (addresses.length === 0) {
    console.log('주소 데이터가 없습니다.');
    return;
  }

  // 2. 첫 번째 주소를 이용해 좌표 변환 함수의 동작 확인
  const sampleAddress = addresses[0]; // 첫 번째 주소만 테스트
  const coords = await foreignAreaService.getCoordinatesFromAddress(sampleAddress);
  console.log(`주소 [${sampleAddress}] 의 좌표:`, coords);

  console.log('테스트 종료');
})();
