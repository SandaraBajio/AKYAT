import { TIME_ZONE } from "./config";

const dateKeyFormat = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** "YYYY-MM-DD" for the given instant in Asia/Manila. */
export function toDateKey(ms: number): string {
  return dateKeyFormat.format(new Date(ms));
}

/** Strict YYYY-MM-DD check (also rejects impossible dates like 2026-02-31). */
export function isValidDateKey(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

/** Today's date key in Manila time. */
export function todayKey(nowMs: number = Date.now()): string {
  return toDateKey(nowMs);
}

/** Tomorrow's date key in Manila time. */
export function tomorrowKey(nowMs: number = Date.now()): string {
  return toDateKey(nowMs + 24 * 60 * 60 * 1000);
}
