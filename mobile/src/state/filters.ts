import { useSyncExternalStore } from "react";
import type { Difficulty, Trail } from "../types";

/** Search + filter choices shared between the Explore screen and the Filters screen. */
export interface Filters {
  query: string;
  difficulty: Difficulty | "all";
  maxPrice: number | null; // centavos per person, null = any
  minRating: number; // 0 = any
  maxDistanceKm: number | null; // null = any
}

export const DEFAULT_FILTERS: Filters = {
  query: "",
  difficulty: "all",
  maxPrice: null,
  minRating: 0,
  maxDistanceKm: null,
};

let current: Filters = DEFAULT_FILTERS;
const listeners = new Set<() => void>();
const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};

export function setFilters(patch: Partial<Filters>) {
  current = { ...current, ...patch };
  listeners.forEach((l) => l());
}
export const resetFilters = () => setFilters({ ...DEFAULT_FILTERS });

export function useFilters(): Filters {
  return useSyncExternalStore(subscribe, () => current);
}

/** How many of the advanced filters (not search text) are switched on. Shown as a badge. */
export function activeFilterCount(f: Filters): number {
  return (
    (f.difficulty !== "all" ? 1 : 0) +
    (f.maxPrice != null ? 1 : 0) +
    (f.minRating > 0 ? 1 : 0) +
    (f.maxDistanceKm != null ? 1 : 0)
  );
}

export function applyFilters(trails: Trail[], f: Filters): Trail[] {
  const q = f.query.trim().toLowerCase();
  return trails.filter((t) => {
    if (q && !`${t.name} ${t.location ?? ""}`.toLowerCase().includes(q)) return false;
    if (f.difficulty !== "all" && t.difficulty !== f.difficulty) return false;
    if (f.maxPrice != null && t.pricePerPerson > f.maxPrice) return false;
    if (f.minRating > 0 && (t.rating ?? 0) < f.minRating) return false;
    if (f.maxDistanceKm != null && (t.distanceKm ?? 0) > f.maxDistanceKm) return false;
    return true;
  });
}
