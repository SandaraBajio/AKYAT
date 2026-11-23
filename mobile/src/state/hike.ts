import { useEffect, useState, useSyncExternalStore } from "react";
import * as Location from "expo-location";
import { addPoint, bearing, emptyTrack, type Track, type TrackPoint } from "../lib/tracking";
import { sampleRoute } from "../data/sampleTrails";
import type { LatLng } from "../types";

/**
 * The hike in progress. A module-level store so the Record tab, the live screen and the summary
 * all see the same state, and the GPS keeps running while you move between screens.
 */

export type HikeStatus = "idle" | "running" | "paused" | "finished";
export type GpsState = "starting" | "good" | "weak" | "demo";

export interface HikeState {
  status: HikeStatus;
  demo: boolean;
  trailId: string | null;
  trailName: string | null;
  /** The planned trail route, if the hike was started from a trail page. */
  plannedRoute: LatLng[] | null;
  startedAt: number | null;
  accumulatedMs: number; // time already banked from earlier running periods
  resumedAt: number | null; // when the current running period began
  track: Track;
  heading: number; // degrees from north
  gps: GpsState;
  current: LatLng | null;
}

const initial = (): HikeState => ({
  status: "idle",
  demo: false,
  trailId: null,
  trailName: null,
  plannedRoute: null,
  startedAt: null,
  accumulatedMs: 0,
  resumedAt: null,
  track: emptyTrack(),
  heading: 0,
  gps: "starting",
  current: null,
});

let state: HikeState = initial();
const listeners = new Set<() => void>();
const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};
function set(patch: Partial<HikeState>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

let posSub: Location.LocationSubscription | null = null;
let headSub: Location.LocationSubscription | null = null;
let demoTimer: ReturnType<typeof setInterval> | null = null;

function stopSensors() {
  posSub?.remove();
  headSub?.remove();
  posSub = null;
  headSub = null;
  if (demoTimer) clearInterval(demoTimer);
  demoTimer = null;
}

/** Seconds of moving time so far (pauses excluded). */
export function elapsedSec(s: HikeState, now = Date.now()): number {
  return (s.accumulatedMs + (s.status === "running" && s.resumedAt ? now - s.resumedAt : 0)) / 1000;
}

export function useHike(): HikeState {
  return useSyncExternalStore(subscribe, () => state);
}

/** Re-renders every second while the hike is running, and returns the moving time in seconds. */
export function useElapsed(): number {
  const s = useHike();
  const [, tick] = useState(0);
  useEffect(() => {
    if (s.status !== "running") return;
    const id = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, [s.status]);
  return elapsedSec(s);
}

export interface StartOptions {
  trail?: { id: string; name: string; route?: LatLng[]; elevationProfile?: number[] };
  /** Simulate a walk along the route instead of using the real GPS (demos, testing at a desk). */
  demo?: boolean;
}

/** Start recording. Returns { ok: false, message } if location permission is missing. */
export async function startHike(opts: StartOptions = {}): Promise<{ ok: true } | { ok: false; message: string }> {
  stopSensors();
  const demo = !!opts.demo;
  const base: HikeState = {
    ...initial(),
    status: "running",
    demo,
    trailId: opts.trail?.id ?? null,
    trailName: opts.trail?.name ?? null,
    plannedRoute: opts.trail?.route ?? null,
    startedAt: Date.now(),
    resumedAt: Date.now(),
    gps: demo ? "demo" : "starting",
  };

  if (demo) {
    state = base;
    listeners.forEach((l) => l());
    runDemo(opts.trail?.route, opts.trail?.elevationProfile);
    return { ok: true };
  }

  try {
    const perm = await Location.requestForegroundPermissionsAsync();
    if (perm.status !== "granted") {
      return { ok: false, message: "Location permission is off. Turn it on in Settings to record a hike, or try demo mode." };
    }
  } catch {
    return { ok: false, message: "This device can't provide GPS. Try demo mode instead." };
  }

  state = base;
  listeners.forEach((l) => l());

  try {
    posSub = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.BestForNavigation, timeInterval: 2000, distanceInterval: 3 },
      (loc) => {
        const p: TrackPoint = {
          lat: loc.coords.latitude,
          lng: loc.coords.longitude,
          alt: loc.coords.altitude ?? null,
          t: loc.timestamp,
          accuracy: loc.coords.accuracy ?? null,
        };
        const weak = p.accuracy != null && p.accuracy > 20;
        // Paused: keep the dot moving on the map but don't add to the recorded track.
        if (state.status === "running") {
          set({ track: addPoint(state.track, p).track, current: { lat: p.lat, lng: p.lng }, gps: weak ? "weak" : "good" });
        } else {
          set({ current: { lat: p.lat, lng: p.lng }, gps: weak ? "weak" : "good" });
        }
      }
    );
    headSub = await Location.watchHeadingAsync((h) => {
      const deg = h.trueHeading >= 0 ? h.trueHeading : h.magHeading;
      if (Number.isFinite(deg)) set({ heading: deg });
    }).catch(() => null);
  } catch {
    stopSensors();
    state = initial();
    listeners.forEach((l) => l());
    return { ok: false, message: "Couldn't start the GPS. Check location settings and try again." };
  }
  return { ok: true };
}

