import type { LatLng, Review, Trail } from "../types";

/**
 * SAMPLE data so every screen has something to show. Replace with real trail info
 * (names, distances, elevation, GPS routes) before the final demo.
 * The routes below are made-up shapes, not real GPS tracks.
 */

/** A wiggly sample route. Only its SHAPE matters; the map scales it to fit. */
export function sampleRoute(seed: number, points = 28): LatLng[] {
  return Array.from({ length: points }, (_, i) => {
    const t = i / (points - 1);
    return {
      lat: 13.9 + t * 0.02 + Math.sin(t * 6 + seed) * 0.004,
      lng: 121.0 + t * 0.012 + Math.cos(t * 5 + seed) * 0.005,
    };
  });
}

/** Out-and-back elevation profile: climbs to the summit and comes back down. */
export function sampleProfile(baseM: number, summitM: number, points = 40): number[] {
  return Array.from({ length: points }, (_, i) => {
    const t = i / (points - 1);
    const hill = Math.pow(Math.sin(Math.PI * t), 1.15);
    const bumps = Math.sin(t * 25) * 6;
    return Math.min(summitM, Math.max(baseM, Math.round(baseM + (summitM - baseM) * hill + bumps)));
  });
}

export const SAMPLE_TRAILS: Trail[] = [
  {
    id: "mt-maculot",
    name: "Mt. Maculot",
    location: "Cuenca, Batangas",
    description:
      "A popular day hike with a rocky summit and wide views of Taal Lake. The trail starts in the forest and ends with a short scramble over the Rockies section. Start early to beat the heat and the crowd.",
    difficulty: "moderate",
    distanceKm: 6.4,
    elevationGainM: 540,
    durationHours: 4,
    rating: 4.8,
    reviewCount: 126,
    pricePerPerson: 35000,
    maxGroupSize: 10,
    active: true,
    elevationProfile: sampleProfile(180, 706),
    route: sampleRoute(1),
  },
  {
    id: "mt-batulao",
    name: "Mt. Batulao",
    location: "Nasugbu, Batangas",
    description:
      "Rolling grassy ridges with steep sections and open views all the way up. Good for first-time mountain hikers who want a real workout.",
    difficulty: "hard",
    distanceKm: 8.2,
    elevationGainM: 620,
    durationHours: 5,
    rating: 4.6,
    reviewCount: 98,
    pricePerPerson: 45000,
    maxGroupSize: 12,
    active: true,
    elevationProfile: sampleProfile(260, 811),
    route: sampleRoute(2),
  },
  {
    id: "taal-view",
    name: "Taal Ridge Trail",
    location: "Tagaytay, Cavite-Batangas border",
    description: "A gentle ridge walk with constant views of Taal Volcano. Short, easy, and good for families.",
    difficulty: "easy",
    distanceKm: 3.1,
    elevationGainM: 160,
    durationHours: 2,
    rating: 4.4,
    reviewCount: 61,
    pricePerPerson: 30000,
    maxGroupSize: 8,
    active: true,
    elevationProfile: sampleProfile(520, 640),
    route: sampleRoute(3),
  },
  {
    id: "closed-trail",
    name: "Mt. Pico (closed)",
    location: "Batangas",
    difficulty: "hard",
    distanceKm: 9,
    elevationGainM: 700,
    durationHours: 6,
    rating: 4.2,
    reviewCount: 12,
    pricePerPerson: 50000,
    maxGroupSize: 6,
    active: false,
  },
];

const NAMES = ["Amanda Santos", "Jessica Reyes", "Jonathan Cruz", "Maria Lopez"];
const COMMENTS = [
  "Great guide and a beautiful view at the top. Bring more water than you think you need.",
  "Steep in the last stretch but worth it. Started at 4 AM and had the summit almost to ourselves.",
  "Well organized. The guide knew the trail well and kept the group together.",
  "Muddy after the rain, so wear shoes with grip.",
];

export function sampleReviews(trailId: string): Review[] {
  return NAMES.slice(0, 3).map((userName, i) => ({
    id: `${trailId}-r${i}`,
    trailId,
    userId: `sample-${i}`,
    userName,
    rating: [5, 4, 5][i],
    comment: COMMENTS[(i + trailId.length) % COMMENTS.length],
    createdAt: Date.now() - (i + 1) * 3 * 24 * 60 * 60 * 1000,
  }));
}
