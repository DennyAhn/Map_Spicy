const express = require('express');
const router = express.Router();
const db = require('../db'); // DB 연결

// 1:1 문의 등록 (SupportPage에서 사용)
router.post('/', async (req, res) => {
  const { title, content } = req.body;
  if (!title || !content) {
    return res.status(400).json({ error: '제목과 내용을 모두 입력해야 합니다.' });
  }

  try {
    const conn = await db.getConnection();
    try {
      await conn.query(
        'INSERT INTO feature_issues (title, content) VALUES (?, ?)',
        [title, content]
      );
      res.status(201).json({ message: '1:1 문의 등록 성공' });
    } finally {
      conn.release();
    }
  } catch (error) {
    console.error('1:1 문의 등록 실패:', error.message);
    res.status(500).json({ error: '문의 저장 중 오류가 발생했습니다.' });
  }
});

module.exports = router;