/** Walks along `route` (or a sample route) at fast-forward speed, going out and back. */
function runDemo(route?: LatLng[], elevation?: number[]) {
  const path = route && route.length > 1 ? route : sampleRoute(1);
  const alts = elevation && elevation.length > 1 ? elevation : null;
  let pos = 0; // fractional index into path
  let dir = 1;
  const STEP = 0.45;

  const tick = () => {
    if (state.status !== "running") return;
    pos += STEP * dir;
    if (pos >= path.length - 1) {
      pos = path.length - 1;
      dir = -1;
    } else if (pos <= 0) {
      pos = 0;
      dir = 1;
    }
    const i = Math.floor(pos);
    const f = pos - i;
    const a = path[i];
    const b = path[Math.min(i + 1, path.length - 1)];
    const lat = a.lat + (b.lat - a.lat) * f;
    const lng = a.lng + (b.lng - a.lng) * f;
    let alt: number | null = null;
    if (alts) {
      const ai = (pos / (path.length - 1)) * (alts.length - 1);
      const lo = Math.floor(ai);
      alt = alts[lo] + (alts[Math.min(lo + 1, alts.length - 1)] - alts[lo]) * (ai - lo);
    }
    const p: TrackPoint = { lat, lng, alt, t: Date.now(), accuracy: 5 };
    const heading = dir === 1 ? bearing(a, b) : bearing(b, a);
    // maxSpeedMs: Infinity because the demo is deliberately fast-forwarded.
    set({ track: addPoint(state.track, p, { maxSpeedMs: Infinity }).track, current: { lat, lng }, heading });
  };

  tick();
  demoTimer = setInterval(tick, 1000);
}

export function pauseHike() {
  if (state.status !== "running") return;
  set({ status: "paused", accumulatedMs: state.accumulatedMs + (Date.now() - (state.resumedAt ?? Date.now())), resumedAt: null });
}

export function resumeHike() {
  if (state.status !== "paused") return;
  set({ status: "running", resumedAt: Date.now() });
}

export function finishHike() {
  if (state.status !== "running" && state.status !== "paused") return;
  const banked = state.accumulatedMs + (state.status === "running" ? Date.now() - (state.resumedAt ?? Date.now()) : 0);
  stopSensors();
  set({ status: "finished", accumulatedMs: banked, resumedAt: null });
}

/** Throw the hike away (or clear it after saving). */
export function resetHike() {
  stopSensors();
  state = initial();
  listeners.forEach((l) => l());
}
