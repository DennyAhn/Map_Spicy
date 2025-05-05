// server/routes/complaintsMap.js
const express = require('express');
const router = express.Router();
const db = require('../db');

// 위험구간 조회
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(
      // ✅ reason 필드 추가
      'SELECT id, category, start_lat, start_lng, end_lat, end_lng, route_coords, reason,danger_score, danger_level FROM complaintsmap'
    );
    res.json(rows);
  } catch (error) {
    console.error('complaintsmap 조회 실패:', error);
    res.status(500).json({ error: 'DB 에러' });
  } 
});

module.exports = router;
