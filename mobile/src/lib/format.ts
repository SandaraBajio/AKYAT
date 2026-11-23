/** "1:05:09" for 3909 seconds, "42:10" for 2530. */
export function clock(totalSec: number): string {
  const s = Math.max(0, Math.floor(totalSec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const p = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${p(m)}:${p(sec)}` : `${p(m)}:${p(sec)}`;
}

/** "4h 12m" or "42m". */
export function duration(totalSec: number): string {
  const s = Math.max(0, Math.round(totalSec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h > 0 ? `${h}h ${String(m).padStart(2, "0")}m` : `${m}m`;
}

export const km = (n: number) => `${(Math.round(n * 10) / 10).toFixed(1)} km`;

/** Pace as "12:30 /km", or "--" when there is no distance yet. */
export function pace(durationSec: number, distanceKm: number): string {
  if (distanceKm < 0.05 || durationSec <= 0) return "--";
  const secPerKm = durationSec / distanceKm;
  const m = Math.floor(secPerKm / 60);
  const s = Math.round(secPerKm % 60);
  return `${m}:${String(s === 60 ? 59 : s).padStart(2, "0")} /km`;
}

/** "3h ago", "2d ago", "just now". */
export function timeAgo(ms: number, now = Date.now()): string {
  const diff = Math.max(0, now - ms);
  const min = Math.floor(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const CARDINALS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
export const cardinal = (deg: number) => CARDINALS[Math.round((((deg % 360) + 360) % 360) / 45) % 8];

export const firstName = (full?: string) => (full ?? "Hiker").trim().split(/\s+/)[0] || "Hiker";
