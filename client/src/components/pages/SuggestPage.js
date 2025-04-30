// src/pages/SuggestPage.js
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import './SuggestPage.css';

const SuggestPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    title: '',
    category: '',
    location: '',
    description: '',
    photos: [],
    contact: ''
  });

  const [submitted, setSubmitted] = useState(false);

  // 페이지 진입 시 sessionStorage에 저장된 값 불러오기
  useEffect(() => {
    const savedForm = sessionStorage.getItem('suggestForm');
    if (savedForm) {
      setFormData(JSON.parse(savedForm));
    }
  }, []);

  // formData가 변경될 때마다 sessionStorage에 저장
  useEffect(() => {
    sessionStorage.setItem('suggestForm', JSON.stringify(formData));
  }, [formData]);

  // SearchScreen에서 돌아온 경우 주소 값 반영
  useEffect(() => {
    if (location.state?.selectedAddress || location.state?.originalForm) {
      const mergedData = {
        ...(location.state.originalForm || {}), // 원본 데이터
        location: location.state.selectedAddress || '' // 새 주소
      };
      
      setFormData(mergedData);
      sessionStorage.setItem('suggestForm', JSON.stringify(mergedData));
    }
  }, [location.state]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title || !formData.description || !formData.category) {
      alert('제목, 설명, 유형은 필수 입력입니다.');
      return;
    }

    try {
      const response = await axios.post('http://localhost:3001/api/preprocess/analyze', {
        title: formData.title,
        content: formData.description,
        category: formData.category,
        location: formData.location || null
      });

      console.log('전처리 결과:', response.data.keywords);
      setSubmitted(true);

      // 🔸 제출 후 입력 및 저장 초기화
      setFormData({
        title: '',
        category: '',
        location: '',
        description: '',
        photos: [],
        contact: ''
      });
      sessionStorage.removeItem('suggestForm');

      alert('건의사항이 정상적으로 접수되었습니다.');
    } catch (error) {
      console.error('건의 제출 중 오류:', error);
      console.error('응답 상태 코드:', error.response?.status);
      console.error('응답 데이터:', error.response?.data);
      alert('건의 제출에 실패했습니다.');
    }
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    const previews = files.map(file => URL.createObjectURL(file));
    setFormData({ ...formData, photos: [...formData.photos, ...previews] });
  };

  return (
    <div className="suggest-container">
      <button className="back-button-suggest" onClick={() => navigate('/')}>
        ←
      </button>

      <div className="suggest-header">
        <h1>📢 시설물 파손 건의</h1>
        <p>발견하신 시설물 문제를 신속하게 해결할 수 있도록 도와주세요</p>
      </div>

      <form onSubmit={handleSubmit} className="suggest-form">
        {/* 제목 입력 */}
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

        {/* 유형 선택 */}
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

        {/* 위치 입력 */}
        <div className="form-section">
          <label>위치 정보 (선택)</label>
          <div className="location-input">
            <input
              type="text"
              placeholder="주소 또는 건물명 검색"
              value={formData.location}
              readOnly
              // 위치 입력 필드 onClick 핸들러 수정
              onClick={() => navigate('/search', { 
                state: { 
                  fromSuggestPage: true,
                  originalForm: formData  // 현재까지 입력된 모든 데이터 전달
                } 
              })}
            />
            <button type="button" className="map-btn">
              🗺️ 지도에서 위치 지정
            </button>
          </div>
        </div>

        {/* 상세 설명 */}
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

        {/* 사진 업로드 */}
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
    </div>
  );
};

export default SuggestPage;
