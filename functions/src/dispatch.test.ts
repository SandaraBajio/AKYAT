import { describe, expect, it } from "vitest";
import { pickFairGuide } from "./dispatch";
import type { Guide } from "./types";

const guide = (over: Partial<Guide> & { id: string }): Guide => ({
  name: over.id,
  active: true,
  trailIds: ["t1"],
  assignedCount: 0,
  lastAssignedAt: null,
  ...over,
});

describe("pickFairGuide", () => {
  it("picks the guide with the fewest assignments", () => {
    const guides = [
      guide({ id: "a", assignedCount: 5 }),
      guide({ id: "b", assignedCount: 2 }),
      guide({ id: "c", assignedCount: 3 }),
    ];
    expect(pickFairGuide(guides, "t1", new Set())?.id).toBe("b");
  });

  it("breaks ties by who has waited longest, never-assigned first", () => {
    const guides = [
      guide({ id: "a", assignedCount: 1, lastAssignedAt: 2000 }),
      guide({ id: "b", assignedCount: 1, lastAssignedAt: 1000 }),
      guide({ id: "c", assignedCount: 1, lastAssignedAt: null }),
    ];
    expect(pickFairGuide(guides, "t1", new Set())?.id).toBe("c");
    expect(pickFairGuide(guides.slice(0, 2), "t1", new Set())?.id).toBe("b");
  });

  it("skips inactive, unaccredited, and already-booked guides", () => {
    const guides = [
      guide({ id: "inactive", active: false }),
      guide({ id: "wrong-trail", trailIds: ["t2"] }),
      guide({ id: "busy" }),
      guide({ id: "free", assignedCount: 9 }),
    ];
    expect(pickFairGuide(guides, "t1", new Set(["busy"]))?.id).toBe("free");
  });

  it("returns null when nobody is eligible", () => {
    expect(pickFairGuide([guide({ id: "a" })], "t1", new Set(["a"]))).toBeNull();
    expect(pickFairGuide([], "t1", new Set())).toBeNull();
  });

  it("is deterministic on full ties", () => {
    const guides = [guide({ id: "b" }), guide({ id: "a" })];
    expect(pickFairGuide(guides, "t1", new Set())?.id).toBe("a");
  });

  it("spreads work evenly over many assignments", () => {
    const guides = [guide({ id: "a" }), guide({ id: "b" }), guide({ id: "c" })];
    let clock = 1;
    for (let i = 0; i < 30; i++) {
      const g = pickFairGuide(guides, "t1", new Set())!;
      g.assignedCount += 1;
      g.lastAssignedAt = clock++;
    }
    expect(guides.map((g) => g.assignedCount)).toEqual([10, 10, 10]);
  });
});
