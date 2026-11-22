import type { Guide } from "./types";

/**
 * Fair-queue guide selection (pure function, no I/O, easy to test).
 *
 * Rules, in order:
 *  1. Guide must be active and accredited for the trail.
 *  2. Guide must not already be booked on that date.
 *  3. Pick the guide with the fewest assignments so far (equitable work distribution).
 *  4. Tie-break: the guide who has waited longest (oldest lastAssignedAt; never-assigned goes first).
 *  5. Final tie-break: guide id, so results are deterministic.
 */
export function pickFairGuide(
  guides: Guide[],
  trailId: string,
  busyGuideIds: ReadonlySet<string>
): Guide | null {
  const eligible = guides.filter(
    (g) => g.active && g.trailIds.includes(trailId) && !busyGuideIds.has(g.id)
  );
  if (eligible.length === 0) return null;

  eligible.sort((a, b) => {
    if (a.assignedCount !== b.assignedCount) return a.assignedCount - b.assignedCount;
    const aLast = a.lastAssignedAt ?? -Infinity;
    const bLast = b.lastAssignedAt ?? -Infinity;
    if (aLast !== bLast) return aLast - bLast;
    return a.id.localeCompare(b.id);
  });
  return eligible[0];
}
