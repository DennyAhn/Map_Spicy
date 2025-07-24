// src/components/map/MapContainer.js
import React, { useState } from 'react';
import NaverMap from './NaverMap';
import './MapContainer.css';

// filterButtons 정의
const filterButtons = {
  '일반': [
    { icon: '/images/icon/normal/gong4.png', text: '공사현장' },
    { icon: '/images/icon/normal/store.png', text: '편의점' },
    { icon: '/images/icon/normal/oneonenine.png', text: '소방시설' },
    { icon: '/images/icon/normal/police.png', text: '경찰서' },
    { icon: '/images/icon/normal/warning.png', text: '범죄주의구간' },
  ],
  '여성': [
    { icon: '/images/icon/women/siren.png', text: '안전비상벨' }, // 'wemen' → 'women' 오타 수정
    { icon: '/images/icon/women/cctv.png', text: 'CCTV' },
    { icon: '/images/icon/women/warning.png', text: '범죄주의구간' },
    { icon: '/images/icon/women/store.png', text: '편의점' },
    { icon: '/images/icon/women/oneonenine.png', text: '소방시설' },
    { icon: '/images/icon/women/police.png', text: '경찰서' },
    { icon: '/images/icon/women/gong4.png', text: '공사현장' },
  ],
  '노약자': [
    { icon: '/images/icon/old/ele.svg', text: '지하철역 엘레베이터' },
    { icon: '/images/icon/old/drugstore.svg', text: '심야약국' },
    { icon: '/images/icon/old/charge.png', text: '휠체어 충전소' },
    { icon: '/images/icon/old/noin.png', text: '복지시설' },
    { icon: '/images/icon/old/warning.png', text: '범죄주의구간' },
    { icon: '/images/icon/old/store.png', text: '편의점' },
    { icon: '/images/icon/old/oneonenine.png', text: '소방시설' },
    { icon: '/images/icon/old/police.png', text: '경찰서' },
    { icon: '/images/icon/old/gong4.png', text: '공사현장' },
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

  const handleFilterClick = (filterText) => {
    console.log('Filter clicked:', filterText);
    setActiveFilters(prev => {
      const newFilters = prev.includes(filterText)
        ? prev.filter(f => f !== filterText)
        : [...prev, filterText];
      return newFilters;
    });
  };

  return (
    <div className="map-container" style={{ overflow: 'hidden' }}>
      {/* 상단바, 검색바, 필터 버튼 등 */}
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
        {/* 검색바 */}
        <div className="search-bar" style={{
          width: '100%',  // 전체 너비 사용
          maxWidth: 'calc(100% - 32px)',  // 양쪽 여백 16px씩
          margin: '0 auto'  // 중앙 정렬
        }}>
          {/* mapspicy 로고 */}
          <div 
            style={{
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              marginRight: '8px'
            }}
          >
            <img 
              src="/images/search_bar/mapspicy.png" 
              alt="mapspicy" 
              style={{ 
                width: '100%',
                height: '100%',
                objectFit: 'contain'
              }}
            />
          </div>

          {/* 메뉴 버튼 */}
          <button 
            className="menu-button" 
            style={{ 
              border: 'none', 
              background: 'none', 
              cursor: 'pointer',
              fontSize: '24px',
              padding: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onClick={(e) => {
              e.stopPropagation();
              // 메뉴 클릭 핸들러 추가
            }}
          >
            ≡
          </button>

          {/* 검색 력창 */}
          <div 
            onClick={() => onEditDestination()} // 도착지 검색 열기
            style={{
              flex: 1,
              cursor: 'pointer',
              height: '100%',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <input 
              type="text" 
              placeholder="장소, 버스, 지하철, 주소 검색" 
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

          {/* 음성 검색 버튼 */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            marginLeft: '8px'
          }}>
            <img 
              src="/images/search_bar/mike.svg" 
              alt="음성 검색" 
              className="voice-icon"
              style={{ 
                width: '24px',
                height: '24px',
                cursor: 'pointer',
                padding: '8px'
              }}
              onClick={(e) => {
                e.stopPropagation();
                // 음성 검색 기능 구현 시 여기에 추가
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
                  style={{
                    width: '24px',
                    height: '24px',
                    objectFit: 'contain'
                  }}
                />
                <span className="filter-button-text">{button.text}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 실제 지도 렌더 */}
      <div className="map-component-container">
        <NaverMap
          selectedMode={selectedMode}
          activeFilters={activeFilters}
          setActiveFilters={setActiveFilters}
          onFilterClick={handleFilterClick}
          onCurrentLocationUpdate={onCurrentLocationUpdate}
          startLocation={startLocation}
        />
      </div>
    </div>
  );
};

export default MapContainer;
