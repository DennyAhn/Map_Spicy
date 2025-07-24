const express = require("express");
const { getGeocode } = require("../controller/geocodeController");

/**
 * @swagger
 * tags:
 *   name: Geocode
 *   description: 지오코딩 API (주소 ↔ 좌표 변환)
 */

const router = express.Router();

/**
 * @swagger
 * /geocode:
 *   get:
 *     summary: 주소를 좌표로 변환 (지오코딩)
 *     tags: [Geocode]
 *     parameters:
 *       - in: query
 *         name: address
 *         required: true
 *         schema:
 *           type: string
 *         description: 변환할 주소
 *         example: "서울특별시 중구 세종대로 110"
 *     responses:
 *       200:
 *         description: 지오코딩 성공
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
 *                     lat:
 *                       type: number
 *                       description: 위도
 *                       example: 37.5665
 *                     lng:
 *                       type: number
 *                       description: 경도
 *                       example: 126.9780
 *                     address:
 *                       type: string
 *                       description: 정규화된 주소
 *       400:
 *         description: 잘못된 요청
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
router.get("/", getGeocode);

module.exports = router;