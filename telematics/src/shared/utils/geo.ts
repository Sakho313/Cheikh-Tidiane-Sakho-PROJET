import { GeoPoint } from '../types';

const EARTH_RADIUS_KM = 6371;

function toRadians(deg: number): number {
  return (deg * Math.PI) / 180;
}

function toDegrees(rad: number): number {
  return (rad * 180) / Math.PI;
}

/**
 * Distance du grand cercle (Haversine) entre deux points, en kilomètres.
 */
export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Cap (bearing) initial de A vers B, en degrés [0, 360). */
export function bearingDegrees(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dLng = toRadians(lng2 - lng1);
  const y = Math.sin(dLng) * Math.cos(toRadians(lat2));
  const x =
    Math.cos(toRadians(lat1)) * Math.sin(toRadians(lat2)) -
    Math.sin(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.cos(dLng);
  return (toDegrees(Math.atan2(y, x)) + 360) % 360;
}

/** Distance totale d'une trace ordonnée de points, en kilomètres. */
export function pathDistanceKm(points: GeoPoint[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    if (!prev || !curr) continue;
    total += haversineKm(prev.latitude, prev.longitude, curr.latitude, curr.longitude);
  }
  return total;
}

/** Vrai si le point est dans le cercle (centre + rayon en mètres). */
export function isPointInCircle(
  point: GeoPoint,
  centerLat: number,
  centerLng: number,
  radiusM: number,
): boolean {
  return haversineKm(point.latitude, point.longitude, centerLat, centerLng) * 1000 <= radiusM;
}

/**
 * Vrai si le point est dans le polygone (lancer de rayon).
 * Le polygone est une liste de sommets [longitude, latitude].
 */
export function isPointInPolygon(point: GeoPoint, polygon: Array<[number, number]>): boolean {
  const x = point.longitude;
  const y = point.latitude;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const vi = polygon[i];
    const vj = polygon[j];
    if (!vi || !vj) continue;
    const [xi, yi] = vi;
    const [xj, yj] = vj;
    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}
