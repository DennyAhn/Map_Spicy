/* global naver */

class MarkerService {
  constructor() {
    this.markers = new Map(); // 카테고리별 마커 저장
    this.activeInfoWindow = null; // 현재 열린 정보창 저장
    this.infoWindows = new Map(); // 마커별 정보창 캐시
    this.clickTimeout = null; // 클릭 디바운스를 위한 타이머
    this.addressCache = new Map(); // 주소 캐시 추가
  }

  // 마커 추가/제거 토글 메서드
  toggleMarkers(mapInstance, places, category) {
    // 디바운스 처리
    if (this.toggleTimeout) {
      clearTimeout(this.toggleTimeout);
    }

    return new Promise((resolve) => {
      this.toggleTimeout = setTimeout(() => {
        console.log(`마커 토글: ${category}, 장소 수: ${places.length}`);
        
        // 이미 해당 카테고리의 마커가 있다면 모두 제거
        if (this.markers.has(category)) {
          console.log(`기존 마커 제거: ${category}`);
          const markers = this.markers.get(category);
          
          // 한 번에 모든 마커와 정보창 제거
          if (this.activeInfoWindow) {
            this.activeInfoWindow.close();
            this.activeInfoWindow = null;
          }

          // 마커 일괄 제거
          markers.forEach(marker => {
            this.infoWindows.delete(marker);
            marker.setMap(null);
          });

          this.markers.delete(category);
        }

        // 새로운 마커 일괄 생성 및 추가
        console.log(`새 마커 생성: ${category}, 장소 수: ${places.length}`);
        const newMarkers = places.map(place => {
          const marker = this.createMarker(mapInstance, place, category);
          const infoWindow = this.createInfoWindow(mapInstance, place, category);
          this.infoWindows.set(marker, infoWindow);
          this.addMarkerClickEvent(marker, infoWindow, mapInstance);
          return marker;
        });

        // 마커 일괄 추가
        this.markers.set(category, newMarkers);
        console.log(`마커 토글 완료: ${category}, 생성된 마커 수: ${newMarkers.length}`);
        resolve(true);
      }, 10); // 디바운스 시간을 10ms로 줄임
    });
  }

  // 마커 생성 메서드
  createMarker(mapInstance, place, category) {
    return new naver.maps.Marker({
      position: new naver.maps.LatLng(place.latitude, place.longitude),
      map: mapInstance,
      title: place.name,
      icon: {
        content: this.createMarkerContent(category),
        size: new naver.maps.Size(24, 24),
        anchor: new naver.maps.Point(12, 12)
      }
    });
  }

