# MAPSPICY 🗺️🔥
**Safe Route Navigation & Community Platform for Women, Elderly, and Disabled**


[![React](https://img.shields.io/badge/React-18.2.0-61DAFB?logo=react)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18.17.0-339933?logo=node.js)](https://nodejs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.103.0-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![AWS EC2](https://img.shields.io/badge/AWS%20EC2-FF9900?logo=amazon-aws)](https://aws.amazon.com/ec2/)
[![Google Maps](https://img.shields.io/badge/Google%20Maps-4285F4?logo=googlemaps&logoColor=white)](https://developers.google.com/maps)
[![Kakao Maps](https://img.shields.io/badge/Kakao%20Maps-FFCD00?logo=kakao&logoColor=000000)](https://apis.map.kakao.com/)
[![Naver Map](https://img.shields.io/badge/Naver%20Map-03C75A?logo=naver&logoColor=white)](https://developers.naver.com/docs/map/)

## 🌐 배포된 MAPSPICY 서비스

### 실제 서비스 URL
- **메인 서비스**: https://map-cap-client.vercel.app/
- **관리자 대시보드**: https://my-admin-app-rho.vercel.app
- **API 문서**: [https://api.mapspicy.com/docs](https://api.mapspicy.com/docs)


## 📚 문서 바로가기

| 구분 | 문서 |
| ---- | ---- |
| API 명세 | [API.md](API.md) |
| 배포 가이드 | [DEPLOYMENT.md](DEPLOYMENT.md) |
| 프런트엔드 가이드 | [frontend.md](frontend.md) |
| 백엔드 가이드 | [backend.md](backend.md) |

---

> **2025 Capstone Design Project**  
## 🎯 프로젝트 개요

MAPSPICY는 여성, 노약자, 장애인 등 안전 취약계층을 위한 맞춤형 안전 경로 네비게이션과 시민 참여형 커뮤니티 플랫폼입니다.<br>
단순한 최단거리 길찾기를 넘어서 **사용자별 안전 가중치**를 적용한 최적 안전 경로를 제공하고, 시민들의 적극적인 참여를 통해 지역 안전 데이터를 실시간으로 수집·관리합니다.


---
### 📊 문제 정의 및 현황 분석

**대구시 안전 현황 (2023년 경찰청 데이터)**
- 대구 종합 체감안전도: **77점** (전국 평균 83점 대비 -6점)
- 전국 순위: 2016년 **7위** → 2023년 **14위** (6년간 최저)
- 야간·저조도 구역 안전사고 지속 발생 (가로등 미점등, 시설물 파손 등)
---
<p align="center">
  <img src="https://github.com/user-attachments/assets/3471af7b-0308-4ca0-8806-a636aab68833" width="450" alt="범죄 체감 안전도 그래프" />
</p>

> 출처: 경북매일·영남일보·계명대 신문 (2023–2024)


---
### 🚀 프로젝트 목표

1. **맞춤형 안전 경로 제공**: 사용자 특성별 안전 가중치 적용
2. **시민 참여형 안전 데이터 수집**: 실시간 위험요소 제보 시스템
3. **지역 안전 생태계 구축**: 데이터 기반 안전 개선 순환 구조
4. **실용적 MVP 구현**: 대구·계명대 중심 단계적 확장 모델





---

## ✨ 주요 기능


---


### 🧭 스마트 안전 경로 네비게이션
- **사용자 맞춤형**: 일반/여성/노약자/장애인별 특화 경로 및 시설 카테고리 제공
- **안전 가중치 시스템**: CCTV, 가로등, 편의점, 비상벨 등 안전요소 종합 평가
- **실시간 경로 추적**: GPS 기반 현재 위치 실시간 업데이트
- **안전 등급 표시**: 경로별 안전도 점수화 및 등급 제공


### 🗺️ 인터랙티브 안전 지도
- **다중 마커 시스템**: 24시간 편의점, CCTV, 비상벨, 경찰서 등 실시간 표시
- **카테고리별 필터링**: 사용자 필요에 따른 시설물 선택적 표시
- **주변 시설 안내**: 마커 클릭 시 상세 정보 및 경로 안내 제공


### 👥 시민 참여형 커뮤니티
- **시설물 파손 신고**: 사진 + GPS + 설명을 통한 원클릭 신고 시스템
- **위험 구간 제보**: 지도 상에서 직접 위험 구역 지정 및 제보
- **실시간 상태 추적**: 신고 처리 현황 및 개선 사항 피드백


### 📊 관리자 대시보드
- **신고 관리 시스템**: 미처리 건의사항 우선순위별 분류
- **통계 시각화**: 지역/연령/시간대별 안전 데이터 분석
- **데이터 관리**: 신고 데이터 전처리 및 품질 관리


---


## 🏆 기대 효과 

1. **학생·주민 야간 이동 불안 감소**  
2. **안전 취약계층(여성·노약자·장애인) 보호 강화**  
3. 파손 시설물 **간편한 제보 → 파손 수리 신청 & 지역 안전 강화**  
4. **공개 안전 데이터 시각화**로 지역 공동체 참여 촉진  
5. 소규모 팀이 수행 가능한 **현실적 프로젝트 모델** 제시  




---

## 🛠️ 기술 스택

<p align="center">
  <img src="https://github.com/user-attachments/assets/e446da32-9dec-4df4-b59f-9b05b21c9561" width="900" alt="Tech Stack" />
</p>

---

## 🏗️ 시스템 아키텍처

<p align="center">
  <img src="https://github.com/user-attachments/assets/986f3a15-d9c0-43b7-84c3-d81c6ffb7ee5" width="800" height="600" alt="Architecture Diagram" />
</p>

---

## 🚀 주요 화면

<details>
<summary>메인 대시보드</summary>

<img width="1404" height="878" alt="image" src="https://github.com/user-attachments/assets/dbb97c12-d9b1-4309-bbe3-0780de95a9fb" />
<img width="1404" height="878" alt="image" src="https://github.com/user-attachments/assets/3a197086-8c24-40f9-a0df-45636d5f81da" />

- **사용자 맞춤형 지도**  
- **사용자 맞춤형 카테고리**
- **일반 경로(최단경로)제공**  
- **안전 가중치에 따른 안전 경로제공**  
</details>

<details>
<summary>시설물 파손 신고</summary>

<img width="1404" height="878" alt="image" src="https://github.com/user-attachments/assets/0ca27c8b-5462-4c4f-bd8d-093e09336acd" />

- **간편한 시설물 파손제보**
- **사진 촬영 → GPS기반 원클릭으로 위치 제보 → 설명 작성**   
   
</details>

<details>
<summary>위험 경로 제보</summary>
<img width="1404" height="878" alt="image" src="https://github.com/user-attachments/assets/770e8352-4fa7-4f85-a604-31ae159b1c9f" />

- **지도에서 위험 구간 직접 두 지점 클릭하여 위험 거리제보**   
- **위험 요소 태깅 & 시간대 기록**   
</details>

<details>
<summary>관리자 페이지</summary>
<img width="1116" height="646" alt="image" src="https://github.com/user-attachments/assets/dcfc993a-ce56-4a87-96c6-73b745e45108" />

  
<img width="1123" height="533" alt="image" src="https://github.com/user-attachments/assets/e8c3b91b-c45b-4c57-a018-a99f6bcf4616" />


<img width="1291" height="724" alt="image" src="https://github.com/user-attachments/assets/e583ceb3-5dce-4690-8b7b-03508f465695" />

<img width="1291" height="724" alt="image" src="https://github.com/user-attachments/assets/7aa5a96e-3be7-449f-bb97-7dc84e198828" />

- **신고 목록·우선순위**  
- **지역별 통계 및 나이별 시각화**
- **위험 경로 제보 시각화**
- **위험 경로 건 수에 따라 표시**
</details>

---
## 📋 API 문서

### 주요 엔드포인트

#### 경로 탐색
```
POST /api/routes/search
- 안전 가중치 적용 경로 탐색
- 사용자 유형별 맞춤 경로 제공
```

#### 시설물 정보
```
GET /api/facilities
- 지역별 안전시설물 조회
- 카테고리별 필터링 지원
```

#### 커뮤니티 제보
```
POST /api/reports
- 시설물 파손 및 위험구간 신고
- 이미지 업로드 및 GPS 태깅
```

자세한 API 명세는 [API.md](API.md)를 참고하세요.

---
## 👥 팀 소개

### 개발팀 구성

**🎯 Project Manager & Backend Developer (PM)**
Name: 안 현 진 (Hyunjin Ahn)
- 프로젝트 전체 기획 및 일정 관리
- 요구사항 분석 및 기능 명세 작성
- 안전 가중치 알고리즘 설계 및 구현
- 프로젝트 아키텍처 설계
- UI x UX 기획
- Node.js 서버 개발


**⚙️ FULLSTACK Developer**
Name: 김 경 현 
- 지도 API 연동 및 실시간 데이터 시각화
- Node.js/MapAPI 기반 개발
- 공공API 카테고리 연결 
- RESTful API 개발 
- NGINX 이용한 EC2 배포
- API 통신 및 개발 코드 최적화 작업


**💻 Frontend Developer**
Name: 조 태 석
- React 기반 사용자 인터페이스 개발
- 반응형 웹 디자인 및 UX/UI 개발
- 관리자 페이지 UX/UI 개발



**📊 Data Engineer**
Name: 강 범 석 
- 공공데이터 수집 및 전처리 파이프라인 구축
- 관리자 페이지 개발


---
<div align="center">

**MAPSPICY로 더 안전한 일상을 만들어갑니다** 🛡️✨

Made with ❤️ by MAPSPICY Team

</div>




