/* global naver */
import React, { useEffect, useRef, useState, useCallback } from 'react';

/** services에서 import 경로 수정 */
import MapService from '../../services/MapService';
import MarkerService from '../../services/MarkerService';
import { getPlacesForFilter } from '../../services/placesApi';

const NaverMap = ({
  selectedMode,
  activeFilters,
  setActiveFilters,
  onFilterClick,
  onCurrentLocationUpdate,
  startLocation,
  mapServiceRef,
  userLocation
}) => {
  const mapRef = useRef(null);
  const mapService = useRef(null);
  const markerService = useRef(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const prevActiveFilters = useRef(new Set());
  const userLocationRef = useRef(null); // 최신 사용자 위치를 ref에 저장

  /* ------------------------------------------------------------------ */
  /* 1. 지도/서비스 초기화 (최초 1회)                                    */
  /* ------------------------------------------------------------------ */

  useEffect(() => {
    let isSubscribed = true;

    /* navermaps 스크립트가 로드될 때까지 대기 */
    const waitForNaverMaps = () =>
      new Promise((resolve, reject) => {
        if (window.naver && window.naver.maps) {
          resolve();
        } else {
          let tries = 0;
          const id = setInterval(() => {
            if (window.naver && window.naver.maps) {
              clearInterval(id);
              resolve();
            } else if (++tries > 20) {
              clearInterval(id);
              reject(new Error('Naver Maps API 로드 실패'));
            }
          }, 500);
        }
      });

    const initializeMap = async () => {
      if (!mapRef.current || mapService.current) return;

      try {
        await waitForNaverMaps();

        /* 기본 좌표 – 서울시청 */
        const fallbackCoords = { latitude: 37.5665, longitude: 126.9780 };

        /* 실제 MapService 등을 만드는 함수 */
        const makeServices = coords => {
          mapService.current = new MapService(mapRef.current, coords);
          markerService.current = new MarkerService();
          if (mapServiceRef) mapServiceRef.current = mapService.current;

          /* 첫 현재 위치 마커 */
          mapService.current.updateCurrentLocation(coords);

          if (isSubscribed) {
            setIsMapReady(true);
            onCurrentLocationUpdate?.(coords);
          }
        };

        /* 일회성 현재 위치 시도 */
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            pos => {
              if (!isSubscribed) return;
              makeServices({
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude
              });
            },
            () => {
              /* 실패 → 기본 좌표 */
              if (!isSubscribed) return;
              makeServices(fallbackCoords);
            },
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 60000 }
          );
        } else {
          makeServices(fallbackCoords);
        }
      } catch (err) {
        console.error('지도 초기화 오류:', err);
      }
    };

    initializeMap();
    return () => {
      isSubscribed = false;
    };
  }, [mapServiceRef, onCurrentLocationUpdate]);

  /* ------------------------------------------------------------------ */
  /* 2. 실시간 userLocation → 마커 반영                                 */
  /* ------------------------------------------------------------------ */

  /* ref에 최신 위치 저장 */
  useEffect(() => {
    if (userLocation) userLocationRef.current = userLocation;
  }, [userLocation]);

  /* userLocation prop 변경 시 지도 마커 업데이트 */
  useEffect(() => {
    if (!mapService.current || !userLocation || !isMapReady) return;

    const coords = {
      latitude: userLocation.lat ?? userLocation.latitude,
      longitude: userLocation.lng ?? userLocation.longitude
    };
    mapService.current.updateCurrentLocation(coords, false);
  }, [userLocation, isMapReady]);

  /* 일정 주기로(1초) 마커 위치만 살짝 갱신 */
  const refreshUserMarker = useCallback(() => {
    if (!mapService.current || !userLocationRef.current || !isMapReady) return;
    const coords = {
      latitude: userLocationRef.current.lat ?? userLocationRef.current.latitude,
      longitude: userLocationRef.current.lng ?? userLocationRef.current.longitude
    };
    mapService.current.updateCurrentLocation(coords, false);
  }, [isMapReady]);

  useEffect(() => {
    if (!isMapReady) return;
    const id = setInterval(refreshUserMarker, 1000);
    return () => clearInterval(id);
  }, [isMapReady, refreshUserMarker]);

  /* ------------------------------------------------------------------ */
  /* 3. 필터 토글 → 마커 생성/삭제                                       */
  /* ------------------------------------------------------------------ */

  useEffect(() => {
    if (!mapService.current || !markerService.current || !isMapReady) return;

    console.log('필터 변경 감지:', { activeFilters, isMapReady });

    const mapInstance = mapService.current.getMapInstance();
    const center = mapInstance.getCenter();
    const currentLocation = { lat: center.lat(), lng: center.lng() };

    /* 3-1. 꺼진(비활성) 필터의 마커만 제거 */
    [...prevActiveFilters.current].forEach(filter => {
      if (!activeFilters.includes(filter)) {
        console.log(`필터 "${filter}" 마커 제거`);
        markerService.current.removeMarkers(filter);
      }
    });

    /* 3-2. 켜진 필터 → 마커가 없다면 생성 */
    const tasks = activeFilters.map(async filter => {
      console.log(`필터 "${filter}" 데이터 요청 시작`);
      /* 이미 마커가 있다면 skip(MarkerService 내부에서 중복 방지해도 OK) */
      const places = await getPlacesForFilter(filter, currentLocation);
      console.log(`필터 "${filter}" 데이터 수신:`, places?.length || 0, '개');
      if (places?.length) {
        console.log(`필터 "${filter}" 마커 생성 시작`);
        await markerService.current.toggleMarkers(mapInstance, places, filter);
        console.log(`필터 "${filter}" 마커 생성 완료`);
      } else {
        console.log(`필터 "${filter}" 데이터가 없어 마커 생성하지 않음`);
      }
    });

    Promise.all(tasks).then(() => {
      prevActiveFilters.current = new Set(activeFilters);
      console.log('모든 필터 처리 완료');
    });
  }, [activeFilters, isMapReady]);

  /* ------------------------------------------------------------------ */
  /* 4. 지도 중심 재설정                                                */
  /* ------------------------------------------------------------------ */

  /* ------------------------------------------------------------------ */
  /* 5. 렌더                                                             */
  /* ------------------------------------------------------------------ */

  return <div ref={mapRef} style={{ width: '100%', height: '100%' }} />;
};

export default NaverMap;