  // 정보창 생성 메서드
  createInfoWindow(mapInstance, place, category) {
    const uniqueId = `place-info-${place.latitude}-${place.longitude}`.replace(/\./g, '-');
    
    const infoWindow = new naver.maps.InfoWindow({
      content: `
        <div style="
          position: relative;
          padding: 10px 10px 12px 10px;
          min-width: 120px;
          max-width: 150px;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          font-family: 'Noto Sans KR', sans-serif;
          background-color: white;
          border: none;
          font-size: 11px;
          margin-bottom: 12px;
          
        ">
          <div class="close-btn" style="
            position: absolute;
            top: 4px;
            right: 4px;
            width: 18px;
            height: 18px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            font-size: 14px;
            color: #aaa;
            border-radius: 50%;
            background-color: #f8f8f8;
            line-height: 1;
            z-index: 1;
            transition: all 0.2s ease;
          ">&times;</div>
          <div style="
            position: absolute;
            bottom: -10px;
            left: 50%;
            transform: translateX(-50%);
            width: 0;
            height: 0;
            border-left: 10px solid transparent;
            border-right: 10px solid transparent;
            border-top: 10px solid white;
            filter: drop-shadow(0 4px 3px rgba(0,0,0,0.1));
          "></div>
          <h3 style="
            margin: 0 0 8px 0;
            padding-right: 15px;
            font-size: 13px;
            font-weight: 600;
            color: #333;
            border-bottom: 1px solid #f0f0f0;
            padding-bottom: 8px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          ">${place.name || category}</h3>
          <div id="${uniqueId}" style="
            font-size: 11px;
            color: #666;
            line-height: 1.4;
            max-height: 100px;
            overflow-y: auto;
          ">
            <div class="loading-indicator" style="
              text-align: center;
              color: #999;
              padding: 4px 0;
              font-size: 10px;
            ">정보를 불러오는 중...</div>
          </div>
        </div>
      `,
      borderWidth: 0,
      disableAnchor: true,
      backgroundColor: 'transparent',
      borderColor: 'transparent',
      pixelOffset: new naver.maps.Point(0, -45),
      zIndex: 100,
      closeButton: false
    });

    // 닫기 버튼 이벤트 추가
    naver.maps.Event.addListener(infoWindow, 'domready', () => {
      const closeButtons = document.getElementsByClassName('close-btn');
      if (closeButtons && closeButtons.length > 0) {
        const closeBtn = closeButtons[closeButtons.length - 1]; // 가장 최근에 생성된 버튼
        closeBtn.addEventListener('click', () => {
          infoWindow.close();
          this.activeInfoWindow = null;
        });
      }
    });

    // 지도 줌 레벨에 따른 정보창 크기 조절
    naver.maps.Event.addListener(mapInstance, 'zoom_changed', () => {
      const zoom = mapInstance.getZoom();
      const infoElement = document.getElementById(uniqueId);
      if (infoElement) {
        // 성능 최적화를 위한 디바운스 추가
        if (this.zoomTimeout) {
          clearTimeout(this.zoomTimeout);
        }
        this.zoomTimeout = setTimeout(() => {
          if (zoom <= 13) {
            infoElement.style.fontSize = '10px';
            infoElement.parentElement.style.minWidth = '100px';
            infoElement.parentElement.style.maxWidth = '130px';
          } else if (zoom <= 15) {
            infoElement.style.fontSize = '11px';
            infoElement.parentElement.style.minWidth = '120px';
            infoElement.parentElement.style.maxWidth = '150px';
          } else {
            infoElement.style.fontSize = '11px';
            infoElement.parentElement.style.minWidth = '130px';
            infoElement.parentElement.style.maxWidth = '160px';
          }
        }, 100);
      }
    });

    // 기존 주소 정보 비동기 로드 로직 유지
    naver.maps.Event.addListener(infoWindow, 'open', () => {
      this.loadKoreanAddress(place.latitude, place.longitude).then(address => {
        const infoContent = document.getElementById(uniqueId);
        if (infoContent) {
          infoContent.innerHTML = this.getKoreanPlaceInfo(category, place, address);
        }
      });
    });

    return infoWindow;
  }

  // 마커 클릭 이벤트 추가 메서드
  addMarkerClickEvent(marker, infoWindow, mapInstance) {
    let clickCount = 0;
    let clickTimer = null;

    naver.maps.Event.addListener(marker, 'click', () => {
      clickCount++;
      
      if (clickTimer) {
        clearTimeout(clickTimer);
      }

      clickTimer = setTimeout(() => {
        if (clickCount === 1) {
          // 단일 클릭
          if (this.activeInfoWindow === infoWindow) {
            infoWindow.close();
            this.activeInfoWindow = null;
          } else {
            if (this.activeInfoWindow) {
              this.activeInfoWindow.close();
            }
            infoWindow.open(mapInstance, marker);
            this.activeInfoWindow = infoWindow;
          }
        }
        clickCount = 0;
      }, 200);
    });
  }

  // 마커 제거 메서드
  removeMarkers(category) {
    console.log(`카테고리 마커 제거 요청: ${category}`);
    
    if (this.markers.has(category)) {
      const markers = this.markers.get(category);
      console.log(`제거할 마커 수: ${markers.length}`);
      
      // 정보창 일괄 제거
      if (this.activeInfoWindow) {
        this.activeInfoWindow.close();
        this.activeInfoWindow = null;
      }

      // 마커 일괄 제거
      markers.forEach(marker => {
        this.infoWindows.delete(marker);
        marker.setMap(null);
      });

      // 맵에서 카테고리 제거
      this.markers.delete(category);
      console.log(`카테고리 마커 제거 완료: ${category}`);
      return true;
    } else {
      console.log(`제거할 마커 없음: ${category}`);
      return false;
    }
  }

  // 모든 마커 제거 메서드
  removeAllMarkers() {
    this.markers.forEach((markers, category) => {
      this.removeMarkers(category);
    });
    this.markers.clear();
    this.infoWindows.clear();
    this.addressCache.clear(); // 캐시 초기화 추가
  }

