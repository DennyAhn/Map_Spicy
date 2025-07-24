// server/routes/complaintsMap.js
const express = require('express');
const router = express.Router();
const db = require('../db');

/**
 * @swagger
 * tags:
 *   name: ComplaintsMap
 *   description: 위험구간 관리 API
 */

/**
 * @swagger
 * /api/complaintsmap:
 *   get:
 *     summary: 위험구간 목록 조회
 *     tags: [ComplaintsMap]
 *     responses:
 *       200:
 *         description: 위험구간 목록 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     description: 위험구간 ID
 *                   category:
 *                     type: string
 *                     description: 위험 카테고리
 *                   start_lat:
 *                     type: number
 *                     description: 시작점 위도
 *                   start_lng:
 *                     type: number
 *                     description: 시작점 경도
 *                   end_lat:
 *                     type: number
 *                     description: 끝점 위도
 *                   end_lng:
 *                     type: number
 *                     description: 끝점 경도
 *                   route_coords:
 *                     type: string
 *                     description: 경로 좌표 (JSON 문자열)
 *                   reason:
 *                     type: string
 *                     description: 신고 사유
 *                   danger_score:
 *                     type: number
 *                     description: 위험도 점수
 *                   danger_level:
 *                     type: string
 *                     description: 위험도 등급
 *                   created_at:
 *                     type: string
 *                     format: date-time
 *                     description: 등록일시
 *                   user_type:
 *                     type: string
 *                     description: 사용자 유형
 *                   age:
 *                     type: integer
 *                     description: 사용자 연령
 *       500:
 *         description: 서버 오류
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(
      // ✅ reason 필드 추가
      'SELECT id, category, start_lat, start_lng, end_lat, end_lng, route_coords, reason,danger_score, danger_level, created_at, user_type, age FROM complaintsmap'
    );
    res.json(rows);
  } catch (error) {
    console.error('complaintsmap 조회 실패:', error);
    res.status(500).json({ error: 'DB 에러' });
  } 
});

module.exports = router;
