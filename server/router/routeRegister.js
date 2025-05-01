const express = require('express');
const router = express.Router();
const pool = require('../db');
const tmapService = require('../services/tmapService');

router.post('/', async (req, res) => {
  const { start_lat, start_lng, end_lat, end_lng } = req.body;

  try {
    // 1. 동일한 경로가 이미 존재하는지 확인
    const [existing] = await pool.query(
      `SELECT * FROM complaintsmap WHERE start_lat = ? AND start_lng = ? AND end_lat = ? AND end_lng = ?`,
      [start_lat, start_lng, end_lat, end_lng]
    );

    if (existing.length > 0 && existing[0].route_coords) {
      // 이미 완성된 경로가 있으면 재등록 불필요
      return res.json({ success: true, message: '이미 경로가 존재함', route_coords: JSON.parse(existing[0].route_coords) });
    }

    // 2. 경로 요청
    const start = `${start_lat},${start_lng}`;
    const end = `${end_lat},${end_lng}`;

    const routeData = await tmapService.getRoute(start, end, {
      reqCoordType: "WGS84GEO",
      resCoordType: "WGS84GEO",
      startName: "출발지",
      endName: "도착지",
      searchOption: "0",
      trafficInfo: "N"
    });

    const coords = routeData.features
      .filter(f => f.geometry.type === 'LineString')
      .flatMap(f => f.geometry.coordinates);

    const routeCoordsStr = JSON.stringify(coords);

    // 3. 갱신 또는 삽입
    if (existing.length > 0) {
      await pool.query(
        `UPDATE complaintsmap SET route_coords = ? WHERE id = ?`,
        [routeCoordsStr, existing[0].id]
      );
    } else {
      // INSERT 시 reason 기본값 필요
      await pool.query(
        `INSERT INTO complaintsmap (start_lat, start_lng, end_lat, end_lng, route_coords, reason)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [start_lat, start_lng, end_lat, end_lng, routeCoordsStr, '경로 자동등록']
      );
    }

    res.json({ success: true, message: '경로 저장 또는 갱신 완료', route_coords: coords });
  } catch (err) {
    console.error('경로 저장 실패:', err);
    res.status(500).json({ success: false, message: '경로 저장 중 오류' });
  }
});

module.exports = router;
