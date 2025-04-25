import React, { useEffect, useRef, useState, useCallback } from 'react';
 import { useLocation, useNavigate } from 'react-router-dom';
 import MapService from '../../services/MapService';
 import RouteService from '../../services/RouteService';
 import './TrackingScreen.css';
 
 const TrackingScreen = () => {
   // 라우터로부터 전달된 데이터 가져오기
   const location = useLocation();
   const navigate = useNavigate();
   const { startLocation, destination, routeInfo, routeType } = location.state || {};
   
   const mapRef = useRef(null);
   const mapServiceRef = useRef(null);
   const routeServiceRef = useRef(null);
   const [currentLocation, setCurrentLocation] = useState(null);
   const [remainingDistance, setRemainingDistance] = useState(routeInfo?.distance || 0);
   const [estimatedTime, setEstimatedTime] = useState(routeInfo?.time || 0);
   const [progressPercent, setProgressPercent] = useState(0);
   const [isLocationButtonActive, setIsLocationButtonActive] = useState(false);
   const watchPositionId = useRef(null);
   const isFirstRender = useRef(true);
   const totalDistance = useRef(routeInfo?.distance || 0);
 
   // 데이터가 없으면 이전 화면으로 돌아가기
   useEffect(() => {
     if (!startLocation || !destination) {
       alert('경로 정보가 없습니다. 경로 선택 화면으로 이동합니다.');
       navigate('/route');
     }
   }, [startLocation, destination, navigate]);
 
   // 지도 초기화
   useEffect(() => {
     if (mapRef.current && startLocation && destination) {
       const initialCoords = startLocation.coords || {
         latitude: 37.5665,
         longitude: 126.9780
       };
       
       mapServiceRef.current = new MapService(mapRef.current, initialCoords);
       routeServiceRef.current = new RouteService(
         mapServiceRef.current.getMapInstance()
       );
       
       // 초기 경로 그리기
       drawRoute();
       
       // 실시간 위치 추적 시작 (약간의 지연으로 지도가 로드된 후 실행)
       setTimeout(() => {
         startTracking();
       }, 500);
     }
     
     return () => {
       // 컴포넌트 언마운트 시 추적 중지
       stopTracking();
     };
   }, [startLocation, destination]);
 
   // 경로 그리기
   const drawRoute = useCallback(async () => {
     if (!routeServiceRef.current || !startLocation || !destination) return;
     try {
       const result = await routeServiceRef.current.drawRoute(
         startLocation.coords,
         destination.coords,
         routeType || 'normal'
       );
       
       if (isFirstRender.current) {
         setRemainingDistance(result.distance);
         setEstimatedTime(result.time);
         totalDistance.current = result.distance;
         isFirstRender.current = false;
       }
     } catch (error) {
       console.error('경로 그리기 실패:', error);
     }
   }, [startLocation, destination, routeType]);
 
   // 실시간 위치 추적
   const startTracking = () => {
     if (!navigator.geolocation) {
       alert('위치 추적이 지원되지 않는 브라우저입니다.');
       return;
     }
     
     // 초기 줌 레벨은 필요 없음 - panTo에서 처리할 것입니다
     
     watchPositionId.current = navigator.geolocation.watchPosition(
       (position) => {
         const newCoords = {
           latitude: position.coords.latitude,
           longitude: position.coords.longitude
         };
         
         setCurrentLocation(newCoords);
         
         // 지도 중앙을 현재 위치로 이동하고 현재 위치 마커 업데이트
         if (mapServiceRef.current) {
           mapServiceRef.current.updateCurrentLocation(newCoords);
           
           // 첫 위치를 받았을 때만 중심 이동과 줌 설정
           if (!currentLocation) {
             mapServiceRef.current.panTo(newCoords, 17); // 위치 이동과 줌 레벨을 한 번에 설정
           } else {
             // 계속해서 현재 위치를 따라가도록 함
             mapServiceRef.current.panTo(newCoords);
           }
           
           // 목적지까지의 거리 계산 (단순 직선거리)
           if (destination?.coords) {
             const destCoords = destination.coords;
             const distance = calculateDistance(
               newCoords.latitude,
               newCoords.longitude,
               destCoords.latitude,
               destCoords.longitude
             );
             
             // 남은 거리 업데이트
             setRemainingDistance(Math.round(distance));
             
             // 진행률 계산 (간단한 계산)
             const progress = 100 - Math.min(100, Math.round((distance / totalDistance.current) * 100));
             setProgressPercent(progress);
             
             // 예상 도착 시간 업데이트 (평균 도보 속도 기준)
             const walkingSpeedMps = 1.4; // 초당 1.4m (시속 5km)
             const estimatedSeconds = distance / walkingSpeedMps;
             setEstimatedTime(Math.round(estimatedSeconds));
             
             // 목적지에 도착했다면 (20m 이내)
             if (distance < 20) {
               stopTracking();
               alert('목적지에 도착했습니다!');
             }
           }
         }
       },
       (error) => {
         console.error('위치 추적 오류:', error);
         alert('위치 추적에 실패했습니다. GPS 신호를 확인해주세요.');
       },
       {
         enableHighAccuracy: true,
         maximumAge: 0,
         timeout: 5000
       }
     );
   };
 
   const stopTracking = () => {
     if (watchPositionId.current) {
       navigator.geolocation.clearWatch(watchPositionId.current);
       watchPositionId.current = null;
     }
   };
 
   // 두 지점 간의 직선 거리 계산 (Haversine formula)
   const calculateDistance = (lat1, lon1, lat2, lon2) => {
     const R = 6371000; // 지구 반지름 (미터)
     const dLat = deg2rad(lat2 - lat1);
     const dLon = deg2rad(lon2 - lon1);
     const a = 
       Math.sin(dLat/2) * Math.sin(dLat/2) +
       Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
       Math.sin(dLon/2) * Math.sin(dLon/2); 
     const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
     const distance = R * c; // 미터 단위 거리
     return distance;
   };
 
   const deg2rad = (deg) => {
     return deg * (Math.PI/180);
   };
 
   // 거리 형식화
   const formatDistance = (meters) => {
     if (meters < 1000) return `${meters}m`;
     return `${(meters / 1000).toFixed(1)}km`;
   };
 
   // 시간 형식화
   const formatTime = (seconds) => {
     const minutes = Math.floor(seconds / 60);
     if (minutes < 60) return `${minutes}분`;
     const hours = Math.floor(minutes / 60);
     const remainingMinutes = minutes % 60;
     return `${hours}시간 ${remainingMinutes}분`;
   };
 
   const handleBackClick = () => {
     stopTracking();
     navigate(-1);
   };
 
   // 현재 위치로 다시 중심 이동
   const handleRecenter = () => {
     if (mapServiceRef.current && currentLocation) {
       setIsLocationButtonActive(true);
       mapServiceRef.current.panTo(currentLocation, 17); // 현위치로 이동할 때 줌 레벨도 설정
       
       // 3초 후에 활성화 상태 해제
       setTimeout(() => {
         setIsLocationButtonActive(false);
       }, 3000);
     }
   };
 
   return (
     <div className="tracking-screen">
       {/* 상단 바: 목적지 정보 및 뒤로 가기 */}
       <div className="tracking-header">
         <div className="header-content">
           <button className="tracking-back-button" onClick={handleBackClick}>
             <img src="/images/RouteSelectionScreen/back.png" alt="뒤로 가기" />
           </button>
           <div className="destination-info">
             <h3>{destination?.name || '목적지'}</h3>
             <div className="destination-details">
               <div className="detail-item">
                 <svg className="detail-icon" viewBox="0 0 24 24">
                   <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="currentColor"/>
                 </svg>
                 <span>{formatDistance(remainingDistance)} 남음</span>
               </div>
               <div className="detail-item">
                 <svg className="detail-icon" viewBox="0 0 24 24">
                   <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zm.5 5v5.25l4.5 2.67-.75 1.23L11 13V7h1.5z" fill="currentColor"/>
                 </svg>
                 <span>도착 {formatTime(estimatedTime)}</span>
               </div>
             </div>
           </div>
           <div className="header-right-space"></div>
         </div>
       </div>
       
       {/* 지도 영역 */}
       <div className="tracking-map-container" ref={mapRef}></div>
       
       {/* 현재 위치 버튼 - 완전히 독립적인 클래스명 사용 */}
       <div className="tracking-location-btn-container">
         <button 
           className={`tracking-location-btn ${isLocationButtonActive ? 'active' : ''}`}
           onClick={handleRecenter}
         >
           {isLocationButtonActive && <div className="tracking-location-pulse"></div>}
           <img 
             src="/images/RouteSelectionScreen/location.svg" 
             alt="현재 위치로 이동"
           />
         </button>
       </div>
     </div>
   );
 };
 
 export default TrackingScreen; 