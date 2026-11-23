// AUTO-COPIED from functions/src/types.ts by `npm run sync-types`. Do not edit here.
/**
 * Shared data contracts for Akyat.
 * The Data & Integrations teammate owns the Firestore schema; keep this file in sync with it.
 * All money is stored in centavos (PHP) as integers to avoid floating-point errors.
 */

export type BookingStatus =
  | "pending_payment" // created, waiting for PayMongo checkout to complete
  | "confirmed" // paid and a guide has been assigned
  | "paid_unassigned" // paid but no guide was free (needs admin action or refund)
  | "cancelled" // checkout expired or was cancelled before payment
  | "completed"; // hike finished

export type Difficulty = "easy" | "moderate" | "hard";

export interface LatLng {
  lat: number;
  lng: number;
}

export interface Trail {
  id: string;
  name: string;
  pricePerPerson: number; // centavos
  maxGroupSize: number;
  active: boolean;

  // Display fields for the trail pages (AllTrails-style). All optional: the backend never reads
  // them, so the Data team can fill them in over time without touching the functions.
  description?: string;
  location?: string; // "Batangas, Philippines"
  difficulty?: Difficulty;
  distanceKm?: number;
  elevationGainM?: number;
  durationHours?: number;
  rating?: number; // 0-5 average (later: computed from reviews)
  reviewCount?: number;
  photoUrls?: string[]; // first one is the cover photo (Cloud Storage download URLs)
  elevationProfile?: number[]; // metres above sea level, evenly spaced along the route
  route?: LatLng[]; // GPS points along the trail, start to end
}

export interface Review {
  id: string;
  trailId: string;
  userId: string;
  userName: string;
  rating: number; // 1-5
  comment: string;
  createdAt: number; // epoch millis
}

export interface Guide {
  id: string;
  name: string;
  active: boolean;
  trailIds: string[]; // trails this guide is accredited for
  assignedCount: number; // total confirmed assignments (fair-queue counter)
  lastAssignedAt: number | null; // epoch millis, null if never assigned

  // Display fields for the guide profile page. Optional; the dispatch logic never reads them.
  bio?: string;
  yearsExperience?: number;
  photoUrl?: string;
  rating?: number; // 0-5 average of guideReviews
  reviewCount?: number;
}

export interface Booking {
  id: string;
  hikerId: string;
  trailId: string;
  guideId: string | null;
  dateKey: string; // "YYYY-MM-DD" in Asia/Manila
  partySize: number;
  amount: number; // centavos
  status: BookingStatus;
  checkoutSessionId: string | null;
  checkoutUrl: string | null;
  paymentId: string | null;
  createdAt: number; // epoch millis
  paidAt: number | null;
}

/** Callable request/response contracts, used by the UI team. */
export interface CreateBookingCheckoutRequest {
  trailId: string;
  dateKey: string; // "YYYY-MM-DD"
  partySize: number;
}

export interface CreateBookingCheckoutResponse {
  bookingId: string;
  checkoutUrl: string;
}

/* ------------------------------------------------------------------------- */
/* Hike tracking, community and profile                                       */
/* ------------------------------------------------------------------------- */

/** One recorded hike (the Strava-style activity). `route` is the filtered GPS track. */
export interface Activity {
  id: string;
  hikerId: string;
  trailId: string | null; // null = a free hike not tied to a listed trail
  trailName: string | null;
  startedAt: number; // epoch millis
  durationSec: number; // moving time, pauses excluded
  distanceKm: number;
  elevationGainM: number;
  route: LatLng[];
  createdAt: number;
}

/** Public profile, one per user. The stat fields are maintained by the onActivityCreated Cloud Function. */
export interface Profile {
  uid: string;
  displayName: string;
  handle: string; // "juan_hikes"
  bio?: string;
  hikes: number;
  totalKm: number;
  totalElevationM: number;
  weeklyKm: number; // distance in the last 7 days (leaderboard)
}

/** A feed post. Only a summary of the hike is attached, never the GPS route. */
export interface Post {
  id: string;
  authorId: string;
  authorName: string;
  caption: string;
  trailId?: string;
  trailName?: string;
  photoUrls: string[];
  likedBy: string[]; // uids; like count = likedBy.length
  commentCount: number;
  createdAt: number;
  activity?: { distanceKm: number; durationSec: number; elevationGainM: number };
}

export interface PostComment {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  text: string;
  createdAt: number;
}

/** A story disappears from the feed 24 hours after createdAt. */
export interface Story {
  id: string;
  authorId: string;
  authorName: string;
  photoUrl?: string;
  caption?: string;
  trailName?: string;
  createdAt: number;
}

export interface GuideReview {
  id: string;
  guideId: string;
  bookingId?: string;
  hikerId: string;
  hikerName: string;
  rating: number; // 1-5
  tags: string[]; // "Knowledgeable", "Friendly", "Safe"...
  comment: string;
  createdAt: number;
}
