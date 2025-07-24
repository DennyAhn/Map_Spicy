// src/components/UserSettingsPanel.js
import React, { useState } from 'react';
import './UserSettingsPanel.css';

const UserSettingsPanel = ({ selectedMode, onModeChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  const buttons = [
    { text: '일반', icon: '/images/panel/human-male.png' },
    { text: '여성', icon: '/images/panel/human-female.png' },
    { text: '노약자', icon: '/images/panel/human-wheelchair.png' },
  ];

  const handleClick = (mode) => {
    onModeChange(mode);
    setIsOpen(false); // 아이콘 클릭 시 리스트 닫기
  };

  // 현재 선택된 모드에 맞는 아이콘 경로 가져오기
  const currentIcon = buttons.find(btn => btn.text === selectedMode)?.icon;

  return (
    <div className="setting-panel">
      <button
        className="setting-toggle-button"
        onClick={() => setIsOpen(!isOpen)}
      >
        <img
          src={currentIcon}
          alt={selectedMode}
          className="mode-toggle-icon"
        />
      </button>

      {isOpen && (
        <div className="setting-button-list">
          {buttons.map((btn) => (
            <button
              key={btn.text}
              type="button"
              className={`setting-button ${selectedMode === btn.text ? 'active' : ''}`}
              onClick={() => handleClick(btn.text)}
            >
              <div className="icon-circle">
                <img
                  src={btn.icon}
                  alt={btn.text}
                  className="mode-icon"
                />
              </div>
              <span>{btn.text}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserSettingsPanel;
