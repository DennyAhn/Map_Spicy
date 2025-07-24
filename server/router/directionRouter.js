const express = require("express");
const directionController = require("../controller/directionController");

/**
 * @swagger
 * tags:
 *   name: Direction
 *   description: 경로 검색 API
 */

const router = express.Router();

/**
 * @swagger
 * /direction/normal-direction:
 *   get:
 *     summary: 일반 최단경로 검색
 *     tags: [Direction]
 *     parameters:
 *       - in: query
 *         name: start
 *         required: true
 *         schema:
 *           $ref: '#/components/schemas/Coordinates'
 *         description: 출발지 좌표 (위도,경도)
 *         example: "37.5665,126.9780"
 *       - in: query
 *         name: goal
 *         required: true
 *         schema:
 *           $ref: '#/components/schemas/Coordinates'
 *         description: 목적지 좌표 (위도,경도)
 *         example: "37.5663,126.9779"
 *     responses:
 *       200:
 *         description: 경로 검색 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RouteData'
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
router.get('/normal-direction', directionController.getNormalRoute);

/**
 * @swagger
 * /direction/safe-direction:
 *   get:
 *     summary: 안전 경로 검색 (CCTV, 편의점 고려)
 *     tags: [Direction]
 *     parameters:
 *       - in: query
 *         name: start
 *         required: true
 *         schema:
 *           $ref: '#/components/schemas/Coordinates'
 *         description: 출발지 좌표 (위도,경도)
 *         example: "37.5665,126.9780"
 *       - in: query
 *         name: goal
 *         required: true
 *         schema:
 *           $ref: '#/components/schemas/Coordinates'
 *         description: 목적지 좌표 (위도,경도)
 *         example: "37.5663,126.9779"
 *     responses:
 *       200:
 *         description: 안전 경로 검색 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RouteData'
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
router.get('/safe-direction', directionController.getSafeRoute);

module.exports = router;