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
  const [routeInfo, setRouteInfo] = useState(null);
  const mapRef = useRef(null);
  const mapServiceRef = useRef(null);
  const routeServiceRef = useRef(null);

  const drawRoute = useCallback(async () => {
    if (!routeServiceRef.current || !startLocation || !destination) return;
    try {
      const result = await routeServiceRef.current.drawRoute(
        startLocation.coords,
        destination.coords,
        routeType
      );
      setRouteInfo(result);
    } catch (error) {
      console.error('경로 그리기 실패:', error);
      setRouteInfo({ error: '경로를 찾을 수 없습니다.' });
    }
  }, [startLocation, destination, routeType]);

  useEffect(() => {
    if (mapRef.current) {
      const initialCoords = startLocation?.coords || {
        latitude: 37.5665, // 서울시청 좌표(기본값)
        longitude: 126.9780
      };
      mapServiceRef.current = new MapService(mapRef.current, initialCoords);
      routeServiceRef.current = new RouteService(
        mapServiceRef.current.getMapInstance()
      );

      if (startLocation) {
        mapServiceRef.current.setCurrentLocation(startLocation.coords);
      }
    }
    // ESLint 경고 해결: mapRef는 ref이므로 의존성 배열에 포함시키지 않음
  }, [startLocation]);

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
        <div className="header-top">
          <button className="back-button" onClick={onBack}>
            ✕
          </button>
        </div>
        <div className="location-inputs">
          <div className="input-row clickable" onClick={onStartLocationEdit}>
            <span className="location-icon">⬆️</span>
            <input
              type="text"
              placeholder="출발지를 설정하세요"
              className="location-input"
              value={startLocation ? startLocation.name : ''}
              readOnly
            />
          </div>
          <div className="input-row clickable" onClick={onDestinationEdit}>
            <span className="location-icon">⬇️</span>
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
          onClick={() => setRouteType('safe')}
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
          />
        </>
      )}
    </div>
  );
};

export default RouteSelectionScreen;