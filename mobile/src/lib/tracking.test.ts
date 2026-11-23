import { describe, expect, it } from "vitest";
import { addPoint, bearing, downsample, elevationProfile, emptyTrack, haversineM, type TrackPoint } from "./tracking";
import { cardinal, clock, duration, pace } from "./format";

const pt = (lat: number, lng: number, over: Partial<TrackPoint> = {}): TrackPoint => ({
  lat,
  lng,
  alt: null,
  t: 0,
  accuracy: 5,
  ...over,
});

describe("haversineM / bearing", () => {
  it("0.001 degrees of latitude is about 111 m", () => {
    expect(haversineM({ lat: 14, lng: 121 }, { lat: 14.001, lng: 121 })).toBeGreaterThan(110);
    expect(haversineM({ lat: 14, lng: 121 }, { lat: 14.001, lng: 121 })).toBeLessThan(112);
  });
  it("bearing north is 0 and east is 90", () => {
    expect(Math.round(bearing({ lat: 14, lng: 121 }, { lat: 14.01, lng: 121 }))).toBe(0);
    expect(Math.round(bearing({ lat: 14, lng: 121 }, { lat: 14, lng: 121.01 }))).toBe(90);
  });
});

describe("addPoint filtering", () => {
  it("accepts the first point and adds distance for a normal step", () => {
    let t = addPoint(emptyTrack(), pt(14, 121, { t: 0 })).track;
    const r = addPoint(t, pt(14.0003, 121, { t: 10_000 })); // ~33 m in 10 s
    expect(r.accepted).toBe(true);
    expect(r.track.distanceM).toBeGreaterThan(30);
    expect(r.track.points).toHaveLength(2);
  });

  it("rejects points with poor accuracy", () => {
    const t = addPoint(emptyTrack(), pt(14, 121)).track;
    const r = addPoint(t, pt(14.0003, 121, { t: 10_000, accuracy: 80 }));
    expect(r.accepted).toBe(false);
    expect(r.track).toBe(t);
  });

  it("rejects GPS jitter smaller than 3 m", () => {
    const t = addPoint(emptyTrack(), pt(14, 121)).track;
    expect(addPoint(t, pt(14.000005, 121, { t: 5000 })).accepted).toBe(false);
  });

  it("rejects an impossible jump (1 km in 2 s)", () => {
    const t = addPoint(emptyTrack(), pt(14, 121, { t: 0 })).track;
    expect(addPoint(t, pt(14.009, 121, { t: 2000 })).accepted).toBe(false);
  });

  it("the speed limit can be lifted for the demo simulation", () => {
    const t = addPoint(emptyTrack(), pt(14, 121, { t: 0 })).track;
    expect(addPoint(t, pt(14.009, 121, { t: 2000 }), { maxSpeedMs: Infinity }).accepted).toBe(true);
  });
});

describe("elevation gain", () => {
  const walk = (alts: number[]) => {
    let t = emptyTrack();
    alts.forEach((alt, i) => {
      t = addPoint(t, pt(14 + i * 0.0004, 121, { alt, t: i * 20_000 })).track;
    });
    return t;
  };

  it("ignores altimeter noise of 1-2 m", () => {
    expect(walk([100, 101, 100, 102, 99, 101, 100]).gainM).toBe(0);
  });
  it("counts a real climb once it passes the threshold", () => {
    expect(walk([100, 101, 102, 104, 110]).gainM).toBe(10);
  });
  it("does not count descents, but climbing again after a descent counts", () => {
    expect(walk([100, 95, 90, 95]).gainM).toBe(5);
  });
});

describe("downsample / elevationProfile", () => {
  it("keeps first and last and respects the maximum", () => {
    const arr = Array.from({ length: 1000 }, (_, i) => i);
    const out = downsample(arr, 100);
    expect(out).toHaveLength(100);
    expect(out[0]).toBe(0);
    expect(out[out.length - 1]).toBe(999);
  });
  it("returns short arrays unchanged", () => {
    expect(downsample([1, 2, 3], 10)).toEqual([1, 2, 3]);
  });
  it("builds a profile only when altitude data exists", () => {
    expect(elevationProfile([pt(14, 121), pt(14.1, 121)])).toEqual([]);
    expect(elevationProfile([pt(14, 121, { alt: 100.4 }), pt(14.1, 121, { alt: 200.6 })])).toEqual([100, 201]);
  });
});

describe("format helpers", () => {
  it("clock and duration", () => {
    expect(clock(3909)).toBe("1:05:09");
    expect(clock(2530)).toBe("42:10");
    expect(duration(15120)).toBe("4h 12m");
    expect(duration(600)).toBe("10m");
  });
  it("pace", () => {
    expect(pace(3600, 6)).toBe("10:00 /km");
    expect(pace(10, 0)).toBe("--");
  });
  it("cardinal wraps around", () => {
    expect(cardinal(0)).toBe("N");
    expect(cardinal(359)).toBe("N");
    expect(cardinal(90)).toBe("E");
    expect(cardinal(260)).toBe("W");
  });
});
