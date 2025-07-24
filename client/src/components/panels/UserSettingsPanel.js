import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import './UserSettingsPanel.css';

const UserSettingsPanel = ({ onModeChange, selectedMode = '일반' }) => {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const panelRef = useRef(null);
  
  // 패널 바깥 영역 클릭 시 패널 닫기
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target) && isPanelOpen) {
        setIsPanelOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isPanelOpen]);

  // 패널 토글
  const togglePanel = () => {
    setIsPanelOpen(!isPanelOpen);
  };
  
  // 모드 변경 핸들러
  const handleModeChange = (mode) => {
    onModeChange(mode);
    // 모드 변경 후 패널 닫기 (선택사항)
    // setIsPanelOpen(false); 
  };

  // 터치 이벤트 처리
  const handleTouchStart = (e) => {
    // 헤더 영역인 경우에만 스와이프 처리
    if (!e.target.closest('.panel-header')) return;
    
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
      className={`settings-panel ${isPanelOpen ? 'open' : ''}`}
      ref={panelRef}
      onTouchStart={handleTouchStart}
    >
      <div className="panel-header" onClick={togglePanel}>
        <div className="drag-handle" />
        <span className="panel-title">사용자 맞춤 설정</span>
      </div>
      
      <div className="panel-content">
        <div className="settings-section">
          <div className="user-type-buttons">
            <button
              type="button"
              className={`user-type-button ${selectedMode === '일반' ? 'active' : ''}`}
              onClick={() => handleModeChange('일반')}
            >
              <div className="icon-circle">
                <img
                  src="/images/panel/human-male-yellow.svg"
                  alt="일반"
                  className="mode-icon"
                />
              </div>
              <span>일반</span>
            </button>
            
            <button
              type="button"
              className={`user-type-button ${selectedMode === '여성' ? 'active' : ''}`}
              onClick={() => handleModeChange('여성')}
            >
              <div className="icon-circle">
                <img
                  src="/images/panel/human-female-yellow.svg"
                  alt="여성"
                  className="mode-icon"
                />
              </div>
              <span>여성</span>
            </button>
            
            <button
              type="button"
              className={`user-type-button ${selectedMode === '노약자' ? 'active' : ''}`}
              onClick={() => handleModeChange('노약자')}
            >
              <div className="icon-circle">
                <img
                  src="/images/panel/human-wheelchair-yellow.svg"
                  alt="노약자"
                  className="mode-icon"
                />
              </div>
              <span>노약자</span>
            </button>
          </div>
        </div>
        
        <div className="additional-settings">
          <button className="additional-settings-button">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
            상세 설정
          </button>
        </div>
      </div>
    </div>
  );
};

UserSettingsPanel.propTypes = {
  onModeChange: PropTypes.func.isRequired,
  selectedMode: PropTypes.string
};

export default UserSettingsPanel;