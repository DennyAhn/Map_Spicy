// src/App.js
import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import "./App.css";

/** 컴포넌트 import 경로 변경 */
import MapContainer from "./components/map/MapContainer";
import UserSettingsPanel from "./components/panels/UserSettingsPanel";
import RouteSelectionScreen from "./components/search/RouteSelectionScreen";
import SearchScreen from "./components/search/SearchScreen";

/** 새 페이지 컴포넌트 */
import SuggestionsPage from './components/pages/SuggestPage';
import AboutPage from './components/pages/AboutPage';
import TermsPage from './components/pages/TermsPage';
import SupportPage from './components/pages/SupportPage';
import AdminPage from './components/pages/AdminPage';

import Test from './components/pages/test';

/** 새로운 추적 화면 컴포넌트 */
import TrackingScreen from "./components/tracking/TrackingScreen";

const App = () => {
  const [selectedMode, setSelectedMode] = useState('일반');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSearchingStart, setIsSearchingStart] = useState(false);
  const [isSearchingDestination, setIsSearchingDestination] = useState(false);

  const [startLocation, setStartLocation] = useState(null);
  const [destination, setDestination] = useState(null);

  const handleModeChange = (mode) => {
    setSelectedMode(mode);
  };

  const handleOpenSearchForStart = () => {
    setIsSearchingStart(true);
    setIsSearchingDestination(false);
    setIsSearchOpen(true);
  };

  const handleOpenSearchForDestination = () => {
    setIsSearchingStart(false);
    setIsSearchingDestination(true);
    setIsSearchOpen(true);
  };

  const handleSearchClose = () => {
    setIsSearchOpen(false);
    setIsSearchingStart(false);
    setIsSearchingDestination(false);
  };

  const handleLocationSelected = (location) => {
    if (isSearchingStart) {
      console.log("Setting startLocation:", location);
      setStartLocation(location);
    } else if (isSearchingDestination) {
      console.log("Setting destination:", location);
      setDestination(location);
    }
    handleSearchClose();
  };

  const handleNavigate = (dest) => {
    setDestination(dest);
    setIsSearchOpen(false);
    // 출발지가 아직 설정되지 않은 경우 현재 위치를 자동으로 설정할 수도 있음
  };

  const handleRouteBack = () => {
    setDestination(null);
  };

  /** 지도에서 현재 위치를 받아 업데이트 */
  const updateCurrentLocation = (location) => {
    const locationData = {
      id: 'current-location',
      name: '현재 위치',
      address: '',
      coords: location
    };
    setStartLocation(locationData);
  };

  return (
    <Router>
      <div className="App" style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        margin: 0,
        padding: 0,
        boxSizing: 'border-box'
      }}>
        <Routes>
          <Route path="/" element={
            <>
              {/* 검색 화면 */}
              {isSearchOpen && (
                <SearchScreen
                  onClose={handleSearchClose}
                  onNavigate={handleLocationSelected}
                  isStartLocation={isSearchingStart}
                />
              )}

              {/* 경로 선택 화면 */}
              {destination && !isSearchOpen && (
                <RouteSelectionScreen
                  startLocation={startLocation}
                  destination={destination}
                  onBack={handleRouteBack}
                  onStartLocationEdit={handleOpenSearchForStart}
                  onDestinationEdit={handleOpenSearchForDestination}
                />
              )}

              {/* 지도 화면 (기본 화면) */}
              {!destination && !isSearchOpen && (
                <>
                  <MapContainer
                    selectedMode={selectedMode}
                    isSearchOpen={isSearchOpen}
                    setIsSearchOpen={setIsSearchOpen}
                    onNavigate={handleNavigate}
                    onEditStart={handleOpenSearchForStart}
                    onEditDestination={handleOpenSearchForDestination}
                    onCurrentLocationUpdate={updateCurrentLocation}
                    startLocation={startLocation}
                  />
                  <UserSettingsPanel
                    onModeChange={handleModeChange}
                    selectedMode={selectedMode}
                  />
                </>
              )}
            </>
          }/>

          <Route
            path="/search"
            element={
              <SearchScreen
                onClose={() => window.history.back()}
                onNavigate={handleLocationSelected}
                isStartLocation={isSearchingStart}
              />
            }
          />

          {/* 건의함 페이지 */}
          <Route path="/suggest" element={<SuggestionsPage />} />
          {/* 관리자 페이지 */}
          <Route path="/admin" element={<AdminPage />} />

          {/* 새 페이지 추가 */}
          <Route path="/about" element={<AboutPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/support" element={<SupportPage />} />
          <Route path="/test" element={<Test />} />

          {/* 실시간 추적 화면 */}
          <Route path="/tracking" element={<TrackingScreen />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
