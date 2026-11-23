import type { Activity, Guide, GuideReview, Post, PostComment, Profile, Story } from "../types";
import { sampleRoute } from "./sampleTrails";

/**
 * SAMPLE community data for mock mode (no Firebase). Names, posts and numbers are invented.
 * Replace by real users once Firebase is connected.
 */

export const ME = "mock-user";
const H = 60 * 60 * 1000;
const D = 24 * H;
const now = Date.now();

export const PEOPLE: Profile[] = [
  { uid: "p-marco", displayName: "Marco Dela Cruz", handle: "marco_akyat", bio: "Weekend warrior. Maculot regular.", hikes: 42, totalKm: 288.4, totalElevationM: 21400, weeklyKm: 18.2 },
  { uid: "p-bea", displayName: "Bea Santos", handle: "bea.hikes", bio: "Sunrise summits only.", hikes: 31, totalKm: 201.7, totalElevationM: 15800, weeklyKm: 17.6 },
  { uid: "p-jomar", displayName: "Jomar Reyes", handle: "jomar_trails", bio: "Photography + trails.", hikes: 18, totalKm: 120.2, totalElevationM: 9100, weeklyKm: 14.1 },
  { uid: "p-camille", displayName: "Camille Garcia", handle: "cam.outdoors", bio: "New to hiking, loving it.", hikes: 9, totalKm: 52.8, totalElevationM: 3900, weeklyKm: 11.3 },
  { uid: "p-paolo", displayName: "Paolo Bautista", handle: "paolo.b", hikes: 14, totalKm: 88.9, totalElevationM: 6200, weeklyKm: 8.6 },
  { uid: "p-trisha", displayName: "Trisha Mendoza", handle: "trish_on_trail", bio: "Coffee first, then the summit.", hikes: 6, totalKm: 31.0, totalElevationM: 2100, weeklyKm: 6.4 },
];

export const GUIDES: Guide[] = [
  { id: "g1", name: "Mang Pedro", active: true, trailIds: ["mt-maculot", "mt-batulao", "taal-view"], assignedCount: 0, lastAssignedAt: null, bio: "Born at the foot of Maculot. Knows every shortcut and every safe rest stop.", yearsExperience: 12, rating: 4.9, reviewCount: 87 },
  { id: "g2", name: "Kuya Dan", active: true, trailIds: ["mt-batulao", "taal-view"], assignedCount: 0, lastAssignedAt: null, bio: "Trail runner turned guide. Patient with first-timers.", yearsExperience: 6, rating: 4.7, reviewCount: 54 },
  { id: "g3", name: "Ate Liza", active: true, trailIds: ["mt-maculot", "taal-view"], assignedCount: 0, lastAssignedAt: null, bio: "First-aid certified. Loves birdwatching on the way up.", yearsExperience: 8, rating: 4.8, reviewCount: 63 },
];

export const GUIDE_REVIEWS: GuideReview[] = GUIDES.flatMap((g, gi) => [
  { id: `${g.id}-r1`, guideId: g.id, hikerId: "p-bea", hikerName: "Bea Santos", rating: 5, tags: ["Knowledgeable", "Safe"], comment: "Knew exactly when to rest and where the best views were.", createdAt: now - (3 + gi) * D },
  { id: `${g.id}-r2`, guideId: g.id, hikerId: "p-jomar", hikerName: "Jomar Reyes", rating: 5, tags: ["Friendly"], comment: "Made our group of beginners feel comfortable the whole way.", createdAt: now - (9 + gi) * D },
  { id: `${g.id}-r3`, guideId: g.id, hikerId: "p-camille", hikerName: "Camille Garcia", rating: 4, tags: ["On time", "Safe"], comment: "Great pacing. Would hike with again.", createdAt: now - (15 + gi) * D },
]);

