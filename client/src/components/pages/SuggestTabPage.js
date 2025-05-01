import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import RiskReportPage from './RiskReportPage';
import SuggestPage from './SuggestPage';
import './SuggestTabPage.css';

const SuggestTabsPage = () => {
  const [activeTab, setActiveTab] = useState('facility');
  const navigate = useNavigate();

  return (
    <div className="suggest-tabs-container">
      <button className="report-back-button" onClick={() => navigate('/')}>←</button>
      <div className="tab-buttons">
        <button 
          className={activeTab === 'facility' ? 'active' : ''} 
          onClick={() => setActiveTab('facility')}
        >
          시설물 파손 제보
        </button>
        <button 
          className={activeTab === 'risk' ? 'active' : ''} 
          onClick={() => setActiveTab('risk')}
        >
          위험경로 제보
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'facility' ? <SuggestPage /> : <RiskReportPage />}
      </div>
    </div>
  );
};

export default SuggestTabsPage;
