import { USE_MOCK } from "../lib/firebase";
import { mockAuth, mockBookings, mockNotifications, mockTrails } from "./mock";
import { mockActivities, mockFeed, mockGuides, mockReviews, mockSafety, mockSocial } from "./mockExtra";
import type {
  ActivitiesService,
  AuthService,
  BookingsService,
  FeedService,
  GuidesService,
  NotificationsService,
  ReviewsService,
  SafetyService,
  SocialService,
  TrailsService,
} from "./contracts";

/**
 * The ONLY file screens should import services from.
 *   import { authService, trailsService, bookingsService } from "../src/services";
 * Mock mode is chosen automatically (see .env.example). The real implementations are loaded
 * lazily so mock mode never initialises Firebase.
 */
type Impl = {
  auth: AuthService;
  trails: TrailsService;
  bookings: BookingsService;
  notifications: NotificationsService;
  reviews: ReviewsService;
  guides: GuidesService;
  activities: ActivitiesService;
  feed: FeedService;
  social: SocialService;
  safety: SafetyService;
};

const impl: Impl = USE_MOCK
  ? { auth: mockAuth, trails: mockTrails, bookings: mockBookings, notifications: mockNotifications, reviews: mockReviews, guides: mockGuides, activities: mockActivities, feed: mockFeed, social: mockSocial, safety: mockSafety }
  : (() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const fb = require("./firebase") as typeof import("./firebase");
      return {
        auth: fb.firebaseAuth,
        trails: fb.firebaseTrails,
        bookings: fb.firebaseBookings,
        notifications: fb.firebaseNotifications,
        reviews: fb.firebaseReviews,
        guides: fb.firebaseGuides,
        activities: fb.firebaseActivities,
        feed: fb.firebaseFeed,
        social: fb.firebaseSocial,
        safety: fb.firebaseSafety,
      };
    })();

export const authService = impl.auth;
export const trailsService = impl.trails;
export const bookingsService = impl.bookings;
export const notificationsService = impl.notifications;
export const reviewsService = impl.reviews;
export const guidesService = impl.guides;
export const activitiesService = impl.activities;
export const feedService = impl.feed;
export const socialService = impl.social;
export const safetyService = impl.safety;
export const isMockMode = USE_MOCK;

export { ServiceError } from "./contracts";
export type { AppUser, NewActivity, NewPostInput } from "./contracts";
