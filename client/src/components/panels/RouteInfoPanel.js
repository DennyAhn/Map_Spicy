// src/components/panels/RouteInfoPanel.js
import React, { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import './RouteInfoPanel.css';

const RouteInfoPanel = ({ 
  routeInfo,
  routeType,
  formatDistance,
  formatTime,
  onCCTVToggle,
  onStoresToggle,
  showCCTV,
  showStores,
  onFollowToggle,
  isFollowing,
  startLocation,
  destination
}) => {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const panelRef = useRef(null);
  const panelClassName = `route-info-panel ${routeType === 'safe' ? 'safe-mode' : ''}`;
  const navigate = useNavigate();

  // 패널 클릭 시 토글
  const handlePanelClick = () => {
    setIsPanelOpen(!isPanelOpen);
  };

  // 터치 이벤트 처리
  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    const startY = touch.clientY;

    const handleTouchMove = (e) => {
      const currentY = e.touches[0].clientY;
      const deltaY = startY - currentY;

      if (deltaY > 50) { // 위로 스와이프
        setIsPanelOpen(true);
      } else if (deltaY < -50) { // 아래로 스와이프
        setIsPanelOpen(false);
      }
    };

    const handleTouchEnd = () => {
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };

    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);
  };

  // 추적 화면으로 이동
  const handleFollowClick = () => {
    // 기존 따라가기 로직 대신 추적 화면으로 이동
    navigate('/tracking', { 
      state: { 
        startLocation, 
        destination, 
        routeInfo,
        routeType
      } 
    });
  };

  return (
    <div className="route-info-panel">
      <div className="widget-scroll">
        {routeInfo && !routeInfo.error ? (
          <>
            <div className="route-info-widget disabled"> { /* 토글 버튼으로 만들 필요 없음 */ }
              <span className="widget-label">총 거리</span>
              <span className="widget-value">{formatDistance(routeInfo.distance)}</span>
            </div>
            
            <div className="route-info-widget disabled"> { /* 토글 버튼으로 만들 필요 없음 */ }
              <span className="widget-label">예상 시간</span>
              <span className="widget-value">{formatTime(routeInfo.time)}</span>
            </div>
            
            {/* 안전 경로일 때만 표시되는 추가 위젯들 */}
            {routeType === 'safe' && routeInfo?.safety && (
              <>
                <div className="route-info-widget disabled">
                  <span className="widget-label">경로 안전도</span>
                  <span className="widget-value">{routeInfo.safety.grade}</span>
                </div>
                
                <div 
                  className="route-info-widget" 
                  onClick={() => onCCTVToggle(!showCCTV)} 
                  style={{ cursor: 'pointer' }}
                  data-active={showCCTV}>
                  <div className="widget-content">
                    <span className="widget-label">CCTV 수</span>
                    <span className="widget-value">{routeInfo.cctvCount}개</span>
                  </div>
                  <div className="status-indicator" data-active={showCCTV} />
                </div>
                
                <div 
                  className="route-info-widget" 
                  onClick={() => onStoresToggle(!showStores)} 
                  style={{ cursor: 'pointer' }}
                  data-active={showStores}>
                  <div className="widget-content">
                    <span className="widget-label">편의점 수</span>
                    <span className="widget-value">{routeInfo.storeCount}개</span>
                  </div>
                  <div className="status-indicator" data-active={showStores} />
                </div>
              </>
            )}
          </>
        
          ) : routeInfo?.error ? (
          <div className="route-info-widget" style={{ backgroundColor: '#fff3f3', color: '#ff0000' }}>
            <span className="widget-value">{routeInfo.error}</span>
          </div>
          ) : null}
      </div>
      <button 
         className={`follow-button ${isFollowing ? 'active' : ''}`}
         onClick={handleFollowClick}
       >
        <img 
           src="/images/RouteSelectionScreen/normal.svg" 
           alt="사용자" 
           className="follow-icon"
         />
         따라가기
       </button>
    </div>
  );
};

RouteInfoPanel.propTypes = {
  routeInfo: PropTypes.object,
  routeType: PropTypes.string,
  formatDistance: PropTypes.func,
  onFollowToggle: PropTypes.func,
  isFollowing: PropTypes.bool,
  formatTime: PropTypes.func,
  startLocation: PropTypes.object,
  destination: PropTypes.object
};

export default RouteInfoPanel;