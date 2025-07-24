const express = require('express');
const router = express.Router();
// 🔄 REFACTOR: 기존 서비스 대신 통합 서비스 사용 (프록시 패턴)
const unifiedPlacesService = require('../../services/unifiedPlacesService');
const { catchAsync, AppError } = require('../../middleware/errorHandler');

/**
 * 🔄 LEGACY PROXY: /api/policePlaces
 * 기존 API 호환성을 위한 프록시 라우터
 * 내부적으로는 통합 서비스를 사용하지만 기존 API 형식 유지
 */
router.get('/', catchAsync(async (req, res, next) => {
  const { lat, lng } = req.query;
  
  // 입력 검증
  if (!lat || !lng) {
    return next(new AppError('lat and lng parameters are required', 400));
  }

  const latitude = parseFloat(lat);
  const longitude = parseFloat(lng);

  if (isNaN(latitude) || isNaN(longitude)) {
    return next(new AppError('lat and lng must be valid numbers', 400));
  }

  console.log('🔄 LEGACY API: /api/policePlaces -> forwarding to unified service');

  try {
    // 통합 서비스 호출
    const result = await unifiedPlacesService.searchPlacesByCategory({
      category: 'police',
      lat: latitude,
      lng: longitude,
      radius: 5000,
      limit: 15
    });

    // 기존 API 응답 형식으로 변환 (하위 호환성)
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

    // 기존 API와 동일한 응답 형식
    res.json({
      documents: legacyResponse,
      meta: {
        total_count: result.data.meta.total,
        is_end: result.data.meta.is_end
      }
    });

  } catch (error) {
    console.error('경찰서 API 요청 실패:', error.message);
    next(error);
  }
}));

module.exports = router;