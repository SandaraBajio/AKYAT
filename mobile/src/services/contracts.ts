import type {
  Activity,
  Booking,
  CreateBookingCheckoutRequest,
  CreateBookingCheckoutResponse,
  Guide,
  GuideReview,
  LatLng,
  Post,
  PostComment,
  Profile,
  Review,
  Story,
  Trail,
} from "../types";

/** The signed-in person. `role` decides which screens they see (UI teammates use this). */
export interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  handle: string; // "juan_hikes", shown as @juan_hikes
  role: "hiker" | "guide" | "barangay";
}

/**
 * THE CONTRACT between UI and data. Screens only import from `services/index.ts`,
 * never from firebase directly. There is a real (Firebase) and a mock implementation of each.
 */
export interface AuthService {
  /** Calls back immediately with the current user (or null) and again on every change. */
  onAuthChange(cb: (user: AppUser | null) => void): () => void;
  signIn(email: string, password: string): Promise<void>;
  signUp(email: string, password: string, displayName: string): Promise<void>;
  signOut(): Promise<void>;
}

export interface TrailsService {
  listTrails(): Promise<Trail[]>;
  getTrail(id: string): Promise<Trail | null>;
}

export interface NewTrailReview {
  trailId: string;
  rating: number; // 1-5
  comment: string;
}
export interface NewGuideReview {
  guideId: string;
  bookingId?: string;
  rating: number; // 1-5
  tags: string[];
  comment: string;
}

export interface ReviewsService {
  listReviews(trailId: string): Promise<Review[]>;
  createTrailReview(user: AppUser, input: NewTrailReview): Promise<void>;
  createGuideReview(user: AppUser, input: NewGuideReview): Promise<void>;
}

export interface GuidesService {
  listGuides(): Promise<Guide[]>;
  getGuide(id: string): Promise<Guide | null>;
  listGuideReviews(guideId: string): Promise<GuideReview[]>;
}

export interface BookingsService {
  /** Calls the backend Cloud Function. Throws a ServiceError with a friendly message. */
  createBookingCheckout(req: CreateBookingCheckoutRequest): Promise<CreateBookingCheckoutResponse>;
  /** Live list of this hiker's bookings, newest first. Returns an unsubscribe function. */
  subscribeMyBookings(uid: string, cb: (bookings: Booking[]) => void): () => void;
}

/** Strava-style recorded hikes. */
export type NewActivity = Omit<Activity, "id" | "createdAt">;
export interface ActivitiesService {
  saveActivity(input: NewActivity): Promise<Activity>;
  /** This hiker's activities, newest first. */
  listMyActivities(uid: string): Promise<Activity[]>;
}

export interface NewPostInput {
  caption: string;
  /** A local file URI from the image picker. */
  photoUri?: string;
  trailId?: string;
  trailName?: string;
  activity?: Post["activity"];
  /** true = a 24-hour story instead of a feed post */
  asStory: boolean;
}

/** Instagram-style community: posts, stories, likes, comments. */
export interface FeedService {
  listStories(): Promise<Story[]>;
  listPosts(): Promise<Post[]>;
  toggleLike(postId: string, uid: string): Promise<void>;
  listComments(postId: string): Promise<PostComment[]>;
  addComment(postId: string, author: AppUser, text: string): Promise<PostComment>;
  createPost(author: AppUser, input: NewPostInput): Promise<void>;
}

/** Friends and leaderboard. "Following" is the friend list. */
export interface SocialService {
  /** Other hikers (not me). */
  listProfiles(me: string): Promise<Profile[]>;
  getFollowing(uid: string): Promise<string[]>;
  setFollowing(uid: string, targetUid: string, follow: boolean): Promise<void>;
  /** Everyone including me, highest 7-day distance first. */
  leaderboard(): Promise<Profile[]>;
}

export interface SafetyService {
  /**
   * Emergency alert from the live hike screen.
   * NOT IMPLEMENTED YET: needs a Cloud Function that texts/pushes the assigned guide and barangay
   * responders. Until then it returns { sent: false } and the UI says so.
   */
  sendEmergencyAlert(user: AppUser, location: LatLng | null): Promise<{ sent: boolean }>;
}

export interface NotificationsService {
  /** Asks permission and saves the device's FCM token to users/{uid}.fcmTokens. Safe to call every login. */
  registerDevice(uid: string): Promise<void>;
}

/** Error with a message safe to show directly to the user. */
export class ServiceError extends Error {
  constructor(
    message: string,
    public code: string = "unknown"
  ) {
    super(message);
    this.name = "ServiceError";
  }
}
