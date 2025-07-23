const express = require('express');
const router = express.Router();
const { 
  getPlacesByCategory, 
  getSupportedCategories, 
  healthCheck 
} = require('../controller/unifiedPlacesController');

/**
 * RESTful Places API Router
 * Base: /api/places
 * 
 * 모든 장소 관련 요청을 하나의 라우터로 통합
 */

/**
 * RESTful Places API Router
 * Base: /api/places
 * 
 * 모든 장소 관련 요청을 하나의 라우터로 통합
 */

/**
 * @swagger
 * tags:
 *   name: Places
 *   description: 장소 정보 검색 API
 */

/**
 * @swagger
 * /api/places/categories:
 *   get:
 *     summary: 지원되는 카테고리 목록 조회
 *     tags: [Places]
 *     responses:
 *       200:
 *         description: 지원되는 카테고리 목록
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     categories:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             example: "police"
 *                           name:
 *                             type: string
 *                             example: "경찰서"
 *                           description:
 *                             type: string
 *                             example: "주변 경찰서 검색"
 */
router.get('/categories', getSupportedCategories);

/**
 * @swagger
 * /api/places/health:
 *   get:
 *     summary: 서비스 상태 확인
 *     tags: [Places]
 *     responses:
 *       200:
 *         description: 서비스 정상 상태
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "healthy"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
router.get('/health', healthCheck);

/**
 * @swagger
 * /api/places:
 *   get:
 *     summary: 카테고리별 장소 검색
 *     tags: [Places]
 *     parameters:
 *       - in: query
 *         name: category
 *         required: true
 *         schema:
 *           type: string
 *           enum: [police, fire-station, convenience-store, women-safe, pharmacy, wheelchair-accessible, elderly-friendly, cctv]
 *         description: 장소 카테고리
 *         example: police
 *       - in: query
 *         name: lat
 *         required: true
 *         schema:
 *           type: number
 *           format: double
 *         description: 위도
 *         example: 37.5665
 *       - in: query
 *         name: lng
 *         required: true
 *         schema:
 *           type: number
 *           format: double
 *         description: 경도
 *         example: 126.9780
 *       - in: query
 *         name: radius
 *         required: false
 *         schema:
 *           type: number
 *           default: 5000
 *           maximum: 10000
 *         description: 검색 반경(미터)
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: number
 *           default: 15
 *           maximum: 15
 *         description: 결과 개수 제한
 *     responses:
 *       200:
 *         description: 장소 검색 결과
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Place'
 *       400:
 *         description: 잘못된 요청 (필수 파라미터 누락)
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
router.get('/', getPlacesByCategory);

module.exports = router;
