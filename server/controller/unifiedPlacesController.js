const placesService = require('../services/unifiedPlacesService');
const { catchAsync, AppError } = require('../middleware/errorHandler');

/**
 * 통합 장소 컨트롤러
 * RESTful API 원칙에 따라 모든 장소 관련 요청을 처리
 */

/**
 * 카테고리별 장소 검색
 * @route GET /api/places?category=police&lat=37.5665&lng=126.9780
 */
const getPlacesByCategory = catchAsync(async (req, res, next) => {
  const { category, lat, lng, radius, limit } = req.query;

  // 필수 파라미터 검증
  if (!category) {
    return next(new AppError('category parameter is required', 400, 'MISSING_CATEGORY'));
  }

  if (!lat || !lng) {
    return next(new AppError('lat and lng parameters are required', 400, 'MISSING_LOCATION'));
  }

  // 위도/경도 형식 검증
  const latitude = parseFloat(lat);
  const longitude = parseFloat(lng);

  if (isNaN(latitude) || isNaN(longitude)) {
    return next(new AppError('lat and lng must be valid numbers', 400, 'INVALID_COORDINATES'));
  }

  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return next(new AppError('lat and lng must be valid coordinates', 400, 'INVALID_COORDINATE_RANGE'));
  }

  try {
    // unifiedPlacesService로 검색 요청
    const result = await placesService.searchPlacesByCategory({
      category,
      lat: latitude,
      lng: longitude,
      radius: radius ? parseInt(radius) : undefined,
      limit: limit ? parseInt(limit) : undefined
    });

    // RESTful 응답 형식
    res.status(200).json({
      success: true,
      message: `${category} places retrieved successfully`,
      data: result.data.places,
      meta: {
        ...result.data.meta,
        request_params: {
          category,
          location: { lat: latitude, lng: longitude },
          radius: radius || 5000,
          limit: limit || 15
        },
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    // 서비스 레이어에서 발생한 에러를 적절히 변환
    if (error.message.includes('지원하지 않는 카테고리')) {
      return next(new AppError(error.message, 400, 'UNSUPPORTED_CATEGORY'));
    }

    if (error.message.includes('Kakao API')) {
      return next(new AppError('External service temporarily unavailable', 502, 'EXTERNAL_API_ERROR'));
    }

    // 기타 에러
    next(error);
  }
});

/**
 * 지원되는 카테고리 목록 조회
 * @route GET /api/places/categories
 */
const getSupportedCategories = catchAsync(async (req, res, next) => {
  const categories = placesService.getSupportedCategories();
  
  const categoryDetails = categories.map(category => ({
    id: category,
    name: category,
    keyword: placesService.getCategoryKeyword(category),
    description: getCategoryDescription(category)
  }));

  res.status(200).json({
    success: true,
    message: 'Supported categories retrieved successfully',
    data: categoryDetails,
    meta: {
      total_categories: categories.length,
      timestamp: new Date().toISOString()
    }
  });
});

/**
 * 헬스체크 엔드포인트
 * @route GET /api/places/health
 */
const healthCheck = catchAsync(async (req, res, next) => {
  res.status(200).json({
    success: true,
    message: 'Places service is healthy',
    data: {
      service: 'unified-places-service',
      status: 'operational',
      version: '1.0.0'
    },
    timestamp: new Date().toISOString()
  });
});

/**
 * 카테고리별 설명 반환 (헬퍼 함수)
 */
function getCategoryDescription(category) {
  const descriptions = {
    'police': '경찰서 및 지구대',
    'fire-station': '소방서 및 119안전센터',
    'pharmacy': '약국 및 24시간 약국',
    'convenience-store': '편의점 (24시간 포함)',
    'hospital': '병원 및 응급실',
    'cctv': 'CCTV 및 보안시설',
    'wheelchair-accessible': '휠체어 접근 가능한 시설',
    'women-safe': '여성 안전 시설',
    'elderly-friendly': '노인 친화 시설'
  };

  return descriptions[category] || '기타 시설';
}

module.exports = {
  getPlacesByCategory,
  getSupportedCategories,
  healthCheck
};
