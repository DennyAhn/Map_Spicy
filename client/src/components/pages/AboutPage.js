// src/pages/AboutPage.js (서비스 소개)
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './AboutPage.css';

const AboutPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  return (
    <div className="info-page">
      <button className="back-button-about" onClick={() => navigate('/')}>
        ←
      </button>

      <h1>🚀 서비스 소개</h1>

      <section>
        <h2>기능 소개</h2>
        <ul className="feature-list">
          <li>✔️ 위험군 인식 경로 탐색</li>
          <li>✔️ 실시간 시설물 제보 시스템</li>
          <li>✔️ 안전 이동 경로 제공</li>
        </ul>
      </section>
    </div>
  );
};

export default AboutPage;