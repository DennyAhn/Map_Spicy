/* NaverMap */
import React, { useEffect, useRef, useState } from 'react';

/** services에서 import 경로 수정 */
import MapService from '../../services/MapService';
import MarkerService from '../../services/MarkerService';
import { getPlacesForFilter } from '../../services/placesApi';

const NaverMap = ({ selectedMode, activeFilters, setActiveFilters, onFilterClick, onCurrentLocationUpdate, startLocation }) => {
  const mapRef = useRef(null);
  const mapService = useRef(null);
  const markerService = useRef(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const watchPositionId = useRef(null);
  const prevActiveFilters = useRef(new Set());

  // 지도 초기화
  useEffect(() => {
    let isSubscribed = true;

    const waitForNaverMaps = () => {
      return new Promise((resolve, reject) => {
        if (window.naver && window.naver.maps) {
          resolve();
        } else {
          const checkCount = { count: 0 };
          const interval = setInterval(() => {
            if (window.naver && window.naver.maps) {
              clearInterval(interval);
              resolve();
            } else if (checkCount.count > 20) { // 10초 후에도 로드되지 않으면 에러
              clearInterval(interval);
              reject(new Error('Naver Maps API 로드 실패'));
            }
            checkCount.count++;
          }, 500);
        }
      });
    };

    const initializeMap = async () => {
      if (!mapRef.current || mapService.current) return;

      try {
        await waitForNaverMaps();

        // 현재 위치 가져오기
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              if (!isSubscribed) return;
              
              const { latitude, longitude } = position.coords;
              console.log('Current position:', { latitude, longitude });
              
              // 현재 위치를 부모 컴포넌트로 전달
              if (onCurrentLocationUpdate) {
                onCurrentLocationUpdate({ latitude, longitude });
              }
              
              // 지도 초기화 및 현재 위치로 설정
              mapService.current = new MapService(mapRef.current, { latitude, longitude });
              markerService.current = new MarkerService();
              setIsMapReady(true);

              // 실시간 위치 추적 시작
              watchPositionId.current = navigator.geolocation.watchPosition(
                (newPosition) => {
                  if (mapService.current) {
                    mapService.current.updateCurrentLocation({
                      latitude: newPosition.coords.latitude,
                      longitude: newPosition.coords.longitude
                    });
                  }
                },
                (error) => console.error('위치 추적 오류:', error),
                {
                  enableHighAccuracy: true,
                  maximumAge: 0,
                  timeout: 5000
                }
              );
            },
            (error) => {
              console.error('현재 위치를 가져올 수 없습니다:', error);
              // 위치 정보를 가져올 수 없는 경우에도 지도는 초기화
              mapService.current = new MapService(mapRef.current);
              markerService.current = new MarkerService();
              setIsMapReady(true);
            },
            {
              enableHighAccuracy: true,
              timeout: 5000,
              maximumAge: 0
            }
          );
        }
      } catch (error) {
        console.error('Map initialization error:', error);
        // 위치 정보를 가져올 수 없는 경우에도 지도는 초기화
        mapService.current = new MapService(mapRef.current);
        markerService.current = new MarkerService();
        setIsMapReady(true);
      }
    };
    
    initializeMap();

    return () => {
      isSubscribed = false;
      if (watchPositionId.current) {
        navigator.geolocation.clearWatch(watchPositionId.current);
      }
    };
  }, [onCurrentLocationUpdate]);

  // 필터 변경 감지 및 마커 업데이트

  useEffect(() => {
    if (!mapService.current || !markerService.current || !isMapReady) return;

    const mapInstance = mapService.current.getMapInstance();
    const center = mapInstance.getCenter();
    const currentLocation = {
      lat: center.lat(),
      lng: center.lng()
    };
    
    // 이전 상태와 현재 상태를 비교하여 변경된 필터만 처리
    const currentFiltersSet = new Set(activeFilters);
    // 제거된 필터 처리
    [...prevActiveFilters.current].forEach(filter => {
      if (!currentFiltersSet.has(filter)) {
        markerService.current.removeMarkers(filter);
      }
    });
    // 새로운 필터에 대해 getPlacesForFilter 호출
    activeFilters.forEach(async (filter) => {
      if (!prevActiveFilters.current.has(filter)) {
        try {
          console.log(`${filter} 데이터 요청 중...`);
          const places = await getPlacesForFilter(filter, currentLocation);
          if (places && places.length > 0) {
            console.log(`${filter} ${places.length}개 발견`);
            markerService.current.toggleMarkers(mapInstance, places, filter);
          } else {
            console.log(`주변에 ${filter} 데이터가 없습니다.`);
          }
        } catch (error) {
          console.error(`Error fetching places for ${filter}:`, error);
        }
      }
    });
    prevActiveFilters.current = currentFiltersSet;
  }, [activeFilters, isMapReady]);

  return <div ref={mapRef} style={{ width: '100%', height: '100%' }} />;
};

export default NaverMap;
