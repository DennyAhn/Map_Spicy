/* NaverMap */
/* global naver */
import React, { useEffect, useRef, useState } from 'react';

/** services에서 import 경로 수정 */
import MapService from '../../services/MapService';
import MarkerService from '../../services/MarkerService';
import { getPlacesForFilter } from '../../services/placesApi';
import './NaverMap.css'; // CSS 파일 추가

const NaverMap = ({ selectedMode, activeFilters, setActiveFilters, onFilterClick, onCurrentLocationUpdate, startLocation, mapServiceRef }) => {
  const mapRef = useRef(null);
  const mapService = useRef(null);
  const markerService = useRef(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const watchPositionId = useRef(null);
  const prevActiveFilters = useRef(new Set());
  const [showListPanel, setShowListPanel] = useState(false); // 리스트 패널 상태 추가
  const [isFollowingUser, setIsFollowingUser] = useState(false); // 사용자 위치 추적 상태 추가
  const [trackingMode, setTrackingMode] = useState('None'); // 위치 추적 모드 상태 추가

  // 리스트 패널 상태 감지
  useEffect(() => {
    // activeFilters 변경 시 리스트 패널 상태 업데이트
    setShowListPanel(activeFilters.length > 0);
  }, [activeFilters]);

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

    // 저장된 위치 정보 불러오기
    const getSavedLocation = () => {
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
    };

    // 현재 위치 얻기 시도 (프로미스 반환)
    const tryGetCurrentPosition = (highAccuracy) => {
      if (!navigator.geolocation) {
        return Promise.reject(new Error('이 브라우저는 위치 정보를 지원하지 않습니다.'));
      }
      
      return new Promise((resolve, reject) => {
        const options = {
          enableHighAccuracy: highAccuracy,
          timeout: highAccuracy ? 15000 : 5000, // 고정밀 모드는 더 긴 타임아웃
          maximumAge: highAccuracy ? 0 : 60000  // 고정밀 모드는 캐시 사용 안 함
        };
        
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            });
          },
          (error) => {
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
    };

    const initializeMap = async () => {
      if (!mapRef.current || mapService.current) return;

      try {
        await waitForNaverMaps();

        // 초기 위치 설정 - 다단계 접근
        let initialLocation = null;
        
        // 1. 전달된 시작 위치가 있으면 사용
        if (startLocation) {
          initialLocation = startLocation;
          console.log('전달된 시작 위치 사용:', initialLocation);
        } else {
          // 2. 저장된 위치가 있으면 임시로 사용
          const savedLocation = getSavedLocation();
          if (savedLocation) {
            initialLocation = savedLocation;
            console.log('저장된 위치 정보 사용:', initialLocation);
          }
        }
        
        // 지도 초기화 - 사용 가능한 최선의 위치로
        mapService.current = new MapService(mapRef.current, initialLocation);
        if (mapServiceRef) {
          mapServiceRef.current = mapService.current;
        }
        markerService.current = new MarkerService();
        
        // 길찾기 버튼 클릭 이벤트 핸들러 등록
        if (markerService.current) {
          markerService.current.handleFindRouteClick(mapService.current.mapInstance);
        }
        
        // 초기 위치에 마커 (있는 경우)
        if (initialLocation) {
          mapService.current.setCurrentLocation(initialLocation);
          
          // 부모 컴포넌트에 현재 위치 전달
          if (onCurrentLocationUpdate && isSubscribed) {
            onCurrentLocationUpdate(initialLocation);
          }
        }
        
        setIsMapReady(true);
        
        // 3. 저정밀 빠른 위치 획득 시도
        console.log('저정밀 위치 정보 요청 중...');
        const quickPosition = await tryGetCurrentPosition(false).catch(() => null);
        
        if (quickPosition && isSubscribed) {
          console.log('저정밀 위치 획득 성공:', quickPosition);
          mapService.current.updateCurrentLocation(quickPosition);
          mapService.current.setCurrentLocation(quickPosition);
          
          // 부모 컴포넌트에 현재 위치 전달
          if (onCurrentLocationUpdate) {
            onCurrentLocationUpdate(quickPosition);
          }
          
          // 실시간 자동 추적을 위해 Follow 모드로 설정
          mapService.current.setLocationTrackingMode('Follow');
          setTrackingMode('Follow');
          setIsFollowingUser(true);
          
          // 세션 스토리지에 위치 저장
          try {
            sessionStorage.setItem('lastKnownLocation', JSON.stringify({
              latitude: quickPosition.latitude,
              longitude: quickPosition.longitude,
              timestamp: Date.now()
            }));
          } catch (e) {
            console.error('위치 정보 저장 실패:', e);
          }
        }
        
        // 4. 고정밀 정확한 위치 획득 시도
        console.log('고정밀 위치 정보 요청 중...');
        const precisePosition = await tryGetCurrentPosition(true).catch(() => null);
        
        if (precisePosition && isSubscribed) {
          console.log('고정밀 위치 획득 성공:', precisePosition);
          mapService.current.updateCurrentLocation(precisePosition);
          mapService.current.setCurrentLocation(precisePosition);
          
          // 부모 컴포넌트에 현재 위치 전달
          if (onCurrentLocationUpdate) {
            onCurrentLocationUpdate(precisePosition);
          }
          
          // 실시간 자동 추적을 위해 Follow 모드로 설정
          mapService.current.setLocationTrackingMode('Follow');
          setTrackingMode('Follow');
          setIsFollowingUser(true);
          
          // 세션 스토리지에 위치 저장
          try {
            sessionStorage.setItem('lastKnownLocation', JSON.stringify({
              latitude: precisePosition.latitude,
              longitude: precisePosition.longitude,
              timestamp: Date.now()
            }));
          } catch (e) {
            console.error('위치 정보 저장 실패:', e);
          }
          
          // 이제 실시간 위치 추적은 MapService에서 담당
        }
      } catch (error) {
        console.error('지도 초기화 오류:', error);
        
        // 오류 발생해도 지도는 초기화 (기본 위치 또는 마지막 알려진 위치로)
        const savedLocation = getSavedLocation();
        
        // 저장된 위치가 없으면 대구 좌표 사용
        const defaultPosition = savedLocation || { latitude: 35.8714, longitude: 128.6014 };
        console.log('기본 위치(대구)로 초기화:', defaultPosition);
        
        mapService.current = new MapService(mapRef.current, defaultPosition);
        markerService.current = new MarkerService();
        if (mapServiceRef) {
          mapServiceRef.current = mapService.current;
        }
        
        // 길찾기 버튼 클릭 이벤트 핸들러 등록
        if (markerService.current) {
          markerService.current.handleFindRouteClick(mapService.current.mapInstance);
        }
        
        // 기본 위치에 마커 표시
        if (defaultPosition) {
          mapService.current.setCurrentLocation(defaultPosition);
          
          // 부모 컴포넌트에 기본 위치 전달
          if (onCurrentLocationUpdate) {
            onCurrentLocationUpdate(defaultPosition);
          }
          
          // 실시간 자동 추적을 위해 Follow 모드로 설정
          mapService.current.setLocationTrackingMode('Follow');
          setTrackingMode('Follow');
          setIsFollowingUser(true);
        }
        
        setIsMapReady(true);
      }
    };
    
    initializeMap();

    return () => {
      isSubscribed = false;
      if (mapService.current) {
        // 컴포넌트 언마운트 시 위치 추적 중지
        mapService.current.setLocationTrackingMode('None');
      }
    };
  }, [onCurrentLocationUpdate, mapServiceRef, startLocation]);

  // 위치 추적 모드 변경 감지
  useEffect(() => {
    if (mapService.current && isMapReady) {
      // 컴포넌트 state와 MapService의 추적 모드 동기화
      const serviceMode = mapService.current.getLocationTrackingMode();
      if (serviceMode !== trackingMode) {
        setTrackingMode(serviceMode);
        setIsFollowingUser(serviceMode !== 'None');
      }
    }
  }, [isMapReady, trackingMode]);

  // 필터 변경 감지 및 마커 업데이트
  useEffect(() => {
    if (!mapService.current || !markerService.current || !isMapReady) return;

    const mapInstance = mapService.current.getMapInstance();
    
    // 초기 마커 로딩을 위한 현재 지도 위치 사용
    const center = mapInstance.getCenter();
    const currentLocation = {
      lat: center.lat(),
      lng: center.lng()
    };
    
    console.log('필터 상태 변경:', activeFilters);
    
    // 모든 이전 마커를 제거하고 새로운 마커만 추가하는 방식으로 변경
    // 먼저 현재 표시된 모든 카테고리의 마커를 제거
    [...prevActiveFilters.current].forEach(filter => {
      console.log(`${filter} 마커 제거 중...`);
      markerService.current.removeMarkers(filter);
    });
    
    // 그 다음 새로운 활성화된 필터의 마커만 추가
    const addMarkerPromises = [];
    
    activeFilters.forEach(filter => {
      console.log(`${filter} 마커 추가 중...`);
      // Promise 배열에 추가
      addMarkerPromises.push(
        (async () => {
          try {
            const places = await getPlacesForFilter(filter, currentLocation);
            if (places && places.length > 0) {
              console.log(`${filter} ${places.length}개 발견`);
              await markerService.current.toggleMarkers(mapInstance, places, filter);
            } else {
              console.log(`주변에 ${filter} 데이터가 없습니다.`);
            }
          } catch (error) {
            console.error(`Error fetching places for ${filter}:`, error);
          }
        })()
      );
    });
    
    // 모든 마커 추가 작업이 완료된 후 상태 업데이트
    Promise.all(addMarkerPromises).then(() => {
      // 현재 활성화된 필터 상태 저장
      prevActiveFilters.current = new Set(activeFilters);
    });
    
  }, [activeFilters, isMapReady]); // 지도 이동 시가 아닌 필터 변경 시에만 마커 업데이트

  return (
    <div className="naver-map-container">
      <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
      
      {/* 위치 추적 상태 정보 표시 (디버깅용, 필요 시 사용) */}
      {/* <div className="tracking-mode-indicator" style={{
        position: 'absolute',
        bottom: '80px',
        left: '10px',
        background: 'rgba(255, 255, 255, 0.7)',
        padding: '5px 10px',
        borderRadius: '4px',
        fontSize: '12px',
        zIndex: 100
      }}>
        추적 모드: {trackingMode}
      </div> */}
    </div>
  );
};

export default NaverMap;