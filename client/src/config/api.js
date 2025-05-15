// API 서버 URL 설정
// 배포 환경과 개발 환경에 따라 자동으로 API URL 선택
// 배포 환경에서는 서버 IP 사용, 개발 환경에서는 localhost 사용
const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

export const API_BASE_URL = isDevelopment 
  ? 'http://localhost:3001' 
  : 'http://15.164.94.96:3001';

// 하드코딩된 URL 대신 사용할 프록시 URL
export const PROXY_URL = API_BASE_URL; 