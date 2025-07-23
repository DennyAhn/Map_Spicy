/**
 * 중앙화된 에러 핸들링 미들웨어
 */

// 커스텀 에러 클래스들
class AppError extends Error {
  constructor(message, statusCode, code = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true; // 운영상 예상 가능한 에러

    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message, details = null) {
    super(message, 400, 'VALIDATION_ERROR');
    this.details = details;
  }
}

class ExternalAPIError extends AppError {
  constructor(message, service = null) {
    super(message, 502, 'EXTERNAL_API_ERROR');
    this.service = service;
  }
}

// 개발/운영 환경별 에러 응답 형태
const sendErrorDev = (err, res) => {
  res.status(err.statusCode || 500).json({
    success: false,
    error: {
      message: err.message,
      code: err.code || 'INTERNAL_ERROR',
      stack: err.stack,
      details: err.details || null
    }
  });
};

const sendErrorProd = (err, res) => {
  // 운영환경에서는 내부 에러 상세정보 숨김
  if (err.isOperational) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        message: err.message,
        code: err.code
      }
    });
  } else {
    // 예상하지 못한 에러는 로그만 남기고 일반적인 메시지 반환
    console.error('UNEXPECTED ERROR:', err);
    res.status(500).json({
      success: false,
      error: {
        message: 'Something went wrong',
        code: 'INTERNAL_ERROR'
      }
    });
  }
};

// 메인 에러 핸들링 미들웨어
const globalErrorHandler = (err, req, res, next) => {
  // 기본값 설정
  err.statusCode = err.statusCode || 500;

  // Google API 관련 에러 변환
  if (err.message.includes('Google API')) {
    err = new ExternalAPIError(err.message, 'Google Places API');
  }

  // Axios 네트워크 에러 변환
  if (err.code === 'ECONNABORTED' || err.code === 'ENOTFOUND') {
    err = new ExternalAPIError('External service is currently unavailable');
  }

  // 환경별 에러 응답
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else {
    sendErrorProd(err, res);
  }
};

// 404 핸들러
const notFoundHandler = (req, res, next) => {
  const err = new AppError(`Route ${req.originalUrl} not found`, 404, 'ROUTE_NOT_FOUND');
  next(err);
};

// 비동기 함수 에러 캐치 헬퍼
const catchAsync = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = {
  AppError,
  ValidationError,
  ExternalAPIError,
  globalErrorHandler,
  notFoundHandler,
  catchAsync
};
