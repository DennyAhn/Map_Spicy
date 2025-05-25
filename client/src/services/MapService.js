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
    this.locationTrackingMode = 'None'; // 위치 추적 모드 상태 추가
    this.heading = 0; // 현재 방향 (0도는 북쪽)
    
    // 방향 감지 이벤트 리스너 설정
    this.setupOrientationListener();
     
    // 현재 위치 마커 아이콘 정의 - 방향성을 포함한 아이콘으로 변경
    this.updateDirectionalIcon();

    naver.maps.Event.addListener(this.mapInstance, 'zoom_changed', () => {
      const zoomLevel = this.mapInstance.getZoom();
      console.log('Current zoom level:', zoomLevel);
    });

    // 지도 이동 시 이벤트 - 추적 모드가 활성화된 경우 NoFollow 모드로 변경
    naver.maps.Event.addListener(this.mapInstance, 'dragend', () => {
      if (this.locationTrackingMode === 'Follow') {
        this.setLocationTrackingMode('NoFollow');
      }
    });

    // 초기 위치 설정 - 점진적 접근법 사용
    this.initializeLocation(initialPosition);
  }
  
  // 방향 감지 이벤트 리스너 설정 함수
  setupOrientationListener() {
    // DeviceOrientationEvent 지원 확인
    if (window.DeviceOrientationEvent) {
      // iOS 13+ 에서는 권한 요청이 필요
      if (typeof DeviceOrientationEvent.requestPermission === 'function') {
        // 사용자 제스처(클릭 등)에 의해 호출되어야 하므로 여기서는 설정만 해둠
        console.log('iOS 13+ 디바이스 감지됨, 사용자 제스처 필요');
      } else {
        // 권한 요청이 필요 없는 브라우저
        window.addEventListener('deviceorientation', this.handleOrientation.bind(this));
      }
    } else {
      console.log('이 브라우저는 방향 감지를 지원하지 않습니다.');
    }
  }
  
  // iOS 13+ 디바이스에서 방향 권한 요청
  requestOrientationPermission() {
    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
      DeviceOrientationEvent.requestPermission()
        .then(permissionState => {
          if (permissionState === 'granted') {
            window.addEventListener('deviceorientation', this.handleOrientation.bind(this));
          } else {
            console.log('방향 감지 권한이 거부되었습니다.');
          }
        })
        .catch(console.error);
    }
  }
  
  // 방향 변경 이벤트 핸들러
  handleOrientation(event) {
    // alpha: 0도는 북쪽, 90도는 동쪽, 180도는 남쪽, 270도는 서쪽
    if (event.alpha !== null) {
      // 방향 값이 크게 변경될 때만 마커 업데이트 (성능 최적화)
      const newHeading = event.alpha;
      if (Math.abs(this.heading - newHeading) > 10) {
        this.heading = newHeading;
        this.updateDirectionalIcon();
        
        // 현재 마커가 있는 경우 아이콘 업데이트
        if (this.currentLocationMarker) {
          this.currentLocationMarker.setIcon(this.currentLocationIcon);
        }
      }
    }
  }
  
  // 방향성 있는 아이콘 업데이트
  updateDirectionalIcon() {
    // 마커 크기를 최초 크기로 복원
    const imageSize = 16; // 최초 크기로 복원
    const arrowColor = '#4285F4'; // 화살표 색상
    
    // 마커 아이콘 설정 - 마커는 작게, 방향 표시기는 적당하게
    this.currentLocationIcon = {
      content: `<div style="
        position: relative;
        width: ${imageSize}px;
        height: ${imageSize}px;
      ">
        <!-- 기존 사용자 이미지 -->
        <img src="/images/RouteSelectionScreen/user.png" style="
          width: 100%;
          height: 100%;
        " />
        
        <!-- 화살표 크기 조정 (회전) -->
        <div style="
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          transform: rotate(${this.heading}deg);
          pointer-events: none;
        ">
          <div style="
            position: absolute;
            width: 0;
            height: 0;
            border-left: 4px solid transparent;
            border-right: 4px solid transparent;
            border-bottom: 8px solid ${arrowColor};
            top: -8px;
            left: calc(50% - 4px);
          "></div>
        </div>
      </div>`,
      anchor: new naver.maps.Point(imageSize/2, imageSize/2)
    };
  }
  
  // 위치 추적 모드 설정 함수 추가
  setLocationTrackingMode(mode) {
    if (!['None', 'NoFollow', 'Follow'].includes(mode)) {
      console.error('잘못된 위치 추적 모드:', mode);
      return;
    }
    
    console.log(`위치 추적 모드 변경: ${this.locationTrackingMode} -> ${mode}`);
    this.locationTrackingMode = mode;
    
    switch (mode) {
      case 'None':
        // 위치 추적 비활성화
        if (this.watchPositionId) {
          navigator.geolocation.clearWatch(this.watchPositionId);
          this.watchPositionId = null;
        }
        break;
        
      case 'NoFollow':
        // 위치 추적 활성화 (지도는 움직이지 않음)
        this.startPositionTracking(false);
        break;
        
      case 'Follow':
        // 위치 추적 활성화 및 지도 이동
        this.startPositionTracking(true);
        break;
    }
  }
  
  // 위치 추적 시작 함수
  startPositionTracking(moveMap) {
    // 이미 위치 추적 중이면 기존 추적 중단
    if (this.watchPositionId) {
      navigator.geolocation.clearWatch(this.watchPositionId);
      this.watchPositionId = null;
    }
    
    if (!navigator.geolocation) {
      console.error('이 브라우저는 위치 정보를 지원하지 않습니다.');
      return;
    }
    
    this.watchPositionId = navigator.geolocation.watchPosition(
      (position) => {
        const coords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        };
        
        // 방향 정보가 있는 경우 방향을 감지하는 부분
        if (position.coords.heading !== null && position.coords.heading !== undefined) {
          this.heading = position.coords.heading;
          this.updateDirectionalIcon();
        }
        
        this.updateCurrentLocation(coords);
        
        // Follow 모드인 경우 지도도 같이 이동 (단순화된 방식으로 변경)
        if (moveMap && this.locationTrackingMode === 'Follow') {
          // panToLocation 대신 직접 setCenter 사용
          const pos = new naver.maps.LatLng(coords.latitude, coords.longitude);
          this.mapInstance.setCenter(pos);
        }
      },
      (error) => {
        console.error('위치 추적 오류:', error);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 10000
      }
    );
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
    
    // 항상 최신 방향이 적용된 아이콘을 사용하도록 업데이트
    this.updateDirectionalIcon();
    
    if (!this.currentLocationMarker) {
      this.currentLocationMarker = new naver.maps.Marker({
        position: position,
        map: this.mapInstance,
        icon: this.currentLocationIcon,
        zIndex: 100
      });
    } else {
      this.currentLocationMarker.setPosition(position);
      this.currentLocationMarker.setIcon(this.currentLocationIcon);
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

    // 애니메이션 없이 즉시 이동하도록 수정
    this.mapInstance.setCenter(currentPosition);

    if (this.currentLocationMarker) {
      this.currentLocationMarker.setMap(null);
    }

    // 항상 최신 방향이 적용된 아이콘을 사용하도록 업데이트
    this.updateDirectionalIcon();
    
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
      
      // 애니메이션 옵션을 제거하고 단순하게 setCenter만 사용합니다
      this.mapInstance.setCenter(position);
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
      
      // 애니메이션 없이 즉시 이동하도록 수정
      this.mapInstance.setCenter(position);
      this.mapInstance.setZoom(17, false); // 애니메이션 비활성화
      
      // 위치 추적 모드를 Follow로 설정
      this.setLocationTrackingMode('Follow');
    }
    
    // 2. 새로운 위치 정보 얻기 시도 (점진적 접근)
    console.log('현재 위치 갱신 시도...');
    
    // 저정밀 빠른 위치 획득
    this.tryGetCurrentPosition(false)
      .then(position => {
        if (position) {
          this.updateCurrentLocation(position);
          
          // 애니메이션 없이 이동하도록 수정
          const posLatLng = new naver.maps.LatLng(position.latitude, position.longitude);
          this.mapInstance.setCenter(posLatLng);
          
          // 위치 추적 모드를 Follow로 설정
          this.setLocationTrackingMode('Follow');
        }
        
        // 고정밀 위치 획득 시도
        return this.tryGetCurrentPosition(true);
      })
      .then(position => {
        if (position) {
          this.updateCurrentLocation(position);
          
          // 애니메이션 없이 이동하도록 수정
          const posLatLng = new naver.maps.LatLng(position.latitude, position.longitude);
          this.mapInstance.setCenter(posLatLng);
          
          console.log('정확한 현재 위치로 이동했습니다.');
          
          // 위치 추적 모드를 Follow로 설정
          this.setLocationTrackingMode('Follow');
        } else if (!this.lastKnownPosition) {
          // 모든 위치 획득 시도가 실패하고 저장된 위치도 없는 경우 대구 좌표 사용
          const defaultPosition = {
            latitude: 35.8714,
            longitude: 128.6014
          };
          console.log('현재 위치 획득 실패, 대구 좌표로 이동합니다:', defaultPosition);
          this.lastKnownPosition = defaultPosition;
          this.updateCurrentLocation(defaultPosition);
          
          // 애니메이션 없이 이동하도록 수정
          const defaultLatLng = new naver.maps.LatLng(defaultPosition.latitude, defaultPosition.longitude);
          this.mapInstance.setCenter(defaultLatLng);
          
          this.saveLocation(defaultPosition);
          
          // 위치 추적 모드를 NoFollow로 설정 (기본 위치로는 추적이 불가능하므로)
          this.setLocationTrackingMode('NoFollow');
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
          
          // 애니메이션 없이 이동하도록 수정
          const defaultLatLng = new naver.maps.LatLng(defaultPosition.latitude, defaultPosition.longitude);
          this.mapInstance.setCenter(defaultLatLng);
          
          this.saveLocation(defaultPosition);
          
          // 위치 추적 모드를 NoFollow로 설정 (기본 위치로는 추적이 불가능하므로)
          this.setLocationTrackingMode('NoFollow');
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

  // 현재 위치 추적 모드 상태 반환하는 함수 추가
  getLocationTrackingMode() {
    return this.locationTrackingMode;
  }
  
  // 지도 강제 새로고침 함수 추가
  refresh(clearCache = true) {
    console.log('지도 강제 새로고침 실행');
    
    // 캐시 초기화 (네이버 지도 API에서 지원하는 경우)
    if (clearCache && naver.maps.Cache) {
      naver.maps.Cache.clear();
    }
    
    // 지도 타일 강제 재로드
    if (this.mapInstance) {
      const center = this.mapInstance.getCenter();
      const zoom = this.mapInstance.getZoom();
      
      // 약간의 지연 시간을 두고 실행하여 DOM 업데이트 보장
      setTimeout(() => {
        // 지도 약간 이동 후 원위치 (강제 타일 리로드 트리거)
        this.mapInstance.setCenter(new naver.maps.LatLng(
          center.lat() + 0.0001, 
          center.lng() + 0.0001
        ));
        
        setTimeout(() => {
          // 원래 위치로 복귀
          this.mapInstance.setCenter(center);
          this.mapInstance.setZoom(zoom);
        }, 100);
      }, 100);
    }
  }
}

export default MapService;