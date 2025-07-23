import React, { useState, useEffect, useRef, useCallback } from 'react';
import MapService from '../../services/MapService';
import RouteService from '../../services/RouteService';
import RouteInfoPanel from '../panels/RouteInfoPanel';
import './RouteSelectionScreen.css';

const RouteSelectionScreen = ({
  startLocation,
  destination,
  onBack,
  onNavigate,
  onStartLocationEdit,
  onDestinationEdit,
}) => {
  /* ──────────────────────────────── 상태 & ref ─────────────────────────────── */
  const [routeType, setRouteType] = useState('normal'); // normal | safe
  const [showCCTV, setShowCCTV] = useState(false);
  const [showStores, setShowStores] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLocationButtonActive, setIsLocationButtonActive] = useState(false);
  const [routeInfo, setRouteInfo] = useState(null);
  const [isMapInitialized, setIsMapInitialized] = useState(false);

  const mapRef             = useRef(null);
  const mapServiceRef      = useRef(null);
  const routeServiceRef    = useRef(null);
  const watchPositionId    = useRef(null);
  const lastRequestIdRef   = useRef(0);     // ★ race condition 방지용

  /* ──────────────────────────────── 헬퍼 ─────────────────────────────── */
  const toggleCCTV = (show) => {
    routeServiceRef.current?.toggleCCTVMarkers(show);
    setShowCCTV(show);
  };

  const toggleStores = (show) => {
    routeServiceRef.current?.toggleStoreMarkers(show);
    setShowStores(show);
  };

  /* ──────────────────────────────── drawRoute ─────────────────────────────── */
  const drawRoute = useCallback(async () => {
    if (!isMapInitialized || !startLocation || !destination || !routeServiceRef.current) return;

    // 요청 id 채번
    const requestId = ++lastRequestIdRef.current;
    console.log(`🎯 (${requestId}) [${routeType}] 경로 요청`);

    try {
      const result = await routeServiceRef.current.drawRoute(
        startLocation.coords,
        destination.coords,
        routeType,
      );

      // 최신 요청이 아닌 응답이면 무시
      if (requestId !== lastRequestIdRef.current) {
        console.log(`⏭ (${requestId}) 응답 무시 (새 요청 존재)`);
        return;
      }

      console.log(`✅ (${requestId}) [${routeType}] 경로 그리기 완료`);
      setRouteInfo(result);
    } catch (error) {
      if (requestId !== lastRequestIdRef.current) return;
      console.error(`❌ (${requestId}) [${routeType}] 경로 실패`, error);
      setRouteInfo({ error: '경로를 찾을 수 없습니다.' });
    }
  }, [isMapInitialized, startLocation, destination, routeType]);

  /* ──────────────────────────────── 지도 & 서비스 초기화 ─────────────────────────────── */
  useEffect(() => {
    if (!mapRef.current) return;
    if (!window.naver?.maps) return;
    if (mapServiceRef.current) return;              // 이미 초기화됨

    const initCoords = startLocation?.coords ?? { latitude: 37.5665, longitude: 126.9780 };

    try {
      mapServiceRef.current = new MapService(mapRef.current, initCoords);
      const mapInstance = mapServiceRef.current.getMapInstance();
      routeServiceRef.current = new RouteService(mapInstance);

      // 출발 위치 마커 설치
      if (startLocation) mapServiceRef.current.setCurrentLocation(startLocation.coords);

      setIsMapInitialized(true);
    } catch (e) {
      console.error('지도 초기화 실패:', e);
    }
  }, [startLocation]);

  /* ──────────────────────────────── 출발지/목적지 변경 시에만 캐시 초기화 ─────────────────────────────── */
  useEffect(() => {
    if (routeServiceRef.current && startLocation && destination) {
      const newRouteKey = routeServiceRef.current.generateRouteKey(startLocation.coords, destination.coords);
      
      // 이전 경로 키와 다를 때만 캐시 초기화
      if (routeServiceRef.current.currentRouteKey && routeServiceRef.current.currentRouteKey !== newRouteKey) {
        console.log('🗑️ 출발지/목적지 변경으로 캐시 초기화');
        console.log(`이전: ${routeServiceRef.current.currentRouteKey}`);
        console.log(`현재: ${newRouteKey}`);
        routeServiceRef.current.clearRouteCache();
      } else {
        console.log(`💾 기존 경로와 동일 - 캐시 유지 (${newRouteKey})`);
        const cacheStatus = routeServiceRef.current.getCacheStatus();
        console.log('📊 현재 캐시 상태:', cacheStatus);
      }
    }
  }, [startLocation?.coords?.latitude, startLocation?.coords?.longitude, destination?.coords?.latitude, destination?.coords?.longitude]);

  /* ──────────────────────────────── routeType 전환 시에만 정리 ─────────────────────────────── */
  useEffect(() => {
    // routeType 변경 시에만 기존 오버레이 제거, 토글 초기화
    console.log(`🔄 경로 타입 변경: ${routeType}`);
    routeServiceRef.current?.clearMap();
    setRouteInfo(null);
    setShowCCTV(false);
    setShowStores(false);
    // 이후 drawRoute는 아래 통합 effect에서 호출됨
  }, [routeType]);

  /* ──────────────────────────────── 경로 그리기 (단일 effect) ─────────────────────────────── */
  useEffect(() => {
    if (isMapInitialized && startLocation && destination) {
      drawRoute();
    }
  }, [isMapInitialized, startLocation, destination, routeType, drawRoute]);

  /* ──────────────────────────────── 위치 추적 (watchPosition) - 경로 재요청 방지 ─────────────────────────────── */
  const startFollowing = useCallback(() => {
    if (!mapServiceRef.current) return;
    if (startLocation?.coords) {
      mapServiceRef.current.panTo(startLocation.coords);
      mapServiceRef.current.setZoomLevel(17);
    }

    watchPositionId.current = navigator.geolocation.watchPosition(
      (pos) => {
        const newCoords = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
        mapServiceRef.current.updateCurrentLocation(newCoords);
        if (isFollowing) mapServiceRef.current.panTo(newCoords);
      },
      (err) => {
        console.error('위치 추적 오류', err);
        setIsFollowing(false);
      },
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 5000 },
    );
  }, [startLocation]); // isFollowing 의존성 제거로 재호출 방지

  const stopFollowing = useCallback(() => {
    if (watchPositionId.current) {
      navigator.geolocation.clearWatch(watchPositionId.current);
      watchPositionId.current = null;
    }
    
    // 🗺️ 따라가기 해제 시 경로 뷰포트 복원
    if (routeServiceRef.current) {
      setTimeout(() => {
        routeServiceRef.current.restoreRouteViewport();
        // 패널 복원 후 추가 리사이즈 (더블 체크)
        mapServiceRef.current?.forceResize();
      }, 200); // 약간의 지연을 주어 상태 전환 완료 후 실행
    }
  }, []);

  const handleFollowToggle = (follow) => {
    console.log(`📍 따라가기 ${follow ? '활성화' : '비활성화'} - 경로 재요청 없음`);
    setIsFollowing(follow);
    follow ? startFollowing() : stopFollowing();
  };

  // 컴포넌트 unmount 시 위치 추적 해제
  useEffect(() => () => stopFollowing(), [stopFollowing]);

  /* ──────────────────────────────── 출력 도우미 ─────────────────────────────── */
  const formatDistance = (m) => (m < 1000 ? `${m}m` : `${(m / 1000).toFixed(1)}km`);
  const formatTime     = (s) => {
    const min = Math.floor(s / 60);
    if (min < 60) return `${min}분`;
    return `${Math.floor(min / 60)}시간 ${min % 60}분`;
  };

  /* ──────────────────────────────── 렌더 ─────────────────────────────── */
  return (
    <div className="route-selection-screen">
      {/* ───────────── 헤더 ───────────── */}
      <div className="route-header">
        <div className="location-inputs">
          <div className="input-row clickable" onClick={onStartLocationEdit}>
            <span className="location-icon"><img src="/images/RouteSelectionScreen/start.png" /></span>
            <input
              type="text"
              placeholder="출발지를 설정하세요"
              value={startLocation?.name ?? ''}
              className="location-input"
              readOnly
            />
            <button className="back-button" onClick={() => {
              // 따라가기 모드가 활성화된 상태에서 뒤로가기 시 뷰포트 복원
              if (isFollowing) {
                setIsFollowing(false);
                stopFollowing();
              }

              // 패널이 다시 나타나면서 map 컨테이너가 커졌으므로 리사이즈
              setTimeout(() => {
                mapServiceRef.current?.forceResize();
              }, 0);

              onBack();
            }}>✕</button>
          </div>
          <div className="input-row clickable" onClick={onDestinationEdit}>
            <span className="location-icon"><img src="/images/RouteSelectionScreen/goal.png" /></span>
            <input
              type="text"
              value={destination?.name ?? ''}
              className="location-input"
              readOnly
            />
          </div>
        </div>
      </div>

      {/* ───────────── 탭 ───────────── */}
      <div className="transport-tabs">
        <button
          className={`transport-tab ${routeType === 'normal' ? 'active' : ''}`}
          onClick={() => setRouteType('normal')}
        >
          <img src="/images/RouteSelectionScreen/normal.svg" className="tab-icon" alt="일반" />
          <span className="tab-text">일반</span>
        </button>
        <button
          className={`transport-tab ${routeType === 'safe' ? 'active' : ''}`}
          onClick={() => setRouteType('safe')}
        >
          <img src="/images/RouteSelectionScreen/safe.svg" className="tab-icon" alt="안전" />
          <span className="tab-text">안전</span>
        </button>
      </div>

      {/* ───────────── 지도 & 패널 ───────────── */}
      {startLocation && destination && (
        <>
          <div className="map-container" ref={mapRef} />
          <RouteInfoPanel
            routeInfo={routeInfo}
            routeType={routeType}
            formatDistance={formatDistance}
            formatTime={formatTime}
            onCCTVToggle={toggleCCTV}
            onStoresToggle={toggleStores}
            showCCTV={showCCTV}
            showStores={showStores}
            onFollowToggle={handleFollowToggle}
            isFollowing={isFollowing}
            startLocation={startLocation}
            destination={destination}
          />

          <button
            className={`move-to-current-button ${isLocationButtonActive ? 'active' : ''}`}
            onClick={() => {
              setIsLocationButtonActive(true);
              mapServiceRef.current?.moveToCurrentLocation();
              setTimeout(() => setIsLocationButtonActive(false), 3000);
            }}
          >
            <img src="/images/RouteSelectionScreen/location.svg" alt="현재 위치" />
          </button>
        </>
      )}
    </div>
  );
};

export default RouteSelectionScreen;
