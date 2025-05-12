/* global naver */

class MapService {
  constructor(mapElement, initialPosition = null) {
    if (!window.naver || !window.naver.maps) {
      throw new Error('Naver Maps API가 로드되지 않았습니다.');
    }
    
    // 마지막 세션에서 저장된 위치가 있는지 확인
    const savedLocation = this.getSavedLocation();
    const defaultLocation = initialPosition || savedLocation;
    
    this.mapInstance = new naver.maps.Map(mapElement, {
      center: defaultLocation 
        ? new naver.maps.LatLng(defaultLocation.latitude, defaultLocation.longitude)
        : new naver.maps.LatLng(35.8714, 128.6014), // 대구 중앙 좌표로 설정
      zoom: 14,
      zoomControl: false,
      smoothZoom: true,
      zoomDuration: 200,
      transition: true,
      transitionDuration: 1000,
    });
    this.currentLocationMarker = null;
    this.lastKnownPosition = defaultLocation;
    this.isLocating = false;
     
    // 현재 위치 마커 아이콘 정의
    this.currentLocationIcon = {
      content: `<img src="/images/RouteSelectionScreen/user.png" style="width: 16px; height: 16px;" />`,
      anchor: new naver.maps.Point(8, 8)
    };

    /** 이미지 + 효과 추가
    this.currentLocationIcon = {
      content: `
        <div style="position: relative; width: 40px; height: 40px;">
          <!-- 외부 원 (퍼짐 효과) -->
          <div style="
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 24px;
            height: 24px;
            background: rgba(89, 123, 235, 0.2);
            border-radius: 50%;
            animation: pulse 2s infinite;
          "></div>

          <!-- 내부 아이콘 (이미지) -->
          <img src="/images/RouteSelectionScreen/user.png" style="
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 16px;
            height: 16px;
            z-index: 1;
          " />
        </div>

        <style>
          @keyframes pulse {
            0% {
              transform: translate(-50%, -50%) scale(1);
              opacity: 1;
            }
            100% {
              transform: translate(-50%, -50%) scale(2);
              opacity: 0;
            }
          }
        </style>
      `,
      anchor: new naver.maps.Point(8, 8)
    };
    */

    naver.maps.Event.addListener(this.mapInstance, 'zoom_changed', () => {
      const zoomLevel = this.mapInstance.getZoom();
      console.log('Current zoom level:', zoomLevel);
    });

    // 초기 위치 설정 - 점진적 접근법 사용
    this.initializeLocation(initialPosition);
  }
  
  // 위치 초기화 함수 - 점진적 접근 (단계별 폴백)
  async initializeLocation(initialPosition) {
    if (initialPosition) {
      // 1. 파라미터로 전달된 초기 위치가 있으면 그것을 사용
      this.lastKnownPosition = initialPosition;
      this.setCurrentLocation(initialPosition);
      this.saveLocation(initialPosition);
      return;
    }
    
    if (this.lastKnownPosition) {
      // 2. 저장된 위치가 있으면 임시로 사용
      this.setCurrentLocation(this.lastKnownPosition);
    }
    
    // 3. 저정밀 옵션으로 빠르게 위치 얻기 시도
    this.tryGetCurrentPosition(false)
      .then(position => {
        if (position) {
          console.log('저정밀 위치 획득 성공:', position);
          this.lastKnownPosition = position;
          this.setCurrentLocation(position);
          this.saveLocation(position);
        }
        
        // 4. 고정밀 위치 얻기 시도 (시간이 더 걸릴 수 있음)
        return this.tryGetCurrentPosition(true);
      })
      .then(position => {
        if (position) {
          console.log('고정밀 위치 획득 성공:', position);
          this.lastKnownPosition = position;
          this.setCurrentLocation(position);
          this.saveLocation(position);
        } else if (!this.lastKnownPosition) {
          // 모든 위치 획득 시도가 실패하고 저장된 위치도 없는 경우 대구 좌표 사용
          const defaultPosition = {
            latitude: 35.8714,
            longitude: 128.6014
          };
          console.log('위치 획득 실패, 대구 좌표로 초기화합니다:', defaultPosition);
          this.lastKnownPosition = defaultPosition;
          this.setCurrentLocation(defaultPosition);
          this.saveLocation(defaultPosition);
        }
      })
      .catch(error => {
        console.error('위치 초기화 중 오류:', error);
        if (!this.lastKnownPosition) {
          // 에러 발생 시 대구 좌표 사용
          const defaultPosition = {
            latitude: 35.8714,
            longitude: 128.6014
          };
          console.log('위치 획득 오류, 대구 좌표로 초기화합니다:', defaultPosition);
          this.lastKnownPosition = defaultPosition;
          this.setCurrentLocation(defaultPosition);
          this.saveLocation(defaultPosition);
        }
      });
  }
  
