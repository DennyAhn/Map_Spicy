// src/components/panels/RouteInfoPanel.js
import React, { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import './RouteInfoPanel.css';

const RouteInfoPanel = ({ 
  routeInfo,
  routeType,
  formatDistance,
  formatTime
}) => {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const panelRef = useRef(null);
  const panelClassName = `route-info-panel ${routeType === 'safe' ? 'safe-mode' : ''}`;

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

  return (
    <div 
      ref={panelRef}
      className={`settings-panel ${isPanelOpen ? 'open' : ''} ${routeType === 'safe' ? 'safe-mode' : ''}`}
      onClick={handlePanelClick}
      onTouchStart={handleTouchStart}
    >
      <div className="panel-header">
        <div className="drag-handle" />
        <span className="panel-title">경로 정보</span>
      </div>
      <div className="panel-content">
        {routeInfo && !routeInfo.error && (
          <div style={{
            backgroundColor: 'white',
            padding: '15px',
            borderRadius: '8px',
            minWidth: '200px',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <div style={{ 
              fontSize: '16px', 
              fontWeight: 'bold',
              color: '#333'
            }}>
              {routeType === 'normal' ? '도보 경로 정보' : '안전 경로 정보'}
            </div>
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '12px',
              flex: 1
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#666' }}>총 거리:</span>
                <span style={{ color: '#2db400', fontWeight: 'bold' }}>
                  {formatDistance(routeInfo.distance)}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#666' }}>예상 소요 시간:</span>
                <span style={{ color: '#2db400', fontWeight: 'bold' }}>
                  {formatTime(routeInfo.time)}
                </span>
              </div>
              
              {routeType === 'safe' && routeInfo?.safety && (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: '#666' }}>경로 안전도:</span>
                    <span style={{ color: '#4CAF50', fontWeight: 'bold' }}>
                      {routeInfo.safety.grade}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: '#666' }}>CCTV 수:</span>
                    <span style={{ color: '#4CAF50', fontWeight: 'bold' }}>
                      {routeInfo.cctvCount}개
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: '#666' }}>편의점 수:</span>
                    <span style={{ color: '#4CAF50', fontWeight: 'bold' }}>
                      {routeInfo.storeCount}개
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
        
        {routeInfo?.error && (
          <div style={{
            backgroundColor: '#fff3f3',
            padding: '15px',
            borderRadius: '8px',
            color: '#ff0000',
            height: '100%'
          }}>
            {routeInfo.error}
          </div>
        )}
      </div>
    </div>
  );
};

RouteInfoPanel.propTypes = {
  routeInfo: PropTypes.object,
  routeType: PropTypes.string,
  formatDistance: PropTypes.func,
  formatTime: PropTypes.func
};

export default RouteInfoPanel;