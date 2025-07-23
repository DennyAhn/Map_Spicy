// src/components/pages/test.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './test.css';

const RiskReportPage = () => {
  const navigate = useNavigate();
  const [mapVisible, setMapVisible] = useState(false);
  const [positions, setPositions] = useState([]);
  const [saved, setSaved] = useState(false);

  const handleMapClick = (e) => {
    if (positions.length >= 2) return;
    const newPosition = {
      x: e.nativeEvent.offsetX,
      y: e.nativeEvent.offsetY,
    };
    setPositions(prev => [...prev, newPosition]);
  };

  const resetPositions = () => {
    setPositions([]);
    setSaved(false);
  };

  return (
    <div className="test-container">
      <button className="test-back-button" onClick={() => navigate('/')}>←</button>
      <h1 className="test-title">⚠️ 위험군 제보</h1>

      <div className="test-info-box">
        <h2>📍 위험 지역을 알려주세요</h2>
        <p>
          지역 주민들의 안전을 위해 위험하다고 생각되는 지점을 제보해 주세요.<br />
          지도 위에서 2개 지점을 선택하면 제보가 완료됩니다.
        </p>
      </div>

      {!mapVisible && (
        <button className="test-open-map-btn" onClick={() => setMapVisible(true)}>지도 열기</button>
      )}

      {mapVisible && (
        <div className="test-map-section">
          <div className="test-map" onClick={handleMapClick}>
            <div className="test-map-text">🗺️ 지도에서 위험 지점을 클릭하세요</div>
            {positions.map((pos, index) => (
              <div
                key={index}
                className="test-marker"
                style={{ left: `${pos.x - 15}px`, top: `${pos.y - 30}px` }}
              >
                ⚠️
              </div>
            ))}
          </div>

          <div className="test-instruction">
            {positions.length < 2 ? (
              <p>지도에서 {2 - positions.length}개 장소를 더 선택해주세요</p>
            ) : (
              <button className="test-submit-btn" onClick={() => setSaved(true)}>제보 완료</button>
            )}
            {positions.length > 0 && !saved && (
              <button className="test-reset-btn" onClick={resetPositions}>선택 초기화</button>
            )}
          </div>
        </div>
      )}

      {saved && (
        <div className="test-result-box">
          <h3>✅ 제보 완료!</h3>
          <p>당신의 제보는 많은 사람들에게 도움이 될 거예요 🙌</p>
          <p><strong>선택한 위치:</strong> {JSON.stringify(positions)}</p>
        </div>
      )}
    </div>
  );
};

export default RiskReportPage;
