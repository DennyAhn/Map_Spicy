const express = require('express');
const router = express.Router();
const pharmacyPlacesService = require('../../services/filter/pharmacyPlacesService');

router.get('/', async (req, res) => {
  try {
    // 클라이언트에서 전달된 위치 정보 추출
    const { lat, lng } = req.query;
    
    // 위치 정보를 서비스로 전달
    const data = await pharmacyPlacesService.getPharmacyPlacesData(lat, lng);
    res.json(data);
  } catch (error) {
    console.error('약국 API 요청 실패:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;