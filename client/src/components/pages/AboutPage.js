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
        <li>✔️ 안전 시설물 정보 제공 
          <p>주변 안전 시설물 데이터를 받아와 사용자에게 위치와 정보를 제공합니다.</p></li>
        <li>✔️ 실시간 시설물 제보 시스템  
          <p>사용자가 직접 위험 요소(고장 난 가로등, 폐쇄된 통로 등)를 실시간 제보할 수 있습니다.</p></li>
        <li>✔️ 위험지역 건의 시스템  
          <p>특정 지역에 대한 위험성 제보 및 개선 요청을 제출할 수 있습니다.</p></li>
        <li>✔️ 안전 이동 경로 제공  
          <p>CCTV, 편의점 등 안전 요소가 포함된 안전한 경로를 사용자에게 제공합니다.</p></li>
        </ul>
      </section>
    </div>
  );
};

export default AboutPage;