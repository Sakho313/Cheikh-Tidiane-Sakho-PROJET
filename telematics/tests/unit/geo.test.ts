import {
  haversineKm,
  bearingDegrees,
  pathDistanceKm,
  isPointInCircle,
  isPointInPolygon,
} from '../../src/shared/utils/geo';

describe('geo utils', () => {
  describe('haversineKm', () => {
    it('returns ~0 for identical points', () => {
      expect(haversineKm(14.7167, -17.4677, 14.7167, -17.4677)).toBeCloseTo(0, 5);
    });

    it('measures a known distance (Dakar → Thiès ~ 60 km)', () => {
      const d = haversineKm(14.7167, -17.4677, 14.7886, -16.926);
      expect(d).toBeGreaterThan(55);
      expect(d).toBeLessThan(65);
    });
  });

  describe('bearingDegrees', () => {
    it('points east for a due-east move', () => {
      const b = bearingDegrees(0, 0, 0, 1);
      expect(b).toBeCloseTo(90, 0);
    });

    it('stays within [0, 360)', () => {
      const b = bearingDegrees(14.7, -17.4, 14.6, -17.5);
      expect(b).toBeGreaterThanOrEqual(0);
      expect(b).toBeLessThan(360);
    });
  });

  describe('pathDistanceKm', () => {
    it('sums consecutive legs', () => {
      const total = pathDistanceKm([
        { latitude: 14.0, longitude: -17.0 },
        { latitude: 14.1, longitude: -17.0 },
        { latitude: 14.2, longitude: -17.0 },
      ]);
      const leg = haversineKm(14.0, -17.0, 14.1, -17.0);
      expect(total).toBeCloseTo(leg * 2, 3);
    });

    it('returns 0 for a single point', () => {
      expect(pathDistanceKm([{ latitude: 14, longitude: -17 }])).toBe(0);
    });
  });

  describe('isPointInCircle', () => {
    const center = { lat: 14.7167, lng: -17.4677 };

    it('detects a point inside the radius', () => {
      expect(
        isPointInCircle({ latitude: 14.7168, longitude: -17.4678 }, center.lat, center.lng, 300),
      ).toBe(true);
    });

    it('rejects a point outside the radius', () => {
      expect(
        isPointInCircle({ latitude: 14.75, longitude: -17.5 }, center.lat, center.lng, 300),
      ).toBe(false);
    });
  });

  describe('isPointInPolygon', () => {
    // Carré ~ autour de l'origine (coordonnées [lng, lat]).
    const square: Array<[number, number]> = [
      [-1, -1],
      [1, -1],
      [1, 1],
      [-1, 1],
    ];

    it('detects an interior point', () => {
      expect(isPointInPolygon({ latitude: 0, longitude: 0 }, square)).toBe(true);
    });

    it('rejects an exterior point', () => {
      expect(isPointInPolygon({ latitude: 5, longitude: 5 }, square)).toBe(false);
    });
  });
});
