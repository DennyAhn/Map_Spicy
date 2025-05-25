// src/components/map/MapContainer.js
import React, { useState, useRef, useEffect } from 'react';
import NaverMap from './NaverMap';
import MenuPanel from '../panels/MenuPanel';
import './MapContainer.css';
import { API_BASE_URL } from '../../config/api';

const filterButtons = {
  '일반': [
    { icon: '/images/map/category/store.png', text: '편의점' },
    { icon: '/images/map/category/oneonenine.png', text: '소방시설' },
    { icon: '/images/map/category/police.png', text: '경찰서' },
    { icon: '/images/map/category/warning.png', text: '외국인 주의구역' },
  ],
  '여성': [
    { icon: '/images/map/category/siren.png', text: '안전비상벨' },
    { icon: '/images/map/category/cctv.png', text: 'CCTV' },
    { icon: '/images/map/category/store.png', text: '편의점' },
    { icon: '/images/map/category/oneonenine.png', text: '소방시설' },
    { icon: '/images/map/category/police.png', text: '경찰서' },
    { icon: '/images/map/category/warning.png', text: '외국인 주의구역' },
  ],
  '노약자': [
    { icon: '/images/map/category/ele.png', text: '지하철역 엘리베이터' },
    { icon: '/images/map/category/drugstore.png', text: '약국' },
    { icon: '/images/map/category/charge.png', text: '휠체어 충전소' },
    { icon: '/images/map/category/noin.png', text: '복지시설' },
    { icon: '/images/map/category/store.png', text: '편의점' },
    { icon: '/images/map/category/oneonenine.png', text: '소방시설' },
    { icon: '/images/map/category/police.png', text: '경찰서' },
    { icon: '/images/map/category/warning.png', text: '외국인 주의구역' },
  ],
};

