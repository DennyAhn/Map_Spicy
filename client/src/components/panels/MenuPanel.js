// src/components/panels/MenuPanel.js
import React from 'react';
import { useNavigate } from 'react-router-dom'; // 추가
import './MenuPanel.css';

// MenuPanel.js 수정
const MenuPanel = ({ isOpen, onClose }) => {
  const navigate = useNavigate();

  const handleBackdropClick = (e) => {
    if (e.target.classList.contains('menu-backdrop')) {
      onClose();
    }
  };

  return (
    <>
      <div
        className={`menu-backdrop ${isOpen ? 'active' : ''}`}
        onClick={handleBackdropClick}
      >
        <div className={`menu-panel ${isOpen ? 'open' : ''}`}>
          <div className="menu-content">
            <h3>메뉴</h3>
            <ul>
              <li onClick={() => { navigate('/about'); onClose(); }}>🚀 서비스 소개</li>
              <li onClick={() => { navigate('/suggest'); onClose(); }}>📢 건의함</li>
              <li onClick={() => { navigate('/terms'); onClose(); }}>📜 설명문</li>
              <li onClick={() => { navigate('/support'); onClose(); }}>📞 고객센터</li>
              <li onClick={() => { navigate('/test'); onClose(); }}>📞 test</li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
};

export default MenuPanel;