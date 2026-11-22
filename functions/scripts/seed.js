// Seeds sample trails, guides and reviews so the app has something to show.
//
//   Emulator (recommended while developing):
//     terminal 1:  npm run serve
//     terminal 2:  npm run seed:emulator
//
//   Real project (needs `firebase login` and a project id):
//     GCLOUD_PROJECT=your-project-id npm run seed
//
// Prices are centavos: 35000 = PHP 350.00. Distances, ratings and routes are SAMPLE values:
// replace them with real trail data (and add photoUrls) before the final demo.
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

const project = process.env.GCLOUD_PROJECT || process.env.FIREBASE_PROJECT || "demo-akyat";
initializeApp({ projectId: project });
const db = getFirestore();

const route = (seed, n = 28) =>
  Array.from({ length: n }, (_, i) => {
    const t = i / (n - 1);
    return {
      lat: 13.9 + t * 0.02 + Math.sin(t * 6 + seed) * 0.004,
      lng: 121.0 + t * 0.012 + Math.cos(t * 5 + seed) * 0.005,
    };
  });

const profile = (base, summit, n = 40) =>
  Array.from({ length: n }, (_, i) => {
    const t = i / (n - 1);
    return Math.min(summit, Math.max(base, Math.round(base + (summit - base) * Math.pow(Math.sin(Math.PI * t), 1.15) + Math.sin(t * 25) * 6)));
  });

const trails = [
  {
    id: "mt-maculot", name: "Mt. Maculot", location: "Cuenca, Batangas", difficulty: "moderate",
    description: "A popular day hike with a rocky summit and wide views of Taal Lake. Start early to beat the heat and the crowd.",
    distanceKm: 6.4, elevationGainM: 540, durationHours: 4, rating: 4.8, reviewCount: 126,
    pricePerPerson: 35000, maxGroupSize: 10, active: true, elevationProfile: profile(180, 706), route: route(1),
  },
  {
    id: "mt-batulao", name: "Mt. Batulao", location: "Nasugbu, Batangas", difficulty: "hard",
    description: "Rolling grassy ridges with steep sections and open views all the way up.",
    distanceKm: 8.2, elevationGainM: 620, durationHours: 5, rating: 4.6, reviewCount: 98,
    pricePerPerson: 45000, maxGroupSize: 12, active: true, elevationProfile: profile(260, 811), route: route(2),
  },
  {
    id: "taal-view", name: "Taal Ridge Trail", location: "Tagaytay, Cavite-Batangas border", difficulty: "easy",
    description: "A gentle ridge walk with constant views of Taal Volcano. Short, easy, and good for families.",
    distanceKm: 3.1, elevationGainM: 160, durationHours: 2, rating: 4.4, reviewCount: 61,
    pricePerPerson: 30000, maxGroupSize: 8, active: true, elevationProfile: profile(520, 640), route: route(3),
  },
];

// A guide's document id should equal their user uid, so the backend can push-notify them.
// These demo ids are fine for testing dispatch; replace with real uids for real guides.
const guides = [
  { id: "guide-demo-1", name: "Mang Pedro", bio: "Born and raised at the foot of Mt. Maculot. Knows every shortcut and every story on the trail.", yearsExperience: 12, rating: 4.9, reviewCount: 3 },
  { id: "guide-demo-2", name: "Kuya Dan", bio: "Weekend-warrior-turned-guide. Patient with beginners and great with group photos.", yearsExperience: 6, rating: 4.7, reviewCount: 3 },
  { id: "guide-demo-3", name: "Ate Liza", bio: "Certified wilderness first responder. Safety first, summit second.", yearsExperience: 9, rating: 4.8, reviewCount: 3 },
].map((g) => ({
  ...g,
  active: true,
  trailIds: trails.map((t) => t.id),
  assignedCount: 0,
  lastAssignedAt: null,
}));

const people = ["Amanda Santos", "Jessica Reyes", "Jonathan Cruz"];
const comments = [
  "Great guide and a beautiful view at the top. Bring more water than you think you need.",
  "Steep in the last stretch but worth it. Started at 4 AM and had the summit almost to ourselves.",
  "Well organized. The guide knew the trail well and kept the group together.",
];
const reviews = trails.flatMap((t) =>
  people.map((userName, i) => ({
    id: `${t.id}-r${i}`,
    trailId: t.id,
    userId: `sample-${i}`,
    userName,
    rating: [5, 4, 5][i],
    comment: comments[i],
    createdAt: Date.now() - (i + 1) * 3 * 24 * 60 * 60 * 1000,
  }))
);

// Demo hikers, posts and stories. Photos are left out on purpose (the app shows placeholders).
const H = 60 * 60 * 1000;
const profiles = [
  { uid: "demo-marco", displayName: "Marco Dela Cruz", handle: "marco_hikes", hikes: 14, totalKm: 96.4, totalElevationM: 6100, weeklyKm: 18.2 },
  { uid: "demo-bea", displayName: "Bea Santos", handle: "bea.outdoors", hikes: 9, totalKm: 58.1, totalElevationM: 3900, weeklyKm: 12.6 },
  { uid: "demo-jomar", displayName: "Jomar Reyes", handle: "jomar_r", hikes: 21, totalKm: 140.7, totalElevationM: 9800, weeklyKm: 9.4 },
];
const posts = [
  { id: "post-1", authorId: "demo-bea", authorName: "Bea Santos", caption: "Sea of clouds at the Maculot summit this morning. Worth the 3 AM alarm.", trailId: "mt-maculot", trailName: "Mt. Maculot", photoUrls: [], likedBy: ["demo-marco", "demo-jomar"], commentCount: 0, createdAt: Date.now() - 3 * H, activity: { distanceKm: 6.4, durationSec: 15120, elevationGainM: 540 } },
  { id: "post-2", authorId: "demo-marco", authorName: "Marco Dela Cruz", caption: "Batulao ridges never get old.", trailId: "mt-batulao", trailName: "Mt. Batulao", photoUrls: [], likedBy: ["demo-bea"], commentCount: 0, createdAt: Date.now() - 26 * H },
];
const stories = [
  { id: "story-1", authorId: "demo-jomar", authorName: "Jomar Reyes", caption: "Trail buddies", trailName: "Mt. Batulao", createdAt: Date.now() - 4 * H },
  { id: "story-2", authorId: "demo-marco", authorName: "Marco Dela Cruz", caption: "Summit snacks", createdAt: Date.now() - 9 * H },
];

(async () => {
  const batch = db.batch();
  for (const { uid, ...data } of profiles) batch.set(db.collection("profiles").doc(uid), data);
  for (const { id, ...data } of posts) batch.set(db.collection("posts").doc(id), data);
  for (const { id, ...data } of stories) batch.set(db.collection("stories").doc(id), data);
  for (const { id, ...data } of trails) batch.set(db.collection("trails").doc(id), data);
  for (const { id, ...data } of guides) batch.set(db.collection("guides").doc(id), data);
  for (const { id, ...data } of reviews) batch.set(db.collection("reviews").doc(id), data);
  await batch.commit();
  console.log(`Seeded ${trails.length} trails, ${guides.length} guides, ${reviews.length} reviews, ${profiles.length} profiles, ${posts.length} posts, ${stories.length} stories into project "${project}".`);
  if (process.env.FIRESTORE_EMULATOR_HOST) console.log("(into the local emulator)");
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
