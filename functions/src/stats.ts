const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/** Total distance of the activities that started within the 7 days before `nowMs`. Rounded to 0.1 km. */
export function sumWeeklyKm(
  activities: ReadonlyArray<{ startedAt: number; distanceKm: number }>,
  nowMs: number
): number {
  const total = activities
    .filter((a) => a.startedAt >= nowMs - WEEK_MS && a.startedAt <= nowMs)
    .reduce((sum, a) => sum + a.distanceKm, 0);
  return Math.round(total * 10) / 10;
}

/** Clamp client-supplied numbers so one bad upload can't wreck the leaderboard. */
export function sanitizeActivityNumbers(a: { distanceKm: unknown; elevationGainM: unknown }) {
  const num = (v: unknown, max: number) => {
    const n = typeof v === "number" && Number.isFinite(v) ? v : 0;
    return Math.min(Math.max(n, 0), max);
  };
  // 100 km and 5000 m are far beyond any Batangas day hike; anything bigger is treated as a bad reading.
  return { distanceKm: num(a.distanceKm, 100), elevationGainM: num(a.elevationGainM, 5000) };
}
