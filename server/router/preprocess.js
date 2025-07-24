const express = require('express');
const router = express.Router();
const axios = require('axios');
const db = require('../db'); // DB 연결

// 민원 등록 (Flask 전처리 + DB 저장)
router.post('/analyze', async (req, res) => {
  const { title, content, category, location } = req.body;
  console.log('[민원 등록 요청 도착]', { title, content, category, location });

  try {
    const response = await axios.post('http://15.164.94.96:5001/preprocess', { content });
    console.log('[Flask 전처리 응답]', response.data);

    const keywords = response.data.keywords;
    const isDanger = response.data.is_danger;

    const conn = await db.getConnection();
    try {
      await conn.query(
        'INSERT INTO complaints (title, content, category, keywords, location, is_danger) VALUES (?, ?, ?, ?, ?, ?)',
        [title, content, category, JSON.stringify(keywords), location || null, isDanger]
      );
    } finally {
      conn.release();
    }

    res.status(201).json({ message: '민원 등록 성공', keywords });
  } catch (error) {
    console.error('민원 등록 실패:', error.message);
    res.status(500).json({ error: '민원 등록 실패' });
  }
});

module.exports = router;
