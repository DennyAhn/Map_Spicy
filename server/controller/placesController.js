const placesService = require('../services/unifiedPlacesService');
const { catchAsync, AppError } = require('../middleware/errorHandler');
const { validatePlaceId } = require('../middleware/validation');

/**
 * 근처 장소 검색
 * @route GET /api/places
 * @param {string} location - 위도,경도 (필수)
 * @param {number} radius - 검색 반경 미터 (선택, 기본값: 1000)
 * @param {string} keyword - 검색 키워드 (선택)
 * @param {string} category - 장소 카테고리 (선택)
 * @param {number} limit - 결과 개수 제한 (선택, 기본값: 20)
 */
const getPlaces = catchAsync(async (req, res, next) => {
  const { location, radius, keyword, category, limit } = req.query;

  // 카테고리별 키워드 매핑
  let searchKeyword = keyword;
  if (category && !keyword) {
    const categoryKeywords = {
      'police': '경찰서',
      'fire-station': '소방서',
      'pharmacy': '약국',
      'convenience-store': '편의점',
      'hospital': '병원',
      'cctv': 'CCTV',
      'wheelchair-accessible': '휠체어',
      'women-safe': '여성안전',
      'elderly-friendly': '노인복지'
    };
    searchKeyword = categoryKeywords[category] || null;
  }

  // 서비스 레이어에서 비즈니스 로직 처리
  const result = await placesService.searchNearbyPlaces({
    location,
    radius,
    keyword: searchKeyword
  });

  // 결과 제한 적용
  if (result.data.results && limit) {
    result.data.results = result.data.results.slice(0, limit);
  }

  // 성공 응답
  res.status(200).json({
    success: true,
    message: 'Places retrieved successfully',
    data: result.data,
    meta: {
      location,
      radius,
      keyword: searchKeyword || null,
      category: category || null,
      limit,
      resultCount: result.data.results?.length || 0,
      totalResults: result.data.results?.length || 0
    }
  });
});

/**
 * 장소 상세 정보
 * @route GET /api/places/:placeId
 */
const getPlaceDetails = [
  validatePlaceId,
  catchAsync(async (req, res, next) => {
    const { placeId } = req.params;

    // TODO: Google Place Details API 호출
    // const details = await placesService.getPlaceDetails(placeId);

    res.status(501).json({
      success: false,
      message: 'Place details not implemented yet',
      data: {
        placeId,
        note: 'This endpoint will return detailed information about a specific place'
      }
    });
  })
];

module.exports = {
  getPlaces,
  getPlaceDetails
};
