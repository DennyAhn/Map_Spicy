// src/pages/TermsPage.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import './TermsPage.css';

const TermsPage = () => {
  const navigate = useNavigate();

  return (
    <div className="guide-container">
      <button className="back-button-term" onClick={() => navigate(-1)}>
        ←
      </button>

      <h1 className="guide-title">📜 안전 길찾기 서비스 사용 설명서</h1>

      <section className="guide-section">
        <h2>🚩 기본 사용 방법</h2>
        <div className="instruction-card">
          <div className="step-number">1</div>
          <div className="step-content">
            <h3>목적지 검색</h3>
            <ul>
              <li>지도 상단 검색창 클릭</li>
              <li>장소, 버스, 지하철, 주소 등 입력</li>
              <li>검색 결과에서 위치 선택</li>
            </ul>
          </div>
        </div>

        <div className="instruction-card">
          <div className="step-number">2</div>
          <div className="step-content">
            <h3>경로 선택</h3>
            <ul>
              <li>일반 / 안전 경로 탭 중 선택</li>
              <li>경로에 따라 CCTV / 편의점 등 필터 아이콘 표시</li>
              <li>아이콘을 눌러 상세 정보 확인 가능</li>
            </ul>
          </div>
        </div>

        <div className="instruction-card">
          <div className="step-number">3</div>
          <div className="step-content">
            <h3>따라가기</h3>
            <ul>
              <li>상단 화면을 통해 소요 시간, 거리를 확인 가능</li>
              <li>실시간 위치 정보 제공</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="guide-section">
        <h2>🧭 모드별 필터 기능</h2>
        <div className="feature-grid">
          <div className="feature-card">
            <div className="feature-icon"><img src='./images/panel/human-male.png'></img></div>
            <h3>일반 모드</h3>
            <p>공사구간, 경찰서, 소방시설 등<br/>기본 필터 표시</p>
          </div>
          <div className="feature-card">
          <div className="feature-icon"><img src='./images/panel/human-female.png'></img></div>
            <h3>여성 모드</h3>
            <p>CCTV, 비상벨, 편의점 등<br/>여성 안전시설 필터 제공</p>
          </div>
          <div className="feature-card">
          <div className="feature-icon"><img src='./images/panel/human-wheelchair.png'></img></div>
            <h3>노약자 모드</h3>
            <p>엘리베이터, 복지시설, 약국 등<br/>배리어프리 정보 제공</p>
          </div>
        </div>
      </section>

      <section className="guide-section">
        <h2>📝 건의하기</h2>
        <div className="function-list">
          <div className="function-item">
            <h3>시설물 이상 발견 시</h3>
            <p>
              메뉴 &gt; 건의함 에서<br />
              사진 및 위치 첨부 후 건의 가능
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default TermsPage;