  // 카테고리별 아이콘 URL 반환
  getCategoryIcon(category) {
    const iconMap = {
      '편의점': '/images/icon/normal/store.png',
      '소방시설': '/images/icon/normal/oneonenine.png',
      '경찰서': '/images/icon/normal/police.png',
      '안전비상벨': '/images/icon/women/siren.png',
      'CCTV': '/images/icon/women/cctv.png',
      '지하철역 엘리베이터': '/images/icon/old/ele.png',
      '심야약국': '/images/icon/old/drugstore.png',
      '휠체어 충전소': '/images/icon/old/charge.png',
      '복지시설': '/images/icon/old/noin.png',
      '외국인 주의구역': '/images/icon/normal/warning.png'
    };

    return iconMap[category] || '/images/default-marker.png';
  }

  // 마커 아이콘 생성 메서드
  createMarkerContent(category) {
    const iconUrl = this.getCategoryIcon(category);

    return `
      <div style="
        width: 24px;
        height: 24px;
        background: url(${iconUrl}) no-repeat center;
        background-size: contain;
      "></div>
    `;
  }

  // 한글 정보 생성 메서드
  getKoreanPlaceInfo(category, place, address) {
    // 핵심 정보만 표시하도록 간소화
    const items = [];
    
    // 거리 정보 추가
    if (place.distance) {
      items.push(`<span style="color: #4285f4; font-weight: 500; display: inline-flex; align-items: center;">
        <svg width="10" height="10" viewBox="0 0 24 24" style="margin-right: 4px;">
          <path fill="#4285f4" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
        </svg>
        ${place.distance}
      </span>`);
    }
    
    // 카테고리별 핵심 정보 추가 (아이콘 포함)
    switch(category) {
      case '편의점': 
        items.push(`<span style="display: inline-flex; align-items: center;">
          <svg width="10" height="10" viewBox="0 0 24 24" style="margin-right: 4px;">
            <path fill="#34a853" d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
          </svg>
          24시간
        </span>`); 
        break;
      case '소방시설': 
        items.push(`<span style="color: #ea4335; font-weight: 700; display: inline-flex; align-items: center;">
          <svg width="10" height="10" viewBox="0 0 24 24" style="margin-right: 4px;">
            <path fill="#ea4335" d="M19.23 15.26l-2.54-.29c-.61-.07-1.21.14-1.64.57l-1.84 1.84c-2.83-1.44-5.15-3.75-6.59-6.59l1.85-1.85c.43-.43.64-1.03.57-1.64l-.29-2.52c-.12-1.01-.97-1.77-1.99-1.77H5.03c-1.13 0-2.07.94-2 2.07.53 8.54 7.36 15.36 15.89 15.89 1.13.07 2.07-.87 2.07-2v-1.73c.01-1.01-.75-1.86-1.76-1.98z"/>
          </svg>
          119
        </span>`); 
        break;
      case '경찰서': 
        items.push(`<span style="color: #4285f4; font-weight: 700; display: inline-flex; align-items: center;">
          <svg width="10" height="10" viewBox="0 0 24 24" style="margin-right: 4px;">
            <path fill="#4285f4" d="M19.23 15.26l-2.54-.29c-.61-.07-1.21.14-1.64.57l-1.84 1.84c-2.83-1.44-5.15-3.75-6.59-6.59l1.85-1.85c.43-.43.64-1.03.57-1.64l-.29-2.52c-.12-1.01-.97-1.77-1.99-1.77H5.03c-1.13 0-2.07.94-2 2.07.53 8.54 7.36 15.36 15.89 15.89 1.13.07 2.07-.87 2.07-2v-1.73c.01-1.01-.75-1.86-1.76-1.98z"/>
          </svg>
          112
        </span>`); 
        break;
      case '안전비상벨': 
        items.push(`<span style="color: #34a853; display: inline-flex; align-items: center;">
          <svg width="10" height="10" viewBox="0 0 24 24" style="margin-right: 4px;">
            <path fill="#34a853" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
          사용가능
        </span>`); 
        break;
      case 'CCTV': 
        items.push(`<span style="color: #34a853; display: inline-flex; align-items: center;">
          <svg width="10" height="10" viewBox="0 0 24 24" style="margin-right: 4px;">
            <path fill="#34a853" d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
          </svg>
          24시간
        </span>`); 
        break;
      case '지하철역 엘리베이터': 
        items.push(`<span style="display: inline-flex; align-items: center;">
          <svg width="10" height="10" viewBox="0 0 24 24" style="margin-right: 4px;">
            <path fill="#fbbc05" d="M7 2l4 4H8v3H6V6H3l4-4zm10 16l-4-4h3v-3h2v3h3l-4 4zm-2-5V9h-2v4h2zm-4-4V5H9v4h2zm0 6v4h2v-4h-2zm-4 0v4h2v-4H7z"/>
          </svg>
          상세 정보 제공 준비 중
        </span>`); 
        break;
      case '심야약국': 
        items.push(`<span style="display: inline-flex; align-items: center;">
          <svg width="10" height="10" viewBox="0 0 24 24" style="margin-right: 4px;">
            <path fill="#ea4335" d="M6 3h12v2H6zm11 3H7c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-1 9h-2.5v2.5h-3V15H8v-3h2.5V9.5h3V12H16v3z"/>
          </svg>
          야간운영
        </span>`); 
        break;
      case '외국인 주의구역': 
        items.push(`<span style="color: #ea4335; display: inline-flex; align-items: center;">
          <svg width="10" height="10" viewBox="0 0 24 24" style="margin-right: 4px;">
            <path fill="#ea4335" d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
          </svg>
          상세 정보 제공 준비 중
        </span>`); 
        break;
    }
    
    // 주소 간소화 추가
    if (address && address !== '주소 정보를 불러올 수 없습니다.') {
      const shortAddress = this.getShortAddress(address);
      items.push(`<span style="color: #666; display: inline-flex; align-items: center;">
        <svg width="10" height="10" viewBox="0 0 24 24" style="margin-right: 4px;">
          <path fill="#666" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zM7 9c0-2.76 2.24-5 5-5s5 2.24 5 5c0 2.88-2.88 7.19-5 9.88C9.92 16.21 7 11.85 7 9z"/>
          <circle cx="12" cy="9" r="2.5" fill="#666"/>
        </svg>
        ${shortAddress}
      </span>`);
    }
    
    // 전화번호 추가 (긴급전화번호가 있는 카테고리는 제외)
    if (place.phone && place.phone !== '' && category !== '소방시설' && category !== '경찰서') {
      
      const phone = place.phone.length > 13 ? place.phone.substring(0, 13) + '...' : place.phone;
      items.push(`<span style="color: #666; display: inline-flex; align-items: center;">
        <svg width="10" height="10" viewBox="0 0 24 24" style="margin-right: 4px;">
          <path fill="#666" d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56-.35-.12-.74-.03-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z"/>
        </svg>
        ${phone}
      </span>`);
    }
    
    // 정보 표시
    let info = '';
    if (items.length > 0) {
      info = `
        <div style="
          display: flex;
          flex-direction: column;
          gap: 6px;
          font-size: 10px;
          padding: 2px 0;
        ">
          ${items.map(item => 
            `<div style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${item}</div>`
          ).join('')}
        </div>
      `;
    } else {
      // 정보가 없을 경우 간단한 메시지
      info = `<div style="text-align: center; color: #888; font-size: 10px; padding: 4px 0;">상세 정보 제공 준비 중</div>`;
    }
    
    return info;
  }

