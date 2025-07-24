// SearchScreen.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import './SearchScreen.css';

const SearchScreen = ({ onClose, onNavigate, isStartLocation = false, mapServiceRef }) => {
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const location = useLocation(); // SuggestPage에서 진입했는지 체크
  const navigate = useNavigate();

  // 카카오 장소 검색 API 호출 (키워드 + 주소)
  const searchPlaces = async (keyword) => {
    if (!keyword.trim()) {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);
    try {
      // 키워드 검색과 주소 검색을 동시에 실행
      const [keywordResponse, addressResponse] = await Promise.all([
        axios.get(
          `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(keyword)}`,
          {
            headers: {
              Authorization: `KakaoAK ${process.env.REACT_APP_KAKAO_API_KEY}`
            }
          }
        ),
        axios.get(
          `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(keyword)}`,
          {
            headers: {
              Authorization: `KakaoAK ${process.env.REACT_APP_KAKAO_API_KEY}`
            }
          }
        )
      ]);

      // 키워드 검색 결과 처리
      const keywordPlaces = keywordResponse.data.documents.map(place => ({
        id: place.id,
        name: place.place_name,
        address: place.road_address_name || place.address_name,
        coords: {
          latitude: parseFloat(place.y),
          longitude: parseFloat(place.x)
        }
      }));

      // 주소 검색 결과 처리
      const addressPlaces = addressResponse.data.documents.map(place => ({
        id: place.id || `addr-${place.address_name}`, // 주소 검색의 경우 고유 ID가 없을 수 있음
        name: place.address_name,
        address: place.road_address?.address_name || place.address_name,
        coords: {
          latitude: parseFloat(place.y),
          longitude: parseFloat(place.x)
        }
      }));

      // 중복 제거를 위해 Set 사용
      const combinedPlaces = [...keywordPlaces, ...addressPlaces];
      const uniquePlaces = Array.from(new Set(combinedPlaces.map(place => JSON.stringify(place))))
        .map(str => JSON.parse(str));

      setSearchResults(uniquePlaces);
    } catch (error) {
      console.error('장소 검색 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 검색어 변경 시 API 호출
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      searchPlaces(searchText);
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchText]);

  // 뒤로가기 버튼 처리 함수 추가
  const handleBackButton = () => {
    // 지도 서비스가 있으면 완전히 재초기화
    if (mapServiceRef && mapServiceRef.current) {
      console.log('검색화면에서 뒤로가기, 지도 재초기화 신호 전송');
      
      // 브라우저 이벤트로 지도 재초기화 트리거
      window.dispatchEvent(new CustomEvent('map-reinitialize'));
      
      // 지연 실행으로 지도 강제 새로고침
      setTimeout(() => {
        if (mapServiceRef.current && mapServiceRef.current.refresh) {
          mapServiceRef.current.refresh(true);
        }
      }, 500);
    }
    
    onClose();
  };

  // handleRouteSelect 함수 수정
  const handleRouteSelect = (place) => {
    if (location.state?.fromSuggestPage) {
      navigate('/suggest', {
        state: { 
          selectedAddress: place.address,
          originalForm: location.state.originalForm // 원본 데이터 포함
        }
      });
    } else {
      onNavigate(place);
    }
  };

  return (
    <div className="search-screen">
      <div className="search-header">
        <button className="back-button" onClick={handleBackButton}>
          <img
            src="/images/search_bar/back.png"
            alt="back-arrow"
            className="back-icon"
            style={{
              width: '24px',
              height: '24px',
              objectFit: 'contain'
            }}
          />
        </button>
        <div className="search-input-container">
          <img
            src="/images/search_bar/mapspicy.png"
            alt="mapspicy"
            className="search-icon"
            style={{
              width: '24px',
              height: '24px',
              objectFit: 'contain',
              marginRight: '8px'
            }}
          />
          <input
            id="search-input"
            type="text"
            placeholder={isStartLocation ? "출발지 검색" : "도착지 검색"}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            autoFocus
          />
          {searchText && (
            <button
              className="clear-button"
              onClick={() => setSearchText('')}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="search-results">
        {searchResults.map((result) => (
          <div key={result.id} className="result-item">
            <div className="result-info">
              <h3 className="result-name">{result.name}</h3>
              <p className="result-address">{result.address}</p>
            </div>
            <button
              className="find-route-button"
              onClick={() => handleRouteSelect(result)}
            >
              {isStartLocation ? "선택" : "길찾기"}
            </button>
          </div>
        ))}
        {!isLoading && searchText && searchResults.length === 0 && (
          <div className="no-results">검색 결과가 없습니다.</div>
        )}
        {isLoading && (
          <div className="loading">검색 중...</div>
        )}
      </div>
    </div>
  );
};

export default SearchScreen;