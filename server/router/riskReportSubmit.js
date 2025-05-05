const express = require('express');
const router = express.Router();
const db = require('../db');

// 위험 단어별 점수 설정
const dangerKeywordScores = {
  '위험': 3,
  '폭행': 3,
  '공포': 3,
  '불안': 2,
  '사고': 2,
  '어둡다': 2,
  '불빛 없음': 2,
  '혼자': 1,
  '조용하다': 1,
  '사람 없음': 1,
  '소름': 1,
  '위협': 1,
  '불쾌감': 1,
  '낯선 사람': 1,
  '범죄': 2
};

// 카테고리별 기본 점수
const categoryScores = {
  '좁은 길목': 1,
  '보도블럭 파손': 2,
  '쓰레기 무단 투기': 2,
  'CCTV 부재': 2,
  '가로등 부재': 2,
  '기타': 1
};

// 위험도 계산 함수
function calculateDanger(reason = '', category = '') {
  let score = categoryScores[category] || 0;
  const lowerReason = reason.toLowerCase();

  for (const keyword in dangerKeywordScores) {
    if (lowerReason.includes(keyword)) {
      score += dangerKeywordScores[keyword];
    }
  }

  let level = '낮음';
  if (score >= 6) level = '높음';
  else if (score >= 3) level = '중간';

  return { score, level };
}

// POST: 위험 제보 저장
router.post('/', async (req, res) => {
  const { reason, category, start_lat, start_lng, end_lat, end_lng } = req.body;

  if (!reason || !start_lat || !start_lng || !end_lat || !end_lng || !category) {
    return res.status(400).json({ error: '필수 항목이 누락되었습니다.' });
  }

  const { score, level } = calculateDanger(reason, category);

  try {
    const [result] = await db.query(
      `INSERT INTO complaintsmap 
       (reason, category, start_lat, start_lng, end_lat, end_lng, danger_score, danger_level)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [reason, category, start_lat, start_lng, end_lat, end_lng, score, level]
    );

    res.status(201).json({ success: true, id: result.insertId, score, level });
  } catch (error) {
    console.error('❌ DB 삽입 오류:', error);
    res.status(500).json({ error: 'DB 삽입 실패' });
  }
});

module.exports = router;