const MapContainer = ({ 
  selectedMode, 
  isSearchOpen, 
  setIsSearchOpen, 
  onNavigate,
  onEditStart,
  onEditDestination,
  onCurrentLocationUpdate,
  startLocation
}) => {
  const [activeFilters, setActiveFilters] = useState([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLocationButtonActive, setIsLocationButtonActive] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [listPanelData, setListPanelData] = useState([]);
  const [showListPanel, setShowListPanel] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const mapServiceRef = useRef(null);

  useEffect(() => {
    setShowListPanel(activeFilters.length > 0);
  }, [activeFilters]);

  const toggleMenu = () => setIsMenuOpen(prev => !prev);

  // API에서 데이터 가져오기
  const fetchCategoryData = async (category) => {
    setIsLoading(true);
    setError(null);
    console.log(`${category} 데이터 요청 시작...`);
    
    try {
      // 현재 지도 중심 위치 가져오기 (사용자 GPS 위치 대신)
      let latitude = 35.8533;  // 기본 위치
      let longitude = 128.4897;  // 기본 위치
      
      if (mapServiceRef.current) {
        // getMapCenter 메서드 호출 - 현재 지도 중심 위치
        const mapCenter = mapServiceRef.current.getMapCenter();
        if (mapCenter) {
          latitude = mapCenter.latitude;
          longitude = mapCenter.longitude;
          console.log(`지도 중심 위치: 위도 ${latitude}, 경도 ${longitude}`);
        } else {
          // 지도 중심을 가져올 수 없는 경우 GPS 위치 사용 (폴백)
          const currentLocation = mapServiceRef.current.getCurrentLocation();
          if (currentLocation) {
            latitude = currentLocation.latitude;
            longitude = currentLocation.longitude;
            console.log(`GPS 위치 사용: 위도 ${latitude}, 경도 ${longitude}`);
          }
        }
      }
      
      // 지하철역 엘리베이터 또는 외국인 주의구역인 경우 placesApi에서 직접 데이터 가져오기
      if (category === '지하철역 엘리베이터' || category === '외국인 주의구역') {
        // placesApi의 getPlacesForFilter 함수를 가져오기
        const { getPlacesForFilter } = await import('../../services/placesApi');
        
        // 직접 하드코딩된 좌표 데이터 가져오기
        const placesData = await getPlacesForFilter(category, { lat: latitude, lng: longitude });
        
        // 좌표 데이터만 가지고 있으므로 기본 정보 추가
        const formattedData = placesData.map((item, index) => {
          // 각 장소까지의 거리 계산
          const distance = calculateDistance(
            latitude,
            longitude,
            item.latitude,
            item.longitude
          );
          
          return {
            id: `${category}-${index}`,
            name: `${category} ${index + 1}`,
            address: null, // null로 설정하여 주소 표시 안 함
            distance: distance,
            latitude: item.latitude,
            longitude: item.longitude
          };
        });
        
        console.log(`${category} 데이터 변환 완료:`, formattedData.length);
        return formattedData;
      }
      
      // 기타 카테고리는 API 호출로 처리
      // 카테고리에 따른 API 엔드포인트 매핑
      const categoryApiMap = {
        '편의점': '/api/ConvenienceStores',
        '소방시설': '/api/fireStationPlaces',
        '경찰서': '/api/policePlaces',
        '안전비상벨': '/api/womenPlaces',
        'CCTV': '/api/cctvPlaces',
        '약국': '/api/pharmacyPlaces',
        '휠체어 충전소': '/api/wheelChairPlaces',
        '복지시설': '/api/elderlyPlaces',
      };
      
      const apiEndpoint = categoryApiMap[category];
      if (!apiEndpoint) {
        throw new Error(`${category}에 대한 API 엔드포인트가 정의되지 않았습니다`);
      }
      
      const apiUrl = `${API_BASE_URL}${apiEndpoint}?lat=${latitude}&lng=${longitude}`;
      console.log(`API 요청 URL: ${apiUrl}`);
      
      // API 호출
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API 응답 에러: ${response.status} ${errorText}`);
        throw new Error(`데이터를 가져오는데 실패했습니다 (${response.status})`);
      }
      
      const data = await response.json();
      console.log(`${category} 데이터 응답:`, data);
      
      // 데이터의 첫 번째 항목의 모든 속성 출력 (디버깅)
      if (data && data.length > 0) {
        console.log(`첫 번째 항목 세부 정보:`, data[0]);
        console.log(`name 속성: "${data[0].name}"`);
        console.log(`address 속성: "${data[0].address}"`);
        console.log(`distance 속성: "${data[0].distance}"`);
        // 모든 키 출력
        console.log('사용 가능한 속성:', Object.keys(data[0]));
      }
      
      if (!data || data.length === 0) {
        console.log(`${category}에 대한 데이터가 없습니다.`);
        return [];
      }
      
      // 서버에서 이미 모든 정보가 포함된 형태로 반환되므로 그대로 사용
      // 하지만 필요한 속성이 없을 경우를 대비하여 기본값 설정
      const formattedData = data.map(item => ({
        ...item,
        id: item.id || `${category}-${Math.random().toString(36).substr(2, 9)}`,
        name: item.name || `${category}`, 
        address: item.address || '주소 정보 없음',
        distance: item.distance || '거리 정보 없음',
        coords: {
          latitude: item.latitude,
          longitude: item.longitude
        }
      }));
      
      console.log(`${category} 데이터 변환 완료:`, formattedData.length);
      return formattedData;
    } catch (err) {
      console.error(`API 호출 오류 (${category}):`, err);
      setError(err.message);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  // 거리 계산 함수 추가
  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371; // 지구의 반지름 (km)
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    // 거리를 km 또는 m 단위로 반환
    if (distance >= 1) {
      return `${distance.toFixed(1)}km`;
    } else {
      return `${Math.round(distance * 1000)}m`;
    }
  };

  const handleFilterClick = async (filterText) => {
    // 같은 카테고리를 다시 클릭하는 경우
    if (selectedCategory === filterText && showListPanel) {
      // 리스트 패널 닫기
      setShowListPanel(false);
      setSelectedCategory(null);
      
      // 필터에서도 제거하여 마커 삭제 트리거
      setActiveFilters(prev => prev.filter(f => f !== filterText));
    } else {
      // 다른 카테고리를 클릭하는 경우
      
      // 모든 기존 필터 제거하고 새 필터만 추가 (한 번에 하나의 카테고리만 표시)
      setActiveFilters([filterText]);
      
      // 리스트 패널 설정
      setSelectedCategory(filterText);
      setShowListPanel(true);
      setListPanelData([]); // 로딩 전 초기화
      
      try {
        const data = await fetchCategoryData(filterText);
        
        if (data && data.length > 0) {
          console.log(`리스트 패널 데이터 설정: ${data.length}개 항목`);
          setListPanelData(data);
        } else {
          // API 실패 시 기본 데이터 표시
          console.log(`${filterText}에 대한 데이터가 없습니다. 기본 메시지 표시`);
          const fallbackData = [
            { 
              name: `주변에 ${filterText} 정보가 없습니다`, 
              address: '다른 지역에서 다시 시도해보세요', 
              distance: '-' 
            }
          ];
          setListPanelData(fallbackData);
        }
      } catch (err) {
        console.error(`필터 데이터 가져오기 실패: ${err.message}`);
        setError(err.message);
      }

    }
  };
  


  const handleMoveToCurrent = () => {
    setIsLocationButtonActive(true);
  
    if (mapServiceRef.current) {
      // 현재 위치로 이동하고 위치 추적 모드를 Follow로 설정
      mapServiceRef.current.moveToCurrentLocation();
      
      // 명시적으로 위치 추적 모드를 Follow로 설정 (이미 moveToCurrentLocation에 포함되어 있지만 명확하게 표시)
      if (mapServiceRef.current.setLocationTrackingMode) {
        console.log('위치 추적 모드를 Follow로 설정합니다.');
        mapServiceRef.current.setLocationTrackingMode('Follow');
      }
      
      // iOS 디바이스에서 방향 권한 요청
      if (mapServiceRef.current.requestOrientationPermission) {
        mapServiceRef.current.requestOrientationPermission();
      }
    }
    
    setTimeout(() => setIsLocationButtonActive(false), 3000);
  };

  // 길찾기 버튼 클릭 핸들러 추가
  const handleRouteButtonClick = (item) => {
    console.log('길찾기 버튼 클릭:', item);
    
    // item의 구조 확인
    let destinationLat, destinationLng;
    
    if (item.coords && item.coords.latitude && item.coords.longitude) {
      // coords 객체 내에 좌표가 있는 경우
      destinationLat = item.coords.latitude;
      destinationLng = item.coords.longitude;
    } else if (item.latitude && item.longitude) {
      // 최상위 속성으로 좌표가 있는 경우
      destinationLat = item.latitude;
      destinationLng = item.longitude;
    } else {
      console.error('목적지 좌표를 찾을 수 없습니다:', item);
      alert('목적지 좌표 정보가 없어 길찾기를 사용할 수 없습니다.');
      return;
    }
    
    // 현재 위치 가져오기
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const startCoords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        };
        
        // 대상명 인코딩
        const destinationName = encodeURIComponent(item.name || selectedCategory);
        
        console.log('길찾기 정보:', {
          출발: `${startCoords.latitude}, ${startCoords.longitude}`,
          도착: `${destinationLat}, ${destinationLng}`,
          목적지명: destinationName
        });
        
        // 메인 페이지에서 상태 변수로 처리되는 방식이므로 세션 스토리지 사용
        sessionStorage.setItem('route_start_lat', startCoords.latitude);
        sessionStorage.setItem('route_start_lng', startCoords.longitude);
        sessionStorage.setItem('route_goal_lat', destinationLat);
        sessionStorage.setItem('route_goal_lng', destinationLng);
        sessionStorage.setItem('route_dest_name', destinationName);
        
        // 메인 페이지로 이동
        window.location.href = '/';
      },
      (error) => {
        console.error('위치 정보를 가져올 수 없습니다:', error);
        alert('위치 정보를 가져올 수 없습니다. 위치 권한을 확인해주세요.');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  return (
    <div className="map-container" style={{ overflow: 'hidden' }}>
      {/* 상단 바 */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        overflowX: 'hidden',
        WebkitOverflowScrolling: 'touch',
        width: '100%',
        touchAction: 'pan-x',
        height: '170px',
        background: 'transparent',
        pointerEvents: 'auto'
      }}>
        <div className="search-bar" style={{
          width: '90%',
          maxWidth: 'calc(100% - 32px)',
          margin: '0 auto'
        }}>
          <button 
            className="menu-button"
            style={{ cursor: 'pointer' }}
            onClick={(e) => {
              e.stopPropagation();
              toggleMenu();
            }}
          >
            ≡
          </button>

          <div 
            onClick={() => onEditDestination()}
            style={{
              flex: 1,
              cursor: 'pointer',
              height: '70%',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <input 
              type="text" 
              placeholder="원하는 장소, 주소를 입력하세요" 
              className="search-input" 
              readOnly
              style={{
                width: '100%',
                border: 'none',
                outline: 'none',
                fontSize: '16px',
                cursor: 'pointer',
                height: '100%'
              }}
            />
          </div>
        </div>

        {/* 필터 버튼 */}
        <div className="filter-buttons-container">
          <div className="filter-buttons-scroll">
            {filterButtons[selectedMode].map((button, index) => (
              <button 
                key={index} 
                className={`filter-button ${activeFilters.includes(button.text) ? 'active' : ''}`}
                onClick={() => handleFilterClick(button.text)}
              >
                <img 
                  src={button.icon} 
                  alt={button.text}
                  className="filter-button-icon"
                  style={{ width: '20px', height: '20px', objectFit: 'contain' }}
                />
                <span className="filter-button-text">{button.text}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 지도 컴포넌트 */}
      <div className="map-component-container">
        <NaverMap
          selectedMode={selectedMode}
          activeFilters={activeFilters}
          setActiveFilters={setActiveFilters}
          onFilterClick={handleFilterClick}
          onCurrentLocationUpdate={onCurrentLocationUpdate}
          startLocation={startLocation}
          mapServiceRef={mapServiceRef}
        />
      </div>

      {/* 현재 위치 버튼 */}
      <button
        className={`move-to-current-button ${isLocationButtonActive ? 'active' : ''} ${showListPanel ? 'panel-open' : ''}`}
        onClick={handleMoveToCurrent}
      >
        <img src="/images/RouteSelectionScreen/location.svg" alt="현재 위치로 이동" />
      </button>
      
      {/* 카테고리 리스트 패널 */}
      {showListPanel && (
        <div className="list-panel">
          <div className="list-panel-header">
            <h3>
              {selectedCategory} 
              <span className="list-count">({listPanelData.length})</span>
            </h3>
          </div>
          <div className="list-panel-content">
            {isLoading ? (
              <div className="loading-indicator">로딩 중...</div>
            ) : error ? (
              <div className="error-message">
                <p>데이터를 불러오는데 실패했습니다</p>
                <p className="error-details">{error}</p>
                <p className="error-help">서버가 실행 중인지 확인하세요</p>
              </div>
            ) : listPanelData.length === 0 ? (
              <div className="empty-result">
                <p>주변에 {selectedCategory} 정보가 없습니다</p>
                <p>다른 위치에서 다시 시도해보세요</p>
              </div>
            ) : (
              listPanelData.map((item, index) => {
                // 각 아이템 디버깅
                console.log(`리스트 아이템 ${index}:`, item);
                
                return (
                  <div key={index} className="list-item">
                    <div className="list-item-content">
                      <h4 className="list-item-title">
                        {item.name || `${selectedCategory} ${index + 1}`}
                      </h4>
                      <p className="list-item-distance">
                        {item.distance || '거리 정보 없음'}
                      </p>
                      {item.address && (
                        <p className="list-item-address">
                          {item.address}
                        </p>
                      )}
                      {item.phone && item.phone !== '' && (
                        <p className="list-item-phone">전화: {item.phone}</p>
                      )}
                      {item.category && item.category !== selectedCategory && (
                        <p className="list-item-category">분류: {item.category}</p>
                      )}
                    </div>
                    
                    {/* 길찾기 버튼 추가 */}
                    {item.latitude && item.longitude && (
                      <button 
                        className="list-item-route-button"
                        onClick={() => handleRouteButtonClick(item)}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24">
                          <path fill="white" d="M21.71 11.29l-9-9a.996.996 0 00-1.41 0l-9 9a.996.996 0 000 1.41l9 9c.39.39 1.02.39 1.41 0l9-9a.996.996 0 000-1.41zM14 14.5V12h-4v3H8v-4c0-.55.45-1 1-1h5V7.5l3.5 3.5-3.5 3.5z"/>
                        </svg>
                        길찾기
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* 메뉴 패널 */}
      <MenuPanel isOpen={isMenuOpen} onClose={toggleMenu} />
    </div>
  );
};

export default MapContainer;