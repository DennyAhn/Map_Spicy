const express = require('express');
const router = express.Router();
const db = require('../db');

// POST: 위험 제보 제출 API
router.post('/', async (req, res) => {
  const { reason, category, start_lat, start_lng, end_lat, end_lng } = req.body;

  if (!reason || !start_lat || !start_lng || !end_lat || !end_lng) {
    return res.status(400).json({ error: '필수 항목이 누락되었습니다.' });
  }

  try {
    const [result] = await db.query(
      `INSERT INTO complaintsmap (reason, category, start_lat, start_lng, end_lat, end_lng)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [reason, category, start_lat, start_lng, end_lat, end_lng]
    );

    res.status(201).json({ success: true, id: result.insertId });
  } catch (error) {
    console.error('❌ DB 삽입 오류:', error);
    res.status(500).json({ error: 'DB 삽입 실패' });
  }
});

module.exports = router;
