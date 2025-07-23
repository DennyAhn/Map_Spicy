const Joi = require('joi');

// 지원하는 장소 카테고리 정의
const SUPPORTED_CATEGORIES = [
  'police',
  'fire-station', 
  'pharmacy',
  'convenience-store',
  'hospital',
  'cctv',
  'wheelchair-accessible',
  'women-safe',
  'elderly-friendly'
];

// 입력 검증 스키마
const placesQuerySchema = Joi.object({
  location: Joi.string()
    .pattern(/^-?\d+\.?\d*,-?\d+\.?\d*$/)
    .required()
    .messages({
      'string.pattern.base': 'location must be in format "latitude,longitude"',
      'any.required': 'location is required'
    }),
  radius: Joi.number()
    .integer()
    .min(1)
    .max(50000)
    .default(1000)
    .messages({
      'number.min': 'radius must be at least 1 meter',
      'number.max': 'radius cannot exceed 50km'
    }),
  keyword: Joi.string()
    .max(100)
    .optional()
    .messages({
      'string.max': 'keyword cannot exceed 100 characters'
    }),
  category: Joi.string()
    .valid(...SUPPORTED_CATEGORIES)
    .optional()
    .messages({
      'any.only': `category must be one of: ${SUPPORTED_CATEGORIES.join(', ')}`
    }),
  limit: Joi.number()
    .integer()
    .min(1)
    .max(50)
    .default(20)
    .messages({
      'number.min': 'limit must be at least 1',
      'number.max': 'limit cannot exceed 50'
    })
});

// Place ID 검증 스키마
const placeIdSchema = Joi.object({
  placeId: Joi.string()
    .required()
    .min(10)
    .max(100)
    .messages({
      'any.required': 'placeId is required',
      'string.min': 'placeId must be at least 10 characters',
      'string.max': 'placeId cannot exceed 100 characters'
    })
});

// 검증 미들웨어 팩토리
const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false, // 모든 에러를 한번에 반환
      stripUnknown: true // 정의되지 않은 필드 제거
    });

    if (error) {
      const errorDetails = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        details: errorDetails
      });
    }

    // 검증된 데이터로 req.query 교체
    req.query = value;
    next();
  };
};

// 파라미터 검증 미들웨어
const validateParams = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.params, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errorDetails = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        details: errorDetails
      });
    }

    req.params = value;
    next();
  };
};

module.exports = {
  validatePlacesQuery: validateQuery(placesQuerySchema),
  validatePlaceId: validateParams(placeIdSchema),
  SUPPORTED_CATEGORIES
};
