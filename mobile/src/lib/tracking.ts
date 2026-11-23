/**
 * Hike tracking maths. Pure functions only (no React Native imports) so they can be unit tested.
 * GPS under forest cover is noisy, so every raw point is filtered before it counts.
 */

export interface TrackPoint {
  lat: number;
  lng: number;
  /** metres above sea level, null if the phone didn't report it */
  alt: number | null;
  /** epoch millis */
  t: number;
  /** horizontal accuracy in metres, null if unknown */
  accuracy: number | null;
}

export interface Track {
  points: TrackPoint[];
  distanceM: number;
  gainM: number;
  /** altitude the next climb is measured from (hysteresis reference) */
  refAlt: number | null;
}

/** Points the phone itself says are worse than this are ignored. */
export const MAX_ACCURACY_M = 35;
/** Moving less than this since the last point is treated as standing still / GPS jitter. */
export const MIN_STEP_M = 3;
/** 8 m/s is 29 km/h. Faster "movement" on a mountain trail is a GPS jump, not a hiker. */
export const MAX_SPEED_MS = 8;
/** A climb only counts once altitude has moved this far from the reference (filters altimeter noise). */
export const ELEVATION_HYSTERESIS_M = 3;

export const emptyTrack = (): Track => ({ points: [], distanceM: 0, gainM: 0, refAlt: null });

/** Great-circle distance between two points in metres. */
export function haversineM(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371000;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Compass bearing from a to b in degrees (0 = north, 90 = east). */
export function bearing(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const rad = (d: number) => (d * Math.PI) / 180;
  const y = Math.sin(rad(b.lng - a.lng)) * Math.cos(rad(b.lat));
  const x = Math.cos(rad(a.lat)) * Math.sin(rad(b.lat)) - Math.sin(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.cos(rad(b.lng - a.lng));
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

export interface AddPointResult {
  track: Track;
  accepted: boolean;
}

/**
 * Add a raw GPS reading to the track if it passes the filters.
 * Returns the same track (unchanged) when the point is rejected.
 */
export function addPoint(track: Track, p: TrackPoint, opts: { maxSpeedMs?: number } = {}): AddPointResult {
  const maxSpeed = opts.maxSpeedMs ?? MAX_SPEED_MS;

  if (p.accuracy != null && p.accuracy > MAX_ACCURACY_M) return { track, accepted: false };

  const last = track.points[track.points.length - 1];
  if (!last) {
    return { track: { points: [p], distanceM: 0, gainM: 0, refAlt: p.alt }, accepted: true };
  }

  const d = haversineM(last, p);
  if (d < MIN_STEP_M) return { track, accepted: false };
  const dt = (p.t - last.t) / 1000;
  if (dt > 0 && d / dt > maxSpeed) return { track, accepted: false };

  let { gainM, refAlt } = track;
  if (p.alt != null) {
    if (refAlt == null) {
      refAlt = p.alt;
    } else {
      const delta = p.alt - refAlt;
      if (delta >= ELEVATION_HYSTERESIS_M) {
        gainM += delta;
        refAlt = p.alt;
      } else if (delta <= -ELEVATION_HYSTERESIS_M) {
        refAlt = p.alt; // going down: just move the reference, no gain
      }
    }
  }

  return { track: { points: [...track.points, p], distanceM: track.distanceM + d, gainM, refAlt }, accepted: true };
}

/** Keep at most `max` points (always the first and last), so a saved route stays small. */
export function downsample<T>(items: T[], max = 400): T[] {
  if (items.length <= max) return items;
  const out: T[] = [];
  const step = (items.length - 1) / (max - 1);
  for (let i = 0; i < max; i++) out.push(items[Math.round(i * step)]);
  return out;
}

/** Altitudes along the track resampled to `n` values for the elevation chart. Empty if no altitude data. */
export function elevationProfile(points: TrackPoint[], n = 40): number[] {
  const alts = points.map((p) => p.alt).filter((a): a is number => a != null);
  if (alts.length < 2) return [];
  return downsample(alts, n).map((a) => Math.round(a));
}
