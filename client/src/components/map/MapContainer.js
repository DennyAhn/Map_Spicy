// src/components/map/MapContainer.js
import React, { useState, useRef } from 'react';
import NaverMap from './NaverMap';
import MenuPanel from '../panels/MenuPanel';
import './MapContainer.css';

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
    { icon: '/images/map/category/drugstore.png', text: '심야약국' },
    { icon: '/images/map/category/charge.png', text: '휠체어 충전소' },
    { icon: '/images/map/category/noin.png', text: '복지시설' },
    { icon: '/images/map/category/store.png', text: '편의점' },
    { icon: '/images/map/category/oneonenine.png', text: '소방시설' },
    { icon: '/images/map/category/police.png', text: '경찰서' },
    { icon: '/images/map/category/warning.png', text: '외국인 주의구역' },
  ],
};

// 목 데이터 - 실제로는 API에서 가져올 정보
const mockListData = {
  '편의점': [
    { name: 'GS25 성서계대원룸점', address: '달구벌대로203길 58', distance: '120m', visitors: '55', coords: { latitude: 35.8533, longitude: 128.4897 } },
    { name: '이마트24 계대호산원룸점', address: '달구벌대로199길 42', distance: '130m', visitors: '27', coords: { latitude: 35.8524, longitude: 128.4905 } },
    { name: 'GS25 성서동산병원점', address: '달구벌대로 1770', distance: '240m', visitors: '48', coords: { latitude: 35.8548, longitude: 128.4922 } },
  ],
  '소방시설': [
    { name: '서부소방서 성서119안전센터', address: '와룡로 45', distance: '650m', coords: { latitude: 35.8602, longitude: 128.4814 } },
    { name: '대구소방본부', address: '공항로 221', distance: '3.2km', coords: { latitude: 35.8713, longitude: 128.6041 } },
  ],
  '경찰서': [
    { name: '달서경찰서', address: '야외음악당로 99', distance: '1.5km', coords: { latitude: 35.8583, longitude: 128.5236 } },
    { name: '성서지구대', address: '조암남로 5', distance: '850m', coords: { latitude: 35.8517, longitude: 128.5123 } },
  ],
  // 다른 카테고리에 대한 목 데이터도 추가할 수 있음
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
  const mapServiceRef = useRef(null);

  const toggleMenu = () => setIsMenuOpen(prev => !prev);

  const handleFilterClick = (filterText) => {
    setActiveFilters(prev =>
      prev.includes(filterText)
        ? prev.filter(f => f !== filterText)
        : [...prev, filterText]
    );
    
    // 카테고리 버튼 클릭 시 리스트 패널 표시
    if (mockListData[filterText]) {
      if (selectedCategory === filterText && showListPanel) {
        // 같은 카테고리를 다시 클릭하면 패널 닫기
        setShowListPanel(false);
        setSelectedCategory(null);
      } else {
        setListPanelData(mockListData[filterText]);
        setSelectedCategory(filterText);
        setShowListPanel(true);
      }
    } else {
      // 데이터가 없는 카테고리는 패널 닫기
      setShowListPanel(false);
      setSelectedCategory(null);
    }
  };

  const handleMoveToCurrent = () => {
    setIsLocationButtonActive(true);
    if (mapServiceRef.current?.moveToCurrentLocation) {
      mapServiceRef.current.moveToCurrentLocation();
    }
    setTimeout(() => setIsLocationButtonActive(false), 3000);
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
                className={`filter-button ${activeFilters.includes(button.text) ? 'active' : ''} ${selectedCategory === button.text ? 'selected' : ''}`}
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
            <button 
              className="list-panel-close" 
              onClick={() => {
                setShowListPanel(false);
                setSelectedCategory(null);
              }}
            >
              ×
            </button>
          </div>
          <div className="list-panel-content">
            {listPanelData.map((item, index) => (
              <div key={index} className="list-item">
                <div className="list-item-content">
                  <h4 className="list-item-title">{item.name}</h4>
                  <p className="list-item-distance">{item.distance}</p>
                  <p className="list-item-address">{item.address}</p>
                  {item.visitors && (
                    <p className="list-item-visitors">방문자 리뷰 {item.visitors}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 메뉴 패널 */}
      <MenuPanel isOpen={isMenuOpen} onClose={toggleMenu} />
    </div>
  );
};

export default MapContainer;
