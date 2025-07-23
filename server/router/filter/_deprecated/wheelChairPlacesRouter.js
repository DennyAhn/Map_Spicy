const express = require('express');
const router = express.Router();
const wheelChairPlacesService = require('../../services/filter/wheelChairPlacesService');

router.get('/', async (req, res) => {
  try {
    // 클라이언트에서 전달된 위치 정보 추출
    const { lat, lng } = req.query;
    
    // 위치 정보를 서비스로 전달
    const data = await wheelChairPlacesService.getWheelChairPlacesData(lat, lng);
    res.json(data);
  } catch (error) {
    console.error('휠체어 충전소 API 요청 실패:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
