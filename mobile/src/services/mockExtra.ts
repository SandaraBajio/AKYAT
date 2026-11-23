import { ME, GUIDES, GUIDE_REVIEWS, PEOPLE, SAMPLE_ACTIVITIES, SAMPLE_COMMENTS, SAMPLE_POSTS, SAMPLE_STORIES } from "../data/mockSocial";
import { sampleReviews } from "../data/sampleTrails";
import type { Activity, GuideReview, Post, PostComment, Profile, Review, Story } from "../types";
import type {
  ActivitiesService,
  FeedService,
  GuidesService,
  ReviewsService,
  SafetyService,
  SocialService,
} from "./contracts";

/** In-memory fakes for the community, ratings, activities and friends features. Reset on app reload. */

const wait = (ms = 120) => new Promise((r) => setTimeout(r, ms));
let seq = 100;
const nextId = (p: string) => `${p}${seq++}`;

/* ------------------------------ activities -------------------------------- */
let activities: Activity[] = [...SAMPLE_ACTIVITIES];

export const mockActivities: ActivitiesService = {
  async saveActivity(input) {
    await wait();
    const a: Activity = { ...input, id: nextId("a"), createdAt: Date.now() };
    activities = [a, ...activities];
    return a;
  },
  async listMyActivities() {
    await wait();
    return [...activities].sort((x, y) => y.startedAt - x.startedAt);
  },
};

/* --------------------------------- feed ----------------------------------- */
let posts: Post[] = SAMPLE_POSTS.map((p) => ({ ...p }));
let stories: Story[] = [...SAMPLE_STORIES];
let comments: PostComment[] = [...SAMPLE_COMMENTS];
const DAY = 24 * 60 * 60 * 1000;

export const mockFeed: FeedService = {
  async listStories() {
    await wait();
    return stories.filter((s) => Date.now() - s.createdAt < DAY).sort((a, b) => a.createdAt - b.createdAt);
  },
  async listPosts() {
    await wait();
    return [...posts].sort((a, b) => b.createdAt - a.createdAt);
  },
  async toggleLike(postId, uid) {
    posts = posts.map((p) =>
      p.id !== postId ? p : { ...p, likedBy: p.likedBy.includes(uid) ? p.likedBy.filter((u) => u !== uid) : [...p.likedBy, uid] }
    );
  },
  async listComments(postId) {
    await wait(80);
    return comments.filter((c) => c.postId === postId).sort((a, b) => a.createdAt - b.createdAt);
  },
  async addComment(postId, author, text) {
    const c: PostComment = { id: nextId("c"), postId, authorId: author.uid, authorName: author.displayName, text, createdAt: Date.now() };
    comments = [...comments, c];
    posts = posts.map((p) => (p.id === postId ? { ...p, commentCount: p.commentCount + 1 } : p));
    return c;
  },
  async createPost(author, input) {
    await wait();
    if (input.asStory) {
      stories = [...stories, { id: nextId("s"), authorId: author.uid, authorName: author.displayName, photoUrl: input.photoUri, caption: input.caption, trailName: input.trailName, createdAt: Date.now() }];
      return;
    }
    posts = [
      { id: nextId("post"), authorId: author.uid, authorName: author.displayName, caption: input.caption, trailId: input.trailId, trailName: input.trailName, photoUrls: input.photoUri ? [input.photoUri] : [], likedBy: [], commentCount: 0, createdAt: Date.now(), activity: input.activity },
      ...posts,
    ];
  },
};

/* -------------------------------- friends --------------------------------- */
let following = new Set<string>(["p-marco", "p-bea", "p-jomar"]);

function weeklyKmOf(list: Activity[]) {
  const since = Date.now() - 7 * DAY;
  return Math.round(list.filter((a) => a.startedAt >= since).reduce((s, a) => s + a.distanceKm, 0) * 10) / 10;
}

export const mockSocial: SocialService = {
  async listProfiles() {
    await wait();
    return PEOPLE;
  },
  async getFollowing() {
    return [...following];
  },
  async setFollowing(_uid, targetUid, follow) {
    follow ? following.add(targetUid) : following.delete(targetUid);
    following = new Set(following);
  },
  async leaderboard() {
    await wait();
    const me: Profile = {
      uid: ME,
      displayName: "You",
      handle: "you",
      hikes: activities.length,
      totalKm: Math.round(activities.reduce((s, a) => s + a.distanceKm, 0) * 10) / 10,
      totalElevationM: activities.reduce((s, a) => s + a.elevationGainM, 0),
      weeklyKm: weeklyKmOf(activities),
    };
    return [...PEOPLE, me].sort((a, b) => b.weeklyKm - a.weeklyKm);
  },
};

/* ------------------------- guides and all reviews -------------------------- */
const trailReviews = new Map<string, Review[]>();
let guideReviews: GuideReview[] = [...GUIDE_REVIEWS];

export const mockGuides: GuidesService = {
  async listGuides() {
    await wait();
    return GUIDES;
  },
  async getGuide(id) {
    return GUIDES.find((g) => g.id === id) ?? null;
  },
  async listGuideReviews(guideId) {
    await wait(80);
    return guideReviews.filter((r) => r.guideId === guideId).sort((a, b) => b.createdAt - a.createdAt);
  },
};

export const mockReviews: ReviewsService = {
  async listReviews(trailId) {
    if (!trailReviews.has(trailId)) trailReviews.set(trailId, sampleReviews(trailId));
    return [...trailReviews.get(trailId)!];
  },
  async createTrailReview(user, input) {
    const existing = trailReviews.get(input.trailId) ?? sampleReviews(input.trailId);
    const r: Review = { id: nextId("r"), trailId: input.trailId, userId: user.uid, userName: user.displayName, rating: input.rating, comment: input.comment, createdAt: Date.now() };
    trailReviews.set(input.trailId, [r, ...existing]);
  },
  async createGuideReview(user, input) {
    guideReviews = [
      { id: nextId("gr"), guideId: input.guideId, bookingId: input.bookingId, hikerId: user.uid, hikerName: user.displayName, rating: input.rating, tags: input.tags, comment: input.comment, createdAt: Date.now() },
      ...guideReviews,
    ];
  },
};

/* --------------------------------- safety ---------------------------------- */
export const mockSafety: SafetyService = {
  async sendEmergencyAlert() {
    await wait(400);
    return { sent: false }; // honest: nothing is sent until the backend alert function exists
  },
};