export const SAMPLE_ACTIVITIES: Activity[] = [
  { id: "a1", hikerId: ME, trailId: "mt-maculot", trailName: "Mt. Maculot", startedAt: now - 2 * D, durationSec: 4 * 3600 + 12 * 60, distanceKm: 6.4, elevationGainM: 540, route: sampleRoute(1), createdAt: now - 2 * D },
  { id: "a2", hikerId: ME, trailId: "taal-view", trailName: "Taal Ridge Trail", startedAt: now - 5 * D, durationSec: 2 * 3600 + 5 * 60, distanceKm: 3.1, elevationGainM: 160, route: sampleRoute(3), createdAt: now - 5 * D },
  { id: "a3", hikerId: ME, trailId: "mt-batulao", trailName: "Mt. Batulao", startedAt: now - 12 * D, durationSec: 5 * 3600 + 20 * 60, distanceKm: 8.2, elevationGainM: 620, route: sampleRoute(2), createdAt: now - 12 * D },
  { id: "a4", hikerId: ME, trailId: "mt-maculot", trailName: "Mt. Maculot", startedAt: now - 20 * D, durationSec: 4 * 3600 + 40 * 60, distanceKm: 6.4, elevationGainM: 540, route: sampleRoute(1), createdAt: now - 20 * D },
];

export const SAMPLE_POSTS: Post[] = [
  { id: "post1", authorId: "p-bea", authorName: "Bea Santos", caption: "Sea of clouds at the Maculot summit this morning. Worth the 3 AM alarm.", trailId: "mt-maculot", trailName: "Mt. Maculot", photoUrls: [], likedBy: ["p-marco", "p-jomar", "p-camille"], commentCount: 2, createdAt: now - 3 * H, activity: { distanceKm: 6.4, durationSec: 15120, elevationGainM: 540 } },
  { id: "post2", authorId: "p-marco", authorName: "Marco Dela Cruz", caption: "Batulao ridge line never gets old. Shoutout to Kuya Dan for the pacing!", trailId: "mt-batulao", trailName: "Mt. Batulao", photoUrls: [], likedBy: ["p-bea", ME], commentCount: 1, createdAt: now - 9 * H, activity: { distanceKm: 8.2, durationSec: 19200, elevationGainM: 620 } },
  { id: "post3", authorId: "p-camille", authorName: "Camille Garcia", caption: "First ever hike done! Legs are jelly but my heart is full.", trailId: "taal-view", trailName: "Taal Ridge Trail", photoUrls: [], likedBy: ["p-marco", "p-bea", "p-jomar", "p-paolo", "p-trisha"], commentCount: 0, createdAt: now - 26 * H },
  { id: "post4", authorId: "p-jomar", authorName: "Jomar Reyes", caption: "Golden hour on the ridge. No filter needed.", trailName: "Taal Ridge Trail", photoUrls: [], likedBy: ["p-bea"], commentCount: 0, createdAt: now - 2 * D },
];

export const SAMPLE_COMMENTS: PostComment[] = [
  { id: "c1", postId: "post1", authorId: "p-marco", authorName: "Marco Dela Cruz", text: "Insane view! Which guide did you get?", createdAt: now - 2 * H },
  { id: "c2", postId: "post1", authorId: "p-camille", authorName: "Camille Garcia", text: "Adding this to my list 😍", createdAt: now - 1 * H },
  { id: "c3", postId: "post2", authorId: "p-bea", authorName: "Bea Santos", text: "Next weekend? 🙌", createdAt: now - 6 * H },
];

export const SAMPLE_STORIES: Story[] = [
  { id: "s1", authorId: "p-bea", authorName: "Bea Santos", caption: "Summit push, 4:50 AM", trailName: "Mt. Maculot", createdAt: now - 2 * H },
  { id: "s2", authorId: "p-bea", authorName: "Bea Santos", caption: "Sunrise 🌄", trailName: "Mt. Maculot", createdAt: now - 1 * H },
  { id: "s3", authorId: "p-marco", authorName: "Marco Dela Cruz", caption: "Rest stop snacks", trailName: "Mt. Batulao", createdAt: now - 7 * H },
  { id: "s4", authorId: "p-jomar", authorName: "Jomar Reyes", caption: "Fog rolling in", trailName: "Taal Ridge Trail", createdAt: now - 5 * H },
  { id: "s5", authorId: "p-trisha", authorName: "Trisha Mendoza", caption: "Trail buddies", createdAt: now - 10 * H },
];
