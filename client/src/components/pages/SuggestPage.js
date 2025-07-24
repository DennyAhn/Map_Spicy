// src/pages/SuggestPage.js
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import './SuggestPage.css';


const SuggestPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const mapRef = useRef(null);
  const [mapVisible, setMapVisible] = useState(false);
   

  const [formData, setFormData] = useState({
    title: '',
    category: '',
    location: '',
    description: '',
    photos: [],
    contact: ''
  });

  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!mapVisible || !window.naver || !mapRef.current) return;
  
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
  
          window.naver.maps.Service.reverseGeocode({
            coords: latlng,
            orders: window.naver.maps.Service.OrderType.ADDR
          }, (status, response) => {
            if (status !== window.naver.maps.Service.Status.OK) {
              console.log('주소를 가져오지 못했습니다.');
              return;
            }
  
            const result = response.v2.address;
            const address = result.roadAddress || result.jibunAddress || `${latlng.lat()}, ${latlng.lng()}`;
  
            setFormData(prev => ({
              ...prev,
              location: address
            }));
  
            setMapVisible(false);
          });
        });
      },
      (err) => {
        console.error('현재 위치 오류:', err);
      }
    );
  }, [mapVisible]);
  

  // 기존 sessionStorage 연동
  useEffect(() => {
    const savedForm = sessionStorage.getItem('suggestForm');
    if (savedForm) {
      setFormData(JSON.parse(savedForm));
    }
  }, []);

  useEffect(() => {
    sessionStorage.setItem('suggestForm', JSON.stringify(formData));
  }, [formData]);

  useEffect(() => {
    if (location.state?.selectedAddress || location.state?.originalForm) {
      const mergedData = {
        ...(location.state.originalForm || {}),
        location: location.state.selectedAddress || ''
      };
      setFormData(mergedData);
      sessionStorage.setItem('suggestForm', JSON.stringify(mergedData));
    }
  }, [location.state]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title || !formData.description || !formData.category) {
      console.log('제목, 설명, 유형은 필수 입력입니다.');
      return;
    }

    try {
      const API_BASE_URL = "https://moyak.store";
      const response = await axios.post(`${API_BASE_URL}/api/preprocess/analyze`, {
        title: formData.title,
        content: formData.description,
        category: formData.category,
        location: formData.location || null
      });

      console.log('전처리 결과:', response.data.keywords);
      setSubmitted(true);

      setFormData({
        title: '',
        category: '',
        location: '',
        description: '',
        photos: [],
        contact: ''
      });
      sessionStorage.removeItem('suggestForm');

      console.log('건의사항이 정상적으로 접수되었습니다.');
    } catch (error) {
      console.error('건의 제출 중 오류:', error);
      console.log('건의 제출에 실패했습니다.');
    }
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    const previews = files.map(file => URL.createObjectURL(file));
    setFormData({ ...formData, photos: [...formData.photos, ...previews] });
  };

  return (
    <div className="suggest-container">
      <div className="suggest-header">
        <h1>📢 시설물 파손 제보</h1>
        <p>발견하신 시설물 문제를 신속하게 해결할 수 있도록 도와주세요</p>
      </div>

      <form onSubmit={handleSubmit} className="suggest-form">
        <div className="form-section">
          <label>제목 (필수)</label>
          <input
            type="text"
            placeholder="예) ○○역 n번 출구 엘리베이터 파손"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />
        </div>

        <div className="form-section">
          <label>유형 선택 (필수)</label>
          <div className="category-grid">
            {['엘리베이터', '계단', '도로', '조명', '난간', '기타'].map((cat) => (
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
          <label>위치 정보 (선택)</label>
          <div className="location-input">
            <input
              type="text"
              placeholder="지도를 통해 도로명 주소를 입력해주세요"
              value={formData.location}
              readOnly
            />
            <button type="button" className="map-btn" onClick={() => setMapVisible(true)}>
              🗺️ 위치 선택
            </button>
          </div>
        </div>

        <div className="form-section">
          <label>상세 설명 (필수)</label>
          <textarea
            placeholder="파손 정도, 발생 시간대, 위험성 등 자세히 설명해주세요"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows="5"
            required
          />
        </div>

        <div className="form-section">
          <label>사진 첨부 (최대 5장)</label>
          <div className="photo-upload">
            <label className="upload-btn">
              📸 사진 추가
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
            </label>
            <div className="photo-preview">
              {formData.photos.map((preview, index) => (
                <img key={index} src={preview} alt={`미리보기-${index}`} />
              ))}
            </div>
          </div>
        </div>

        <button type="submit" className="submit-btn">
          건의 제출하기
        </button>

        {submitted && (
          <div className="success-message">
            ✅ 건의사항이 성공적으로 제출되었습니다
          </div>
        )}
      </form>

      {mapVisible && (
        <div className="map-popup-overlay">
          <div className="map-popup-box">
            <button className="close-map-btn" onClick={() => setMapVisible(false)}>✖ 닫기</button>
            <div ref={mapRef} className="select-map"></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuggestPage;