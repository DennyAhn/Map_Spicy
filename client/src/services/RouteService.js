/* global naver */
import { API_BASE_URL } from '../config/api';

// 🌍 글로벌 캐시 - 컴포넌트 재마운트 시에도 유지
const GLOBAL_ROUTE_CACHE = new Map();

class RouteService {
  constructor(mapInstance) {
    this.mapInstance = mapInstance;
    this.markers = [];
    this.cctvMarkers = [];
    this.pathInstance = null;
    this.pathBorderInstance = null;
    this.storeMarkers = [];
    this.currentInfoWindow = null;
    this.startMarker = null;
    this.endMarker = null;

    // 📦 글로벌 캐시 사용 (컴포넌트 재생성 시에도 보존)
    this.routeCache = GLOBAL_ROUTE_CACHE;
    this.currentRouteKey = null;

    console.log(`🏗️ RouteService 생성 - 기존 캐시 ${this.routeCache.size}개 유지`);

    // 지도 클릭 시 열려있는 정보 창 닫기
    naver.maps.Event.addListener(this.mapInstance, 'click', () => {
      if (this.currentInfoWindow) {
        this.currentInfoWindow.close();
      }
    });
  }

  clearMap() {
    console.log('🧹 지도 정리 시작 - 기존 경로 및 마커 제거');
    
    // 🔥 즉시 DOM에서 제거 - display: none 처리
    const hideElement = (element) => {
      if (element && element.getElement) {
        const domElement = element.getElement();
        if (domElement) {
          domElement.style.display = 'none';
        }
      }
    };
    
    // 경로 라인 즉시 숨김 + 제거
    if (this.pathInstance) {
      hideElement(this.pathInstance);
      this.pathInstance.setMap(null);
      this.pathInstance = null;
    }
    if (this.pathBorderInstance) {
      hideElement(this.pathBorderInstance);
      this.pathBorderInstance.setMap(null);
      this.pathBorderInstance = null;
    }
    
    // 모든 마커 즉시 숨김 + 제거
    [...this.markers, ...this.cctvMarkers, ...this.storeMarkers].forEach(marker => {
      if (marker) {
        hideElement(marker);
        marker.setMap(null);
      }
    });
    
    // 시작/도착 마커 즉시 숨김 + 제거
    if (this.startMarker) {
      hideElement(this.startMarker);
      this.startMarker.setMap(null);
      this.startMarker = null;
    }
    if (this.endMarker) {
      hideElement(this.endMarker);
      this.endMarker.setMap(null);
      this.endMarker = null;
    }
    
    // 배열 초기화
    this.markers = [];
    this.cctvMarkers = [];
    this.storeMarkers = [];
    
    // 정보창 닫기
    if (this.currentInfoWindow) {
      this.currentInfoWindow.close();
      this.currentInfoWindow = null;
    }
    
    console.log('✅ 지도 정리 완료 - 즉시 제거');
  }

  // 📦 캐시 관련 메서드들
  generateRouteKey(startCoords, goalCoords) {
    return `${startCoords.latitude.toFixed(6)},${startCoords.longitude.toFixed(6)}_${goalCoords.latitude.toFixed(6)},${goalCoords.longitude.toFixed(6)}`;
  }

  clearRouteCache() {
    console.log('🗑️ 경로 캐시 완전 초기화 (출발지/목적지 변경 시에만)');
    this.routeCache.clear();
    this.currentRouteKey = null;
  }

  // 🆕 특정 경로만 캐시에서 제거 (사용하지 않음 - 보존 우선)
  removeRouteFromCache(routeKey) {
    if (this.routeCache.has(routeKey)) {
      this.routeCache.delete(routeKey);
      console.log(`🗑️ 특정 경로 캐시 제거: ${routeKey}`);
    }
  }

  getCachedRoute(routeKey, routeType) {
    const cached = this.routeCache.get(routeKey);
    return cached?.[routeType] || null;
  }

  setCachedRoute(routeKey, routeType, data) {
    if (!this.routeCache.has(routeKey)) {
      this.routeCache.set(routeKey, {});
    }
    this.routeCache.get(routeKey)[routeType] = data;
    console.log(`💾 캐시 저장: ${routeType} 경로 (${routeKey}) - 총 ${this.routeCache.size}개 경로 캐시됨`);
  }

  // 🆕 캐시 상태 확인
  getCacheStatus() {
    const cacheInfo = [];
    this.routeCache.forEach((routes, key) => {
      const types = Object.keys(routes);
      cacheInfo.push(`${key}: [${types.join(', ')}]`);
    });
    return cacheInfo;
  }

