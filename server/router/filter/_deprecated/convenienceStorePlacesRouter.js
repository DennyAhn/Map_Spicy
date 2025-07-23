const express = require('express');
const router = express.Router();
// 🔄 REFACTOR: 기존 서비스 대신 통합 서비스 사용 (프록시 패턴)
const unifiedPlacesService = require('../../services/unifiedPlacesService');
const { catchAsync, AppError } = require('../../middleware/errorHandler');

/**
 * 🔄 LEGACY PROXY: /api/ConvenienceStores
 * 기존 API 호환성을 위한 프록시 라우터
 */
router.get('/', catchAsync(async (req, res, next) => {
  const { lat, lng } = req.query;
  
  if (!lat || !lng) {
    return next(new AppError('lat and lng parameters are required', 400));
  }

  const latitude = parseFloat(lat);
  const longitude = parseFloat(lng);

  if (isNaN(latitude) || isNaN(longitude)) {
    return next(new AppError('lat and lng must be valid numbers', 400));
  }

  console.log('🔄 LEGACY API: /api/ConvenienceStores -> forwarding to unified service');

  try {
    const result = await unifiedPlacesService.searchPlacesByCategory({
      category: 'convenience-store',
      lat: latitude,
      lng: longitude,
      radius: 5000,
      limit: 15
    });

    // 기존 API 응답 형식으로 변환
    const legacyResponse = result.data.places.map(place => ({
      id: place.id,
      place_name: place.place_name,
      category_name: place.category_name,
      phone: place.phone,
      address_name: place.address_name,
      road_address_name: place.road_address_name,
      x: place.location.lng.toString(),
      y: place.location.lat.toString(),
      distance: place.distance
    }));

    res.json({
      documents: legacyResponse,
      meta: {
        total_count: result.data.meta.total,
        is_end: result.data.meta.is_end
      }
    });

  } catch (error) {
    console.error('편의점 API 요청 실패:', error.message);
    next(error);
  }
}));

module.exports = router;