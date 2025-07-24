import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import MapService from '../../services/MapService';
import RouteService from '../../services/RouteService';
import './TrackingScreen.css';

const TrackingScreen = () => {
  // 라우터로부터 전달된 데이터 가져오기
  const location = useLocation();
  const navigate = useNavigate();
  const { startLocation, destination, routeInfo, routeType } = location.state || {};
  
  const mapRef = useRef(null);
  const mapServiceRef = useRef(null);
  const routeServiceRef = useRef(null);
  const [currentLocation, setCurrentLocation] = useState(null); // UI 렌더링을 위한 상태
  const currentLocationRef = useRef(null); // watchPosition 콜백 내에서 최신 위치 참조용
  const [remainingDistance, setRemainingDistance] = useState(routeInfo?.distance || 0);
  const [estimatedTime, setEstimatedTime] = useState(routeInfo?.time || 0);
  const [progressPercent, setProgressPercent] = useState(0);
  const [isLocationButtonActive, setIsLocationButtonActive] = useState(false);
  const watchPositionId = useRef(null); // watch ID를 ref에 보관
  const isFirstRender = useRef(true);
  const totalDistance = useRef(routeInfo?.distance || 0);

  // 데이터가 없으면 이전 화면으로 돌아가기
  useEffect(() => {
    if (!startLocation || !destination) {
      alert('경로 정보가 없습니다. 경로 선택 화면으로 이동합니다.');
      navigate('/route');
    }
  }, [startLocation, destination, navigate]);

  // stopTracking, startTracking, drawRoute 함수들을 useEffect보다 먼저 정의합니다.
  const stopTracking = useCallback(() => {
    if (watchPositionId.current) {
      navigator.geolocation.clearWatch(watchPositionId.current);
      watchPositionId.current = null;
      console.log('위치 추적 중지됨.');
    }
  }, []); // 의존성 없음

  const startTracking = useCallback(() => {
    if (watchPositionId.current || !navigator.geolocation) {
      if (!navigator.geolocation) alert('위치 추적이 지원되지 않는 브라우저입니다.');
      return;
    }
    
    watchPositionId.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        
        // 정확도가 너무 낮으면 무시 (예: 50m 초과)
        if (accuracy > 50) {
          console.log('위치 정확도 낮음 (50m 초과), 업데이트 건너뜀:', accuracy);
          return;
        }

        const newCoords = { latitude, longitude };

        // 이전 위치와 현재 위치가 거의 동일하면 업데이트 건너뛰기 (오차 범위 1e-5, 약 1.1m)
        if (
          currentLocationRef.current &&
          Math.abs(currentLocationRef.current.latitude - newCoords.latitude) < 1e-5 &&
          Math.abs(currentLocationRef.current.longitude - newCoords.longitude) < 1e-5
        ) {
          return;
        }
        
        currentLocationRef.current = newCoords; // ref에 최신 위치 저장
        setCurrentLocation(newCoords); // 상태 업데이트
        
        if (mapServiceRef.current) {
          mapServiceRef.current.updateCurrentLocation(newCoords, true); // follow: true로 지도 이동 요청
        }
        
        if (destination?.coords) {
          const destCoords = destination.coords;
          const distance = calculateDistance(
            newCoords.latitude,
            newCoords.longitude,
            destCoords.latitude,
            destCoords.longitude
          );
            
          setRemainingDistance(Math.round(distance));
          setProgressPercent(
            100 - Math.min(100, Math.round((distance / totalDistance.current) * 100))
          );
          const walkingSpeedMps = 1.4;
          const estimatedSeconds = distance / walkingSpeedMps;
          setEstimatedTime(Math.round(estimatedSeconds));
            
          if (distance < 20) {
            stopTracking(); 
            alert('목적지에 도착했습니다!');
          }
        }
      },
      (error) => {
        console.error('watchPosition 오류:', error);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 10000 
      }
    );
  }, [destination, stopTracking]); 

  const drawRoute = useCallback(async () => {
    if (!routeServiceRef.current || !startLocation || !destination) return;
    try {
      const result = await routeServiceRef.current.drawRoute(
        startLocation.coords,
        destination.coords,
        routeType || 'normal'
      );
      
      if (isFirstRender.current) {
        setRemainingDistance(result.distance);
        setEstimatedTime(result.time);
        totalDistance.current = result.distance;
        isFirstRender.current = false;
      }
    } catch (error) {
      console.error('경로 그리기 실패:', error);
    }
  }, [startLocation, destination, routeType]);

  // 지도 초기화
  useEffect(() => {
    if (mapRef.current && startLocation && destination) {
      const initialCoords = startLocation.coords || {
        latitude: 37.5665,
        longitude: 126.9780,
      };
      mapServiceRef.current = new MapService(mapRef.current, initialCoords);
      routeServiceRef.current = new RouteService(
        mapServiceRef.current.getMapInstance()
      );
      
      drawRoute();
      
      setTimeout(() => {
        startTracking();
      }, 500);
    }
    
    return () => {
      stopTracking();
    };
  }, [startLocation, destination, drawRoute, startTracking, stopTracking]);

  // 두 지점 간의 직선 거리 계산 (Haversine formula)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371000; // 지구 반지름 (미터)
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c; // 미터 단위 거리
    return distance;
  };

  const deg2rad = (deg) => {
    return deg * (Math.PI/180);
  };

  // 거리 형식화
  const formatDistance = (meters) => {
    if (meters < 1000) return `${meters}m`;
    return `${(meters / 1000).toFixed(1)}km`;
  };
  
  // 시간 형식화
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}분`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}시간 ${remainingMinutes}분`;
  };

  const handleBackClick = () => {
    stopTracking();
    navigate(-1);
  };
  
  // 현재 위치로 다시 중심 이동
  const handleRecenter = () => {
    if (mapServiceRef.current && currentLocationRef.current) {
      setIsLocationButtonActive(true);
      mapServiceRef.current.panTo(currentLocationRef.current, 17);
      
      setTimeout(() => {
        setIsLocationButtonActive(false);
      }, 3000);
    }
  };

  return (
    <div className="tracking-screen">
      {/* 상단 바: 목적지 정보 및 뒤로 가기 */}
      <div className="tracking-header">
        <div className="header-content">
          <button className="tracking-back-button" onClick={handleBackClick}>
            <img src="/images/RouteSelectionScreen/back.png" alt="뒤로 가기" />
          </button>
          <div className="destination-info">
            <h3>{destination?.name || '목적지'}</h3>
            <div className="destination-details">
              <div className="detail-item">
                <svg className="detail-icon" viewBox="0 0 24 24">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="currentColor"/>
                </svg>
                <span>{formatDistance(remainingDistance)} 남음</span>
              </div>
              <div className="detail-item">
                <svg className="detail-icon" viewBox="0 0 24 24">
                  <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zm.5 5v5.25l4.5 2.67-.75 1.23L11 13V7h1.5z" fill="currentColor"/>
                </svg>
                <span>도착 {formatTime(estimatedTime)}</span>
              </div>
            </div>
          </div>
          <div className="header-right-space"></div>
        </div>
      </div>
      
      {/* 지도 영역 */}
      <div className="tracking-map-container" ref={mapRef}></div>
      
      {/* 현재 위치 버튼 - 완전히 독립적인 클래스명 사용 */}
      <div className="tracking-location-btn-container">
        <button 
          className={`tracking-location-btn ${isLocationButtonActive ? 'active' : ''}`}
          onClick={handleRecenter}
        >
          {isLocationButtonActive && <div className="tracking-location-pulse"></div>}
          <img 
            src="/images/RouteSelectionScreen/location.svg" 
            alt="현재 위치로 이동"
          />
        </button>
      </div>
    </div>
  );
};

export default TrackingScreen;