  // 🗺️ 현재 경로에 맞게 지도 뷰포트 복원
  restoreRouteViewport() {
    if (!this.pathInstance) {
      console.log('⚠️ 복원할 경로가 없음');
      return;
    }

    try {
      const path = this.pathInstance.getPath();
      if (!path || path.length === 0) {
        console.log('⚠️ 경로 데이터가 없음');
        return;
      }

      const bounds = new naver.maps.LatLngBounds();
      path.forEach(point => {
        bounds.extend(point);
      });

      const padding = { top: 50, right: 50, bottom: 100, left: 50 };
      this.mapInstance.fitBounds(bounds, padding);
      
      // 강제 리사이즈 - 컨테이너 크기 변화 감지
      naver.maps.Event.trigger(this.mapInstance, 'resize');
      console.log('🎯 경로 뷰포트 복원 및 리사이즈 완료');
    } catch (error) {
      console.error('❌ 뷰포트 복원 실패:', error);
    }
  }

// cctv랑 편의점 토글
  toggleCCTVMarkers(show) {
    this.cctvMarkers.forEach(marker => {
      marker.setMap(show ? this.mapInstance : null);
    });
    
    // 표시하지 않을 때 열려있는 정보 창 닫기
    if (!show && this.currentInfoWindow) {
      this.currentInfoWindow.close();
    }
  }

  toggleStoreMarkers(show) {
    this.storeMarkers.forEach(marker => {
      marker.setMap(show ? this.mapInstance : null);
    });

    // 표시하지 않을 때 열려있는 정보 창 닫기
    if (!show && this.currentInfoWindow) {
      this.currentInfoWindow.close();
    }
  }

  // 출발 도착 마커 사이즈 줄임
  calculateMarkerSize(zoom) {
    // 확대 수준에 따라 마커 크기 조정 (기본 크기 증가)
    return Math.max(40, Math.round(40 * (zoom / 14)));
  }

  updateMarkers() {
    const size = this.calculateMarkerSize(this.mapInstance.getZoom());
  
    if (this.startMarker) {
      const startIcon = {
        url: 'images/map/start.svg',
        size: new naver.maps.Size(size, size),
        scaledSize: new naver.maps.Size(size, size),
        origin: new naver.maps.Point(0, 0),
        anchor: new naver.maps.Point(size/2, size/2)
      };
      this.startMarker.setIcon(startIcon);
    }

    if (this.endMarker) {
      const endIcon = {
        url: 'images/map/goal.svg',
        size: new naver.maps.Size(size, size),
        scaledSize: new naver.maps.Size(size, size),
        origin: new naver.maps.Point(0, 0),
        anchor: new naver.maps.Point(size/2, size/2)
       };
      this.endMarker.setIcon(endIcon);
    }
  }

