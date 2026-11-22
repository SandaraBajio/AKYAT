import { describe, expect, it } from "vitest";
import { sanitizeActivityNumbers, sumWeeklyKm } from "./stats";

const DAY = 24 * 60 * 60 * 1000;
const NOW = 1_800_000_000_000;

describe("sumWeeklyKm", () => {
  it("adds only the last 7 days", () => {
    const acts = [
      { startedAt: NOW - 1 * DAY, distanceKm: 6.4 },
      { startedAt: NOW - 6 * DAY, distanceKm: 3.1 },
      { startedAt: NOW - 8 * DAY, distanceKm: 20 }, // too old
    ];
    expect(sumWeeklyKm(acts, NOW)).toBe(9.5);
  });

  it("ignores activities dated in the future and handles empty input", () => {
    expect(sumWeeklyKm([{ startedAt: NOW + DAY, distanceKm: 50 }], NOW)).toBe(0);
    expect(sumWeeklyKm([], NOW)).toBe(0);
  });
});

describe("sanitizeActivityNumbers", () => {
  it("passes normal values through", () => {
    expect(sanitizeActivityNumbers({ distanceKm: 6.4, elevationGainM: 540 })).toEqual({ distanceKm: 6.4, elevationGainM: 540 });
  });
  it("clamps absurd, negative, and non-numeric values", () => {
    expect(sanitizeActivityNumbers({ distanceKm: 9999, elevationGainM: -5 })).toEqual({ distanceKm: 100, elevationGainM: 0 });
    expect(sanitizeActivityNumbers({ distanceKm: "lots", elevationGainM: NaN })).toEqual({ distanceKm: 0, elevationGainM: 0 });
  });
});
