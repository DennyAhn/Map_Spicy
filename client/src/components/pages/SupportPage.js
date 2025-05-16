// src/pages/SupportPage.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './SupportPage.css';
import { API_BASE_URL } from '../../config/api';

const SupportPage = () => {
  const navigate = useNavigate();

  const [inquiryType, setInquiryType] = useState('');
  const [inquiryContent, setInquiryContent] = useState('');

  const faqList = [
    { question: '경로 검색 방법은?', answer: '메인 화면에서 카테고리 버튼을 통해 본인에게 맞는 카테고리를 선택한 뒤, 출발지와 도착지를 선택하면 일반, 안전 경로가 제공됩니다.' },
    { question: '제보는 어떻게 하나요?', answer: '메인 화면의 좌측 패널을 이용하여 건의 함으로 이동 후 상단의 버튼을 통해 시설물 파손, 위험 경로 제보 중 선택하여 제보할 수 있습니다.' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!inquiryType || !inquiryContent) {
      console.log('모든 필드를 채워주세요');
      return;
    }
    
    try {
      await axios.post(`${API_BASE_URL}/api/feature-issues`, {
        title: inquiryType,
        content: inquiryContent
      });
      
      alert('문의가 정상적으로 접수되었습니다.');
      setInquiryType('');
      setInquiryContent('');
    } catch (error) {
      console.error('문의 등록 실패:', error);
      alert('문의 접수에 실패했습니다.');
    }
  };

  return (
    <div className="info-page">
      <button className="back-button-support" onClick={() => navigate('/')}>
        ←
      </button>

      <h1>📞 고객센터</h1>

      <section>
        <h2>자주 묻는 질문</h2>
        <div className="faq-list">
          {faqList.map((faq, index) => (
            <div key={index} className="faq-item">
              <div className="question">Q. {faq.question}</div>
              <div className="answer">A. {faq.answer}</div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2>1:1 문의</h2>
        <form className="inquiry-form" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="문의 종류"
            value={inquiryType}
            onChange={(e) => setInquiryType(e.target.value)}
            required
          />
          <textarea
            placeholder="문의 내용"
            rows="5"
            value={inquiryContent}
            onChange={(e) => setInquiryContent(e.target.value)}
            required
          />
          <button type="submit">문의 보내기</button>
        </form>
      </section>
    </div>
  );
};

export default SupportPage;