  async drawRoute(startCoords, goalCoords, routeType) {
    try {
      console.log(`🗺️ [${routeType}] 경로 그리기 시작`);
      
      //  캐시 확인
      const routeKey = this.generateRouteKey(startCoords, goalCoords);
      const cachedData = this.getCachedRoute(routeKey, routeType);
      
      let serverResponse;
      
      if (cachedData) {
        console.log(`💾 [${routeType}] 캐시된 데이터 사용 (${routeKey}) - 서버 요청 없음`);
        serverResponse = cachedData;
        
        // 캐시 사용 시에만 기존 요소 정리 (시각적 전환을 위해)
        this.clearMap();
      } else {
        console.log(`🌐 [${routeType}] 서버에서 새 데이터 요청`);
        
        // 새 요청 시에만 기존 요소 정리
        this.clearMap();
        
        const apiEndpoint = routeType === 'safe' ? 'safe-direction' : 'normal-direction';
        const startStr = `${startCoords.latitude},${startCoords.longitude}`;
        const goalStr = `${goalCoords.latitude},${goalCoords.longitude}`;
        
        console.log(`🌐 [${routeType}] API 요청:`, { 
          endpoint: apiEndpoint, 
          start: startStr, 
          goal: goalStr 
        });

        const response = await fetch(
          `${API_BASE_URL}/direction/${apiEndpoint}?start=${startStr}&goal=${goalStr}`
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || '경로 검색 실패');
        }

        serverResponse = await response.json();
        
        // 📦 캐시에 저장
        this.setCachedRoute(routeKey, routeType, serverResponse);
        this.currentRouteKey = routeKey;
      }
      
      console.log(`🎯 [${routeType}] 새 경로 생성 시작`);

      const initialSize = this.calculateMarkerSize(this.mapInstance.getZoom());
      const initialHalf = initialSize / 2;

      this.startMarker = new naver.maps.Marker({
        position: new naver.maps.LatLng(startCoords.latitude, startCoords.longitude),
        map: this.mapInstance,
        icon: {
          url: 'images/map/start.svg',
          size: new naver.maps.Size(initialSize, initialSize),
          scaledSize: new naver.maps.Size(initialSize, initialSize),
          origin: new naver.maps.Point(0, 0),
          anchor: new naver.maps.Point(initialHalf, initialHalf)
        },
        zIndex: 50
      });

      this.endMarker = new naver.maps.Marker({
        position: new naver.maps.LatLng(goalCoords.latitude, goalCoords.longitude),
        map: this.mapInstance,
        icon: {
          url: 'images/map/goal.svg',
          size: new naver.maps.Size(initialSize, initialSize),
          scaledSize: new naver.maps.Size(initialSize, initialSize),
          origin: new naver.maps.Point(0, 0),
          anchor: new naver.maps.Point(initialHalf, initialHalf)
        },
        zIndex: 50
      });

      naver.maps.Event.addListener(this.mapInstance, 'zoom_changed', this.updateMarkers.bind(this));

      this.markers.push(this.startMarker, this.endMarker);

      console.log(`📊 [${routeType}] 응답 데이터 처리:`, {
        success: serverResponse.success,
        features: serverResponse.data?.features?.length || 0,
        hasNearbyCCTV: !!serverResponse.data?.nearbyCCTVs,
        hasNearbyStores: !!serverResponse.data?.nearbyStores
      });

      if (serverResponse.success && serverResponse.data.features) {
        const pathCoordinates = [];
        
        serverResponse.data.features.forEach(feature => {
          if (feature.geometry.type === 'LineString') {
            pathCoordinates.push(...feature.geometry.coordinates);
          }
        });

        const path = pathCoordinates.map(coord => new naver.maps.LatLng(coord[1], coord[0]));
 
        // 모든 경로 유형에 대해 동일한 색상 사용 (지도에서 잘 보이는 색상)
        const routeColor = {
          border: '#FFFFFF',     // 테두리 색상 (흰색)
          main: '#4B89DC'        // 메인 경로 색상 (네이버 지도 스타일 파란색)
        };
 
        // 경로에 테두리 주기 - 더 두껍고 불투명하게 설정
        this.pathBorderInstance = new naver.maps.Polyline({
          map: this.mapInstance,
          path: path,
          strokeColor: routeColor.border,
          strokeWeight: 12,       // 테두리를 더 두껍게
          strokeOpacity: 1,       // 완전 불투명하게
          strokeLineCap: 'round',
          strokeLineJoin: 'round',
          zIndex: 1
        });
 
        // 메인 경로 그리기 - 더 선명하고 생생한 색상으로
        this.pathInstance = new naver.maps.Polyline({
          map: this.mapInstance,
          path: path,
          strokeColor: routeColor.main,
          strokeWeight: 6,        // 약간 더 두껍게
          strokeOpacity: 1,       // 완전 불투명하게
          strokeLineCap: 'round',
          strokeLineJoin: 'round',
          zIndex: 2
        });

        // 🗺️ 지도 뷰포트를 경로에 맞게 조정 (캐시/새 데이터 모두 적용)
        const bounds = new naver.maps.LatLngBounds();
        pathCoordinates.forEach(coord => {
          bounds.extend(new naver.maps.LatLng(coord[1], coord[0]));
        });
        
        // DOM 렌더링 완료 후 뷰포트 조정
        setTimeout(() => {
          const padding = { top: 50, right: 50, bottom: 100, left: 50 };
          this.mapInstance.fitBounds(bounds, padding);
          console.log(`🎯 지도 뷰포트 조정 완료 (${routeType})`);
        }, 100);

        // 안전 경로일 때 마커 데이터 저장
        if (routeType === 'safe') {
          if (serverResponse.data.nearbyCCTVs && serverResponse.data.nearbyCCTVs.length > 0) {
            console.log(`📹 CCTV 마커 ${serverResponse.data.nearbyCCTVs.length}개 추가 (숨김 상태)`);
            this.displayCCTVMarkers(serverResponse.data.nearbyCCTVs);
            // 처음에는 마커 안보이게 함
            this.toggleCCTVMarkers(false);
          }
          if (serverResponse.data.nearbyStores && serverResponse.data.nearbyStores.length > 0) {
            console.log(`🏪 편의점 마커 ${serverResponse.data.nearbyStores.length}개 추가 (숨김 상태)`);
            this.displayStoreMarkers(serverResponse.data.nearbyStores);
            // 처음에는 마커 안 보이게 함
            this.toggleStoreMarkers(false);
          }
        }

        const routeResult = {
          distance: serverResponse.data.features[0].properties.totalDistance || 0,
          time: serverResponse.data.features[0].properties.totalTime || 0,
          safety: serverResponse.data.safety,
          cctvCount: serverResponse.data.nearbyCCTVs?.length || 0,
          storeCount: serverResponse.data.nearbyStores?.length || 0
        };

        console.log(`✅ [${routeType}] 경로 그리기 완료:`, {
          거리: `${(routeResult.distance / 1000).toFixed(2)}km`,
          시간: `${Math.round(routeResult.time / 60)}분`,
          CCTV개수: routeResult.cctvCount,
          편의점개수: routeResult.storeCount,
          안전도: routeResult.safety?.grade || 'N/A'
        });

        return routeResult;
      }
    } catch (error) {
      console.error(`❌ [${routeType}] 경로 그리기 실패:`, error);
      throw error;
    }
  }
