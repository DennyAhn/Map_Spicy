const createDirectionalMarker = (position) => {
  // 방향성을 나타내는 마커 이미지 (화살표 모양의 이미지를 사용하는 것이 좋습니다)
  const markerImage = new kakao.maps.MarkerImage(
    '/images/map/direction_marker.png', // 방향성을 나타내는 마커 이미지 경로
    new kakao.maps.Size(24, 24),
    {
      offset: new kakao.maps.Point(12, 12) // 이미지 중심점
    }
  );
  
  // 방향성 마커 생성
  const marker = new kakao.maps.Marker({
    position: position,
    image: markerImage,
    map: map
  });
  
  return marker;
};

// 방향 업데이트 함수
const updateMarkerDirection = (marker, heading) => {
  if (!marker) return;
  
  // 마커 엘리먼트 가져오기
  const markerElement = marker.getElement();
  if (markerElement) {
    // CSS transform을 사용하여 마커 회전
    markerElement.style.transform = `rotate(${heading}deg)`;
  }
};

// 방향 이벤트 리스너 설정
const setupOrientationListener = (marker) => {
  if (window.DeviceOrientationEvent) {
    window.addEventListener('deviceorientation', (event) => {
      // alpha: 나침반 방향 (0-360)
      if (event.alpha !== null) {
        // iOS에서는 webkitCompassHeading 사용
        const heading = event.webkitCompassHeading || 360 - event.alpha;
        updateMarkerDirection(marker, heading);
      }
    }, false);
    
    // 권한 요청 (iOS 13+ 필요)
    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
      // 사용자 상호작용(예: 버튼 클릭) 이후에 호출해야 함
      document.getElementById('enableOrientation').addEventListener('click', async () => {
        try {
          const permission = await DeviceOrientationEvent.requestPermission();
          if (permission === 'granted') {
            console.log('방향 센서 권한 획득 성공');
          } else {
            console.error('방향 센서 권한 획득 실패');
          }
        } catch (error) {
          console.error('권한 요청 오류:', error);
        }
      });
    }
  } else {
    console.log('이 기기는 방향 센서를 지원하지 않습니다.');
  }
};

// 현재 위치 설정 함수 내부에 다음 코드 추가 (기존 마커 생성 코드 대체)
// 예: setCurrentPosition 함수나 현재 위치를 설정하는 함수 내에 추가
const currentPositionMarker = createDirectionalMarker(new kakao.maps.LatLng(latitude, longitude));
setupOrientationListener(currentPositionMarker); 