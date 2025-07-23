// API 서버 URL 설정
// React의 proxy 설정을 활용하여 개발/배포 환경 구분
const isDevelopment = process.env.NODE_ENV === 'development';

// 환경변수에서 API URL 가져오기 (프로덕션 빌드시 사용)
const REACT_APP_API_URL = process.env.REACT_APP_API_URL;

// 개발 환경에서는 직접 localhost:3001을 사용
// 배포 환경에서는 프로덕션 서버 사용
export const API_BASE_URL = isDevelopment 
  ? 'http://localhost:3001' 
  : REACT_APP_API_URL || 'https://moyak.store'; // 프로덕션 서버

// 레거시 지원용
export const PROXY_URL = API_BASE_URL;
