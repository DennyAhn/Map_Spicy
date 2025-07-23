import React, { useState, useRef, useEffect } from "react";

const CurrentLocationComponent = ({ onLocationUpdate }) => {
  const [location, setLocation] = useState(null); // 현재 위치 상태
  const [error, setError] = useState(null); // 에러 메시지 상태
  const [isTracking, setIsTracking] = useState(false);
  const watchIdRef = useRef(null);
  const currentLocationRef = useRef(null); // 최신 위치를 ref에 저장

  const handlePositionSuccess = (position) => {
    const { latitude, longitude, accuracy } = position.coords;

    // 정확도가 너무 낮으면 무시 (50m 초과)
    if (accuracy > 50) {
      console.log("위치 정확도 낮음 (50m 초과), 업데이트 건너뜀:", accuracy);
      return;
    }

    const newCoords = { latitude, longitude };

    // 이전 위치와 거의 동일하면 업데이트 건너뛰기 (약 1.1m 이내)
    if (
      currentLocationRef.current &&
      Math.abs(currentLocationRef.current.latitude - newCoords.latitude) < 1e-5 &&
      Math.abs(currentLocationRef.current.longitude - newCoords.longitude) < 1e-5
    ) {
      return;
    }

    // ref와 state 모두 업데이트
    currentLocationRef.current = newCoords;
    setLocation(newCoords);
    setError(null); // 이전 에러 지우기

    if (onLocationUpdate) {
      onLocationUpdate(newCoords); // 부모 컴포넌트에 객체로 좌표 전달
    }
  };

  const handlePositionError = (err) => {
    console.error(err);
    let errorMessage = "위치 정보를 가져올 수 없습니다";

    // 에러 코드에 따른 더 구체적인 메시지
    switch (err.code) {
      case 1:
        errorMessage =
          "위치 접근 권한이 거부되었습니다. 설정에서 위치 권한을 허용해주세요.";
        break;
      case 2:
        errorMessage = "위치를 확인할 수 없습니다. GPS 신호를 확인해주세요.";
        break;
      case 3:
        errorMessage = "위치 확인 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.";
        break;
      default:
        errorMessage += `: ${err.message}`;
    }

    setError(errorMessage);
    setIsTracking(false);

    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  };

  const startTracking = () => {
    if (!navigator.geolocation) {
      setError("이 브라우저는 Geolocation을 지원하지 않습니다.");
      setIsTracking(false);
      return;
    }

    if (watchIdRef.current !== null) {
      // 이미 추적 중이면 중복 시작 방지
      return;
    }

    setError(null); // 이전 에러 지우기

    watchIdRef.current = navigator.geolocation.watchPosition(
      handlePositionSuccess,
      handlePositionError,
      {
        enableHighAccuracy: true,
        timeout: 10000, // 타임아웃 시간 (10초)
        maximumAge: 0, // 이전 위치 데이터를 사용하지 않음
      }
    );

    setIsTracking(true);
    console.log("위치 추적 시작. Watch ID:", watchIdRef.current);
  };

  const stopTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      console.log("위치 추적 중지. Watch ID:", watchIdRef.current);
      watchIdRef.current = null;
      setIsTracking(false);
      // 선택적으로, 추적 중지 시 위치 상태 초기화
      // setLocation(null);
      // setError(null);
    }
  };

  // 컴포넌트 마운트 시 자동으로 위치 추적 시작
  useEffect(() => {
    startTracking();
    // 컴포넌트 언마운트 시 정리
    return () => {
      stopTracking();
    };
  }, []); // 빈 의존성 배열로 마운트 시 1회 실행

  // 이 컴포넌트는 UI를 렌더링할 필요가 없으므로 null을 반환합니다.
  // 오류 발생 시 콘솔에는 로그가 남지만, 사용자에게 직접적인 UI 피드백은 없습니다.
  // 필요하다면, 오류 상태를 부모 컴포넌트로 전달하여 처리할 수 있습니다.
  if (error) {
    console.error("CurrentLocationComponent Error:", error);
  }

  return null;
};

export default CurrentLocationComponent;