  // 현재 위치 얻기 시도 (프로미스 반환)
  tryGetCurrentPosition(highAccuracy) {
    if (!navigator.geolocation) {
      return Promise.reject(new Error('이 브라우저는 위치 정보를 지원하지 않습니다.'));
    }
    
    // 이미 위치 확인 중이면 중복 실행 방지
    if (this.isLocating) {
      return Promise.resolve(null);
    }
    
    this.isLocating = true;
    
    return new Promise((resolve, reject) => {
      const options = {
        enableHighAccuracy: highAccuracy,
        timeout: highAccuracy ? 15000 : 5000, // 고정밀 모드는 더 긴 타임아웃
        maximumAge: highAccuracy ? 0 : 60000 // 고정밀 모드는 캐시 사용 안 함
      };
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.isLocating = false;
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          this.isLocating = false;
          
          // 타임아웃은 정상적인 상황일 수 있으므로 reject하지 않고 null 반환
          if (error.code === error.TIMEOUT) {
            console.log(`위치 정보 타임아웃 (${highAccuracy ? '고정밀' : '저정밀'} 모드)`);
            resolve(null);
            return;
          }
          
          // 오류 정보 로깅
          console.error('위치 정보 획득 실패:', error);
          switch(error.code) {
            case error.PERMISSION_DENIED:
              console.error('사용자가 위치 정보 요청을 거부했습니다.');
              break;
            case error.POSITION_UNAVAILABLE:
              console.error('위치 정보를 사용할 수 없습니다.');
              break;
          }
          
          // 권한 거부는 사용자의 명시적 선택이므로 reject
          if (error.code === error.PERMISSION_DENIED) {
            reject(error);
          } else {
            resolve(null); // 그 외 오류는 null 반환으로 처리
          }
        },
        options
      );
    });
  }
  
  // 위치 정보 저장 (세션 스토리지 사용)
  saveLocation(position) {
    if (!position) return;
    try {
      sessionStorage.setItem('lastKnownLocation', JSON.stringify({
        latitude: position.latitude,
        longitude: position.longitude,
        timestamp: Date.now()
      }));
    } catch (e) {
      console.error('위치 정보 저장 실패:', e);
    }
  }
  
  // 저장된 위치 정보 불러오기
  getSavedLocation() {
    try {
      const saved = sessionStorage.getItem('lastKnownLocation');
      if (!saved) return null;
      
      const location = JSON.parse(saved);
      // 1시간 이상 지난 데이터는 무시
      if (Date.now() - location.timestamp > 3600000) {
        sessionStorage.removeItem('lastKnownLocation');
        return null;
      }
      
      return {
        latitude: location.latitude,
        longitude: location.longitude
      };
    } catch (e) {
      console.error('저장된 위치 정보 불러오기 실패:', e);
      return null;
    }
  }

  getMapInstance() {
    return this.mapInstance;
  }

  updateCurrentLocation(coords) {
    if (!coords) return;
    
    const position = new naver.maps.LatLng(coords.latitude, coords.longitude);
    
    if (!this.currentLocationMarker) {
      this.currentLocationMarker = new naver.maps.Marker({
        position: position,
        map: this.mapInstance,
        icon: this.currentLocationIcon,
        zIndex: 100
      });
    } else {
      this.currentLocationMarker.setPosition(position);
    }
    
    // 위치 정보 업데이트 시 저장
    this.lastKnownPosition = coords;
    this.saveLocation(coords);
  }

  setCurrentLocation(coords) {
    if (!coords) return;
    
    this.lastKnownPosition = coords;
    const currentPosition = new naver.maps.LatLng(
      coords.latitude,
      coords.longitude
    );

    this.mapInstance.setCenter(currentPosition);

    if (this.currentLocationMarker) {
      this.currentLocationMarker.setMap(null);
    }

    this.currentLocationMarker = new naver.maps.Marker({
      position: currentPosition,
      map: this.mapInstance,
      icon: this.currentLocationIcon,
      zIndex: 100
    });

    naver.maps.Event.addListener(this.currentLocationMarker, 'click', () => {
      const infoWindow = new naver.maps.InfoWindow({
        content: '<div style="padding: 10px; text-align: center;">현재 위치</div>'
      });
      infoWindow.open(this.mapInstance, this.currentLocationMarker);
    });
  }

  createMarker(position, options) {
    return new naver.maps.Marker({
      position: new naver.maps.LatLng(position.latitude, position.longitude),
      map: this.mapInstance,
      ...options
    });
  }

  panTo(coords, zoomLevel) {
    const position = new naver.maps.LatLng(coords.latitude, coords.longitude);
    this.mapInstance.panTo(position, {
      duration: 500,
      easing: 'easeOutCubic'
    });
    
    // 줌 레벨이 제공된 경우 설정
    if (zoomLevel !== undefined) {
      this.mapInstance.setZoom(zoomLevel, true);
    }
  }

  setZoomLevel(level) {
    this.mapInstance.setZoom(level);
  }

  createPolyline(path, options) {
    return new naver.maps.Polyline({
      path,
      map: this.mapInstance,
      ...options
    });
  }

  fitBounds(coordinates) {
    const bounds = coordinates.reduce(
      (bounds, coord) => bounds.extend(new naver.maps.LatLng(coord[1], coord[0])),
      new naver.maps.LatLngBounds()
    );
    
    this.mapInstance.fitBounds(bounds, {
      top: 50,
      right: 50,
      bottom: 50,
      left: 50,
      duration: 500,
      easing: 'easeOutCubic'
    });
  }

  panToLocation(coords) {
    if (this.mapInstance) {
      const position = new naver.maps.LatLng(coords.latitude, coords.longitude);
      this.mapInstance.panTo(position, {
        duration: 500,
        easing: 'easeInOutCubic'
      });
    }
  }

  setZoom(level, useAnimation = true) {
    if (this.mapInstance) {
      if (useAnimation) {
        this.mapInstance.setZoom(level, true);
      } else {
        this.mapInstance.setZoom(level, false);
      }
    }
  }

  moveToCurrentLocation() {
    // 1. 마지막으로 알고 있는 위치가 있으면 즉시 이동하여 UI 반응성 확보
    if (this.lastKnownPosition) {
      const position = new naver.maps.LatLng(
        this.lastKnownPosition.latitude,
        this.lastKnownPosition.longitude
      );
      this.mapInstance.setCenter(position);
      this.mapInstance.setZoom(17);
    }
    
    // 2. 새로운 위치 정보 얻기 시도 (점진적 접근)
    console.log('현재 위치 갱신 시도...');
    
    // 저정밀 빠른 위치 획득
    this.tryGetCurrentPosition(false)
      .then(position => {
        if (position) {
          this.updateCurrentLocation(position);
          this.mapInstance.setCenter(new naver.maps.LatLng(position.latitude, position.longitude));
        }
        
        // 고정밀 위치 획득 시도
        return this.tryGetCurrentPosition(true);
      })
      .then(position => {
        if (position) {
          this.updateCurrentLocation(position);
          this.mapInstance.setCenter(new naver.maps.LatLng(position.latitude, position.longitude));
          console.log('정확한 현재 위치로 이동했습니다.');
        } else if (!this.lastKnownPosition) {
          // 모든 위치 획득 시도가 실패하고 저장된 위치도 없는 경우 대구 좌표 사용
          const defaultPosition = {
            latitude: 35.8714,
            longitude: 128.6014
          };
          console.log('현재 위치 획득 실패, 대구 좌표로 이동합니다:', defaultPosition);
          this.lastKnownPosition = defaultPosition;
          this.updateCurrentLocation(defaultPosition);
          this.mapInstance.setCenter(new naver.maps.LatLng(defaultPosition.latitude, defaultPosition.longitude));
          this.saveLocation(defaultPosition);
        }
      })
      .catch(error => {
        console.error('현재 위치 이동 중 오류:', error);
        
        // 위치 정보 권한이 거부된 경우 사용자에게 안내
        if (error.code === 1) { // PERMISSION_DENIED
          alert('위치 정보 권한이 필요합니다. 브라우저 설정에서 위치 정보 접근을 허용해주세요.');
        }
        
        // 에러 시 이미 알고 있는 위치가 없으면 대구 좌표 사용
        if (!this.lastKnownPosition) {
          const defaultPosition = {
            latitude: 35.8714,
            longitude: 128.6014
          };
          console.log('현재 위치 획득 오류, 대구 좌표로 이동합니다:', defaultPosition);
          this.lastKnownPosition = defaultPosition;
          this.updateCurrentLocation(defaultPosition);
          this.mapInstance.setCenter(new naver.maps.LatLng(defaultPosition.latitude, defaultPosition.longitude));
          this.saveLocation(defaultPosition);
        }
      });
  }

  // 지도의 현재 중심 위치 가져오기
  getMapCenter() {
    if (!this.mapInstance) return null;
    
    const center = this.mapInstance.getCenter();
    return {
      latitude: center.lat(),
      longitude: center.lng()
    };
  }

  // 현재 사용자 위치 가져오기 (GPS 기반)
  getCurrentLocation() {
    return this.lastKnownPosition;
  }
}

export default MapService;