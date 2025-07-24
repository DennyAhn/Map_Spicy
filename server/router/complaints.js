const express = require('express');
const router = express.Router();
const db = require('../db'); // DB 연결

// 민원 조회 (AdminPage에서 조회할 때 사용)
router.get('/', async (req, res) => {
  const conn = await db.getConnection();
  try {
    const [rows] = await conn.query('SELECT * FROM complaints ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    console.error('민원 조회 실패:', err);
    res.status(500).json({ error: 'DB 조회 실패' });
  } finally {
    conn.release();
  }
});

module.exports = router;