// 절반 으로 줄임
  displayCCTVMarkers(cctvData) {
    cctvData.forEach(cctv => {
      const marker = new naver.maps.Marker({
        position: new naver.maps.LatLng(cctv.latitude, cctv.longitude),
        map: this.mapInstance,
        icon: { 
          url: '/images/map/direction/cctv.png',
          size: new naver.maps.Size(24, 24), 
          scaledSize: new naver.maps.Size(24, 24), 
          origin: new naver.maps.Point(0, 0),
          anchor: new naver.maps.Point(12, 12)
        },
        zIndex: 30
      });

      const infoWindow = new naver.maps.InfoWindow({
        content: `
          <div style="padding: 10px; min-width: 160px; max-width: 180px; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.2);">
             <h4 style="margin: 0 0 6px 0; font-size: 14px; color: #333;">CCTV 정보</h4>
             <p style="margin: 3px 0; font-size: 13px; color: #666;">${cctv.address || '주소 정보 없음'}</p>
             <p style="margin: 3px 0; font-size: 13px; color: #666;">목적: ${cctv.purpose || '안전 감시'}</p>
             <p style="margin: 3px 0; font-size: 12px; color: #888;">설치 대수: ${cctv.cameraCount || 1}대</p>
          </div>
        `,
        borderWidth: 0,
        backgroundColor: "white",
        borderRadius: "12px",
        boxShadow: "0 2px 6px rgba(0,0,0,0.3)"
      });

      let isInfoWindowOpen = false;
      
      naver.maps.Event.addListener(marker, 'click', () => {
        if (isInfoWindowOpen) {
          infoWindow.close();
          isInfoWindowOpen = false;
        } else {
          if (this.currentInfoWindow) {
            this.currentInfoWindow.close();
          }
          infoWindow.open(this.mapInstance, marker);
          this.currentInfoWindow = infoWindow;
          isInfoWindowOpen = true;
        }
      });

      this.cctvMarkers.push(marker);
    });
  }
// 크기 절반으로 줄임
  displayStoreMarkers(stores) {
    stores.forEach(store => {
      const marker = new naver.maps.Marker({
        position: new naver.maps.LatLng(store.latitude, store.longitude),
        map: this.mapInstance,
        icon: {
          url: '/images/map/direction/store.png',
          size: new naver.maps.Size(24, 24),
          scaledSize: new naver.maps.Size(24, 24),
          origin: new naver.maps.Point(0, 0),
          anchor: new naver.maps.Point(12, 12)
        },
        zIndex: 30
      });

      const infoWindow = new naver.maps.InfoWindow({
        content: `
          <div style="padding: 10px; min-width: 160px; max-width: 180px; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.2);">
            <h4 style="margin: 0 0 6px 0; font-size: 14px; color: #333;">${store.name || '편의점'}</h4>
            <p style="margin: 3px 0; font-size: 13px; color: #666;">${store.address || '주소 정보 없음'}</p>
            <p style="margin: 3px 0; font-size: 12px; color: #888;">거리: ${store.distance || '정보 없음'}</p>
          </div>
        `,
        borderWidth: 0,
        backgroundColor: "white",
        borderRadius: "12px",
        boxShadow: "0 2px 6px rgba(0,0,0,0.3)"
      });

      let isInfoWindowOpen = false;

      naver.maps.Event.addListener(marker, 'click', () => {
        if (isInfoWindowOpen) {
          infoWindow.close();
          isInfoWindowOpen = false;
        } else {
          if (this.currentInfoWindow) {
            this.currentInfoWindow.close();
          }
          infoWindow.open(this.mapInstance, marker);
          this.currentInfoWindow = infoWindow;
          isInfoWindowOpen = true;
        }
      });

      this.storeMarkers.push(marker);
    });
  }
}

export default RouteService;