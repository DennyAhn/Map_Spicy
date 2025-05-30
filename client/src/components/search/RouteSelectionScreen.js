// src/components/search/RouteSelectionScreen.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
/** services import 경로 변경 */
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
  onDestinationEdit
}) => {
  const [routeType, setRouteType] = useState('normal');
  const [showCCTV, setShowCCTV] = useState(false);
  const [showStores, setShowStores] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLocationButtonActive, setIsLocationButtonActive] = useState(false);
  const watchPositionId = useRef(null);
  const [isMapInitialized, setIsMapInitialized] = useState(false);

  // 경로 타입이 변경될 때 마커를 모두 숨김
  useEffect(() => {
    setShowCCTV(false);
    setShowStores(false);
  }, [routeType]);
  const [routeInfo, setRouteInfo] = useState(null);
  const mapRef = useRef(null);
  const mapServiceRef = useRef(null);
  const routeServiceRef = useRef(null);

  const toggleCCTV = (show) => {
    if (routeServiceRef.current) {
      routeServiceRef.current.toggleCCTVMarkers(show);
    }
    setShowCCTV(show);
  };

  const toggleStores = (show) => {
    if (routeServiceRef.current) {
      routeServiceRef.current.toggleStoreMarkers(show);
    }
    setShowStores(show);
  };

  const drawRoute = useCallback(async () => {
    console.log('경로 그리기 시도:', {
      hasRouteService: !!routeServiceRef.current,
      hasStartLocation: !!startLocation,
      hasDestination: !!destination,
      mapInitialized: isMapInitialized
    });
    
    if (!routeServiceRef.current || !startLocation || !destination || !isMapInitialized) {
      console.log('경로 그리기를 위한 조건이 충족되지 않았습니다.');
      return;
    }

    try {
      console.log('경로 그리기 요청:', {
        출발: startLocation.coords,
        도착: destination.coords,
        경로타입: routeType
      });
      
      const result = await routeServiceRef.current.drawRoute(
        startLocation.coords,
        destination.coords,
        routeType
      );
      console.log('경로 그리기 성공:', result);
      setRouteInfo(result);
    } catch (error) {
      console.error('경로 그리기 실패:', error);
      setRouteInfo({ error: '경로를 찾을 수 없습니다.' });
    }
  }, [startLocation, destination, routeType, isMapInitialized]);

  // 지도 초기화
  useEffect(() => {
    console.log('지도 초기화 시도 중...', mapRef.current ? '맵 요소 있음' : '맵 요소 없음');
    
    // mapRef.current가 null이면 초기화하지 않음
    if (!mapRef.current) {
      console.error('지도 DOM 요소가 준비되지 않았습니다.');
      return;
    }

    // 네이버 맵 API가 로드되었는지 확인
    if (!window.naver || !window.naver.maps) {
      console.error('네이버 맵 API가 로드되지 않았습니다.');
      return;
    }

    // MapService가 이미 초기화되었으면 다시 초기화하지 않음
    if (mapServiceRef.current) {
      console.log('맵 서비스가 이미 초기화되어 있습니다.');
      return;
    }

    // 초기 좌표 설정
    const initialCoords = startLocation?.coords || {
      latitude: 37.5665, // 서울시청 좌표(기본값)
      longitude: 126.9780
    };

    console.log('MapService 초기화 시작:', { 
      mapRefExists: !!mapRef.current,
      initialCoords 
    });

    try {
      // MapService 초기화
      mapServiceRef.current = new MapService(mapRef.current, initialCoords);
      
      // RouteService 초기화
      const mapInstance = mapServiceRef.current.getMapInstance();
      if (mapInstance) {
        routeServiceRef.current = new RouteService(mapInstance);
        console.log('MapService와 RouteService 초기화 완료');
        
        // 시작 위치 설정
        if (startLocation) {
          mapServiceRef.current.setCurrentLocation(startLocation.coords);
        }
        
        // 초기화 성공
        setIsMapInitialized(true);
      } else {
        console.error('맵 인스턴스를 가져올 수 없습니다.');
      }
    } catch (error) {
      console.error('지도 서비스 초기화 오류:', error);
      setIsMapInitialized(false);
    }
  // 렌더링마다 재실행되지 않도록 의존성 배열을 비움
  }, []);

  // 지도 초기화 및 경로 조건이 변경될 때 경로 그리기
  useEffect(() => {
    if (isMapInitialized && startLocation && destination) {
      console.log('조건이 모두 충족되어 경로 그리기 시작');
      drawRoute();
    }
  }, [isMapInitialized, startLocation, destination, routeType, drawRoute]);

  // 지도가 초기화되면 자동으로 실시간 위치 추적 시작
  useEffect(() => {
    if (isMapInitialized && mapServiceRef.current) {
      console.log('경로 선택 화면에서 실시간 위치 추적을 시작합니다.');
      setIsFollowing(true);
      startFollowing();
    }
  }, [isMapInitialized, startFollowing]);

  // 실시간 위치 추적 기능
  const startFollowing = useCallback(() => {
    if (!mapServiceRef.current) return;

    // 현재 위치로 지도 중심 이동 및 줌
    if (startLocation?.coords) {
      mapServiceRef.current.panTo(startLocation.coords);
      mapServiceRef.current.setZoomLevel(17); // 더 가까운 줌 레벨로 설정
    }

    
    watchPositionId.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const newCoords = { latitude, longitude };
        
        // 현재 위치 마커 업데이트
        mapServiceRef.current.updateCurrentLocation(newCoords);
        
        // 실시간 자동 추적 - 항상 지도 중심 이동
        mapServiceRef.current.panTo(newCoords);
      },
      (error) => {
        console.error('위치 추적 오류:', error);
        setIsFollowing(false);
        alert('위치 추적에 실패했습니다. GPS 신호를 확인해주세요.');
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0, 
        timeout: 5000
      }
    );
  }, [startLocation]);

  // 위치 추적 중지
  const stopFollowing = useCallback(() => {
    if (watchPositionId.current) {
      navigator.geolocation.clearWatch(watchPositionId.current);
      watchPositionId.current = null;
    }
  }, []);

  // 위치 추적 토글
  const handleFollowToggle = (follow) => {
    setIsFollowing(follow);
    if (follow) {
      startFollowing();
    } else {
      stopFollowing();
    }
  };

  // 컴포넌트 언마운트 시 위치 추적 중지
  useEffect(() => {
    return () => {
      if (watchPositionId.current) {
        navigator.geolocation.clearWatch(watchPositionId.current);
      }
    };
  }, []); 

  useEffect(() => {
    drawRoute();
  }, [startLocation, destination, routeType, drawRoute]);

  const formatDistance = (meters) => {
    if (meters < 1000) return `${meters}m`;
    return `${(meters / 1000).toFixed(1)}km`;
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}분`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}시간 ${remainingMinutes}분`;
  };

  return (
    <div className="route-selection-screen">
      <div className="route-header">
        <div className="location-inputs">
          <div className="input-row clickable" onClick={onStartLocationEdit}>
            <span className="location-icon">
              <img
                src="/images/RouteSelectionScreen/start.png"
              />
            </span>
            <input
              type="text"
              placeholder="출발지를 설정하세요"
              className="location-input"
              value={startLocation ? startLocation.name : ''}
              readOnly
            />
            <button className="back-button" onClick={onBack}>
              ✕
            </button>
          </div>
          <div className="input-row clickable" onClick={onDestinationEdit}>
            <span className="location-icon">
              <img src="/images/RouteSelectionScreen/goal.png"/>
            </span>
            <input
              type="text"
              value={destination ? destination.name : ''}
              className="location-input"
              readOnly
            />
          </div>
        </div>
      </div>

      <div className="transport-tabs">
        <button
          className={`transport-tab ${routeType === 'normal' ? 'active' : ''}`}
          onClick={() => setRouteType('normal')}
        >
          <img
            src="/images/RouteSelectionScreen/normal.svg"
            alt="일반 경로"
            className="tab-icon"
          />
          <span className="tab-text">일반</span>
        </button>
        <button
          className={`transport-tab ${routeType === 'safe' ? 'active' : ''}`}
          onClick={() => setRouteType('safe')} // 
        >
          <img
            src="/images/RouteSelectionScreen/safe.svg"
            alt="안전 경로"
            className="tab-icon"
          />
          <span className="tab-text">안전</span>
        </button>
      </div>

      {startLocation && destination && (
        <>
          <div className="map-container" ref={mapRef}></div>
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
              if (mapServiceRef.current) {
                mapServiceRef.current.moveToCurrentLocation();

                // 3초 후에 활성화 상태 해제
                setTimeout(() => {
                  setIsLocationButtonActive(false);
                }, 3000);
              }
            }}
          >
            <img src="/images/RouteSelectionScreen/location.svg" alt="현재 위치로 이동" />
          </button>
        </>
      )}
    </div>
  );
};

export default RouteSelectionScreen;