  // 주소 축약 메서드 추가
  getShortAddress(address) {
    // 시/군/구 혹은 동/면 단위까지만 표시
    const matches = address.match(/([가-힣]+시[가-힣]*구?[가-힣]*동?)|([가-힣]+(동|면|읍))/);
    if (matches && matches[0]) {
      return matches[0];
    }
    // 축약할 수 없는 경우 20자까지만 표시
    return address.length > 20 ? address.substring(0, 20) + '...' : address;
  }

  // 주소 로드 메서드 개선
  async loadKoreanAddress(latitude, longitude) {
    const cacheKey = `${latitude},${longitude}`;
    
    if (this.addressCache.has(cacheKey)) {
      const cachedAddress = this.addressCache.get(cacheKey);
      // 캐시된 주소가 오류 상태면 null 반환
      if (cachedAddress === '주소 정보를 불러올 수 없습니다.') {
        return null;
      }
      return cachedAddress;
    }

    try {
      // 5초 타임아웃 설정
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(
        `/api/geocode?latitude=${latitude}&longitude=${longitude}`,
        { signal: controller.signal }
      );
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error('주소 변환 API 응답 오류');
      }

      const data = await response.json();
      if (data && data.address) {
        this.addressCache.set(cacheKey, data.address);
        return data.address;
      }
      
      // 주소가 없는 경우 null 캐싱 후 null 반환
      this.addressCache.set(cacheKey, '주소 정보를 불러올 수 없습니다.');
      return null;
    } catch (error) {
      console.error('주소 변환 오류:', error);
      // 오류 상태 캐싱 후 null 반환
      this.addressCache.set(cacheKey, '주소 정보를 불러올 수 없습니다.');
      return null;
    }
  }
}

export default MarkerService;