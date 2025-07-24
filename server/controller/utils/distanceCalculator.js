const distanceCalculator = {
  calculateDistance: (point1, point2) => {
    const lat1 = parseFloat(point1.latitude);
    const lon1 = parseFloat(point1.longitude);
    const lat2 = parseFloat(point2.latitude);
    const lon2 = parseFloat(point2.longitude);

    console.log(`거리 계산 입력 값: point1(${lat1}, ${lon1}), point2(${lat2}, ${lon2})`);

    if (isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2)) {
      console.error('거리 계산 중 NaN 발생: 입력 값이 유효하지 않습니다.');
      return NaN;
    }

    const R = 6371e3; // 지구 반경 (미터)
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
      Math.cos(φ1) * Math.cos(φ2) *
      Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  },

  calculateDistanceToSegment: (segmentStart, segmentEnd, point) => {
    const A = point.latitude - segmentStart.latitude;
    const B = point.longitude - segmentStart.longitude;
    const C = segmentEnd.latitude - segmentStart.latitude;
    const D = segmentEnd.longitude - segmentStart.longitude;

    const dot = A * C + B * D;
    const len_sq = C * C + D * D;
    let param = -1;

    if (len_sq !== 0) {
      param = dot / len_sq;
    }

    let projectedPoint;

    if (param < 0) {
      projectedPoint = segmentStart;
    } else if (param > 1) {
      projectedPoint = segmentEnd;
    } else {
      projectedPoint = {
        latitude: segmentStart.latitude + param * C,
        longitude: segmentStart.longitude + param * D
      };
    }

    return distanceCalculator.calculateDistance(point, projectedPoint);
  }
};

module.exports = distanceCalculator;
