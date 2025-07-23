const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Map Spicy API',
      version: '1.0.0',
      description: '안전한 경로 검색 및 장소 정보 제공 서비스 API',
      contact: {
        name: '맵도널드 Team'
      },
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production' 
          ? 'https://moyak.store' 
          : 'http://localhost:3001',
        description: process.env.NODE_ENV === 'production' 
          ? 'Production server' 
          : 'Development server',
      },
    ],
    components: {
      schemas: {
        // 공통 응답 스키마
        SuccessResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            data: {
              type: 'object'
            }
          }
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            error: {
              type: 'string',
              example: 'Error message'
            }
          }
        },
        // 좌표 스키마
        Coordinates: {
          type: 'string',
          pattern: '^-?[0-9]+\.?[0-9]*,-?[0-9]+\.?[0-9]*$',
          example: '37.5665,126.9780',
          description: '위도,경도 형식'
        },
        // 장소 정보 스키마
        Place: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: '장소 고유 ID'
            },
            name: {
              type: 'string',
              description: '장소 이름'
            },
            address: {
              type: 'string',
              description: '주소'
            },
            location: {
              type: 'object',
              properties: {
                lat: {
                  type: 'number',
                  description: '위도'
                },
                lng: {
                  type: 'number',
                  description: '경도'
                }
              }
            },
            distance: {
              type: 'number',
              description: '검색 위치로부터의 거리(미터)'
            },
            rating: {
              type: 'number',
              description: '평점'
            }
          }
        },
        // 경로 정보 스키마
        RouteData: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean'
            },
            data: {
              type: 'object',
              properties: {
                features: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      geometry: {
                        type: 'object',
                        properties: {
                          type: {
                            type: 'string',
                            example: 'LineString'
                          },
                          coordinates: {
                            type: 'array',
                            items: {
                              type: 'array',
                              items: {
                                type: 'number'
                              }
                            }
                          }
                        }
                      },
                      properties: {
                        type: 'object',
                        properties: {
                          totalDistance: {
                            type: 'number',
                            description: '총 거리(미터)'
                          },
                          totalTime: {
                            type: 'number',
                            description: '총 시간(초)'
                          }
                        }
                      }
                    }
                  }
                },
                safety: {
                  type: 'object',
                  properties: {
                    grade: {
                      type: 'string',
                      enum: ['A', 'B', 'C', 'D'],
                      description: '안전도 등급'
                    },
                    score: {
                      type: 'number',
                      description: '안전도 점수'
                    },
                    cctvCount: {
                      type: 'number',
                      description: 'CCTV 개수'
                    },
                    storeCount: {
                      type: 'number',
                      description: '편의점 개수'
                    }
                  }
                },
                nearbyCCTVs: {
                  type: 'array',
                  items: {
                    $ref: '#/components/schemas/Place'
                  }
                },
                nearbyStores: {
                  type: 'array',
                  items: {
                    $ref: '#/components/schemas/Place'
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  apis: [
    './index.js',
    './router/restfulPlaces.js',
    './router/directionRouter.js',
    './router/geocodeRouter.js',
    './router/complaintsMap.js',
    './router/riskReportSubmit.js'
  ], // 특정 파일들만 명시적으로 포함
};

const specs = swaggerJSDoc(options);

// 디버깅: Swagger 스펙 확인
console.log('📖 Swagger 스펙 생성됨:', Object.keys(specs));
console.log('📖 API 경로 개수:', specs.paths ? Object.keys(specs.paths).length : 0);

module.exports = {
  specs,
  swaggerUi,
  setup: swaggerUi.setup(specs, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Map Spicy API Documentation',
    swaggerOptions: {
      url: '/api-docs/swagger.json',  // JSON 스펙 URL 명시
    }
  })
};
