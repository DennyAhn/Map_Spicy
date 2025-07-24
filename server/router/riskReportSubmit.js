const express = require('express');
const router = express.Router();
const db = require('../db');

/**
 * @swagger
 * tags:
 *   name: RiskReport
 *   description: 위험구간 신고 API
 */

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

/**
 * @swagger
 * /api/risk-report-submit:
 *   post:
 *     summary: 위험구간 신고 제출
 *     tags: [RiskReport]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reason
 *               - start_lat
 *               - start_lng
 *               - end_lat
 *               - end_lng
 *             properties:
 *               reason:
 *                 type: string
 *                 description: 신고 사유
 *                 example: "가로등이 없어서 너무 어둡습니다"
 *               category:
 *                 type: string
 *                 enum: [좁은 길목, 보도블럭 파손, 쓰레기 무단 투기, CCTV 부재, 가로등 부재, 기타]
 *                 description: 위험 카테고리
 *                 example: "가로등 부재"
 *               start_lat:
 *                 type: number
 *                 format: double
 *                 description: 시작점 위도
 *                 example: 37.5665
 *               start_lng:
 *                 type: number
 *                 format: double
 *                 description: 시작점 경도
 *                 example: 126.9780
 *               end_lat:
 *                 type: number
 *                 format: double
 *                 description: 끝점 위도
 *                 example: 37.5663
 *               end_lng:
 *                 type: number
 *                 format: double
 *                 description: 끝점 경도
 *                 example: 126.9779
 *               user_type:
 *                 type: string
 *                 enum: [women, elderly, wheelchair, general]
 *                 description: 사용자 유형
 *                 example: "women"
 *               age:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 150
 *                 description: 사용자 연령
 *                 example: 25
 *     responses:
 *       201:
 *         description: 위험구간 신고 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 id:
 *                   type: integer
 *                   description: 생성된 신고 ID
 *                 score:
 *                   type: number
 *                   description: 위험도 점수
 *                 level:
 *                   type: string
 *                   enum: [낮음, 중간, 높음]
 *                   description: 위험도 등급
 *       400:
 *         description: 잘못된 요청 (필수 항목 누락)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: 서버 오류
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/', async (req, res) => {
  const {
    reason,
    category,
    start_lat,
    start_lng,
    end_lat,
    end_lng,
    user_type,
    age
  } = req.body;

  // 필수 항목 검증
  if (!reason || !start_lat || !start_lng || !end_lat || !end_lng ) {
    return res.status(400).json({ error: '필수 항목이 누락되었습니다.' });
  }

  const { score, level } = calculateDanger(reason, category);

  try {
    const [result] = await db.query(
      `INSERT INTO complaintsmap 
       (reason, category, start_lat, start_lng, end_lat, end_lng, danger_score, danger_level, user_type, age)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [reason, category, start_lat, start_lng, end_lat, end_lng, score, level, user_type || null, age || null]
    );

    res.status(201).json({ success: true, id: result.insertId, score, level });
  } catch (error) {
    console.error('❌ DB 삽입 오류:', error);
    res.status(500).json({ error: 'DB 삽입 실패' });
  }
});

module.exports = router;
