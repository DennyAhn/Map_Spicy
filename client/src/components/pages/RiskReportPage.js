import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import './RiskReportPage.css';

const RiskReportPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const mapRef = useRef(null);
  const [mapVisible, setMapVisible] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [activeLocationField, setActiveLocationField] = useState(null);

  const [formData, setFormData] = useState({
    category: '',
    location1: '',
    location2: '',
    description: '',
    userType: '',
    age: ''
  });

  const [coords, setCoords] = useState({
    start: null,
    end: null
  });

  useEffect(() => {
    if (!mapVisible || !window.naver || !mapRef.current || !activeLocationField) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;

        const map = new window.naver.maps.Map(mapRef.current, {
          center: new window.naver.maps.LatLng(latitude, longitude),
          zoom: 16,
        });

        new window.naver.maps.Marker({
          position: new window.naver.maps.LatLng(latitude, longitude),
          map,
          icon: {
            content: `
              <div style="width: 18px; height: 18px;">
                <img src="/images/RouteSelectionScreen/user.png" 
                     style="width: 100%; height: 100%; object-fit: contain;" />
              </div>
            `,
            anchor: new window.naver.maps.Point(9, 9),
          }
        });

        window.naver.maps.Event.addListener(map, 'click', function (e) {
          const latlng = e.coord;
          const lat = latlng.lat();
          const lng = latlng.lng();

          window.naver.maps.Service.reverseGeocode({
            coords: latlng,
            orders: window.naver.maps.Service.OrderType.ADDR
          }, (status, response) => {
            if (status !== window.naver.maps.Service.Status.OK) return;

            const result = response.v2.address;
            const address = result.roadAddress || result.jibunAddress || `${lat}, ${lng}`;

            setFormData(prev => ({
              ...prev,
              [activeLocationField]: address
            }));

            setCoords(prev => ({
              ...prev,
              [activeLocationField === 'location1' ? 'start' : 'end']: { lat, lng }
            }));

            setMapVisible(false);
            setActiveLocationField(null);
          });
        });
      },
      (err) => {
        console.error(err);
      }
    );
  }, [mapVisible, activeLocationField]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !formData.description ||
      !formData.location1 ||
      !formData.location2 ||
      !formData.userType ||
      (formData.userType !== '노인' && !formData.age)
    ) {
      console.log('모든 필수 정보를 입력해주세요.');
      return;
    }

    try {
      const API_BASE_URL = "https://moyak.store";
      await axios.post(`${API_BASE_URL}/api/risk-report-submit`, {
        reason: formData.description,
        category: formData.category,
        start_lat: coords.start?.lat,
        start_lng: coords.start?.lng,
        end_lat: coords.end?.lat,
        end_lng: coords.end?.lng,
        user_type: formData.userType,
        age: formData.age || null
      });

      setSubmitted(true);

      setFormData({
        category: '',
        location1: '',
        location2: '',
        description: '',
        userType: '',
        age: ''
      });

      setCoords({
        start: null,
        end: null
      });

      sessionStorage.removeItem('suggestForm');

      console.log('건의사항이 정상적으로 접수되었습니다.');
    } catch (error) {
      console.error('건의 제출 중 오류:', error);
    }
  };

  return (
    <div className="report-container">
      <h1 className="report-title">⚠️ 위험경로 제보</h1>

      <div className="report-info-box">
        <h2>📍 위험 경로를 알려주세요</h2>
        <p>두 지점을 선택하고 제보하기를 클릭하면 제보가 완료됩니다.</p>
      </div>

      <form onSubmit={handleSubmit} className="suggest-form">

        {/* 사용자 유형 입력 */}
        <div className="form-section">
          <label>사용자 유형 (필수)</label>
          <div className="category-grid">
            {['남성', '여성', '노인'].map((type) => (
              <button
                type="button"
                key={type}
                className={`category-btn ${formData.userType === type ? 'active' : ''}`}
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    userType: type,
                    age: type === '노인' ? '' : prev.age
                  }))
                }
              >
                {type}
              </button>
            ))}
          </div>

          {formData.userType !== '노인' && formData.userType && (
            <div style={{ marginTop: '10px' }}>
              <input
                type="number"
                min="0"
                placeholder="나이를 입력하세요"
                value={formData.age}
                onChange={(e) => {
                  const newAge = e.target.value;
                  setFormData((prev) => {
                    // 65세 이상일 경우 자동으로 '노인'으로 변경
                    if ((prev.userType === '남성' || prev.userType === '여성') && Number(newAge) >= 65) {
                      return {
                        ...prev,
                        userType: '노인',
                        age: ''
                      };
                    }
                    return {
                      ...prev,
                      age: newAge
                    };
                  });
                }}
                className="text-input"
                required
              />
            </div>
          )}
        </div>

        <div className="form-section">
          <label>유형 선택 (선택)</label>
          <div className="category-grid">
            {['CCTV 부재', '가로등 부재', '좁은 길목', '보도블럭 파손', '노인 경사', '기타'].map((cat) => (
              <button
                type="button"
                key={cat}
                className={`category-btn ${formData.category === cat ? 'active' : ''}`}
                onClick={() => setFormData({ ...formData, category: cat })}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="form-section">
          <label>위치 정보 (필수)</label>
          <div className="location-input">
            <input
              type="text"
              placeholder="시작 지점을 선택하세요"
              value={formData.location1}
              readOnly
            />
            <button type="button" className="map-btn" onClick={() => {
              setActiveLocationField('location1');
              setMapVisible(true);
            }}>
              🗺️ 위치 선택
            </button>
          </div>

          <div className="location-input">
            <input
              type="text"
              placeholder="종료 지점을 선택하세요"
              value={formData.location2}
              readOnly
            />
            <button type="button" className="map-btn" onClick={() => {
              setActiveLocationField('location2');
              setMapVisible(true);
            }}>
              🗺️ 위치 선택
            </button>
          </div>
        </div>

        <div className="form-section">
          <label>상세 설명 (필수)</label>
          <textarea
            placeholder="위험을 느낀 이유에 대해 자세히 설명해주세요"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows="5"
            required
          />
        </div>

        <button type="submit" className="submit-btn">
          위험구역 제보하기
        </button>

        {submitted && (
          <div className="success-message">
            ✅ 의견이 성공적으로 제출되었습니다
          </div>
        )}
      </form>

      {mapVisible && (
        <div className="map-popup-overlay">
          <div className="map-popup-box">
            <button className="close-map-btn" onClick={() => {
              setMapVisible(false);
              setActiveLocationField(null);
            }}>
              ✖ 닫기
            </button>
            <div ref={mapRef} className="select-map"></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RiskReportPage;