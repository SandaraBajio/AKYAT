import { Platform } from "react-native";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  updateProfile,
  type User,
} from "firebase/auth";
import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";

import { firebase } from "../lib/firebase";
import type {
  Activity,
  Booking,
  CreateBookingCheckoutRequest,
  CreateBookingCheckoutResponse,
  Guide,
  GuideReview,
  Post,
  PostComment,
  Profile,
  Review,
  Story,
  Trail,
} from "../types";
import {
  ServiceError,
  type ActivitiesService,
  type AppUser,
  type AuthService,
  type BookingsService,
  type FeedService,
  type GuidesService,
  type NotificationsService,
  type ReviewsService,
  type SafetyService,
  type SocialService,
  type TrailsService,
} from "./contracts";

/** Turn Firebase's technical errors into messages that are safe to show on screen. */
function friendly(err: unknown): ServiceError {
  if (err instanceof ServiceError) return err;
  const code = String((err as { code?: string })?.code ?? "").replace(/^(auth|functions)\//, "");
  const message = (err as { message?: string })?.message ?? "";
  const known: Record<string, string> = {
    "invalid-credential": "Wrong email or password.",
    "invalid-email": "That email address doesn't look right.",
    "email-already-in-use": "An account with that email already exists.",
    "weak-password": "Password must be at least 6 characters.",
    "too-many-requests": "Too many attempts. Please wait a moment and try again.",
    "network-request-failed": "No internet connection.",
    unauthenticated: "Please sign in first.",
    "resource-exhausted": message || "No guide is available for that date. Try another day.",
    "failed-precondition": message || "This trail is not open for booking.",
    "invalid-argument": message || "Please check your booking details.",
    "not-found": message || "We couldn't find that.",
    unavailable: "The server can't be reached right now. Try again shortly.",
  };
  return new ServiceError(known[code] ?? "Something went wrong. Please try again.", code || "unknown");
}

/** "Juan.Dela Cruz@mail.com" -> "juan.delacruz". Not unique-checked yet (TODO Data teammate). */
const handleFrom = (email: string | null) => (email ?? "hiker").split("@")[0].toLowerCase().replace(/[^a-z0-9_.]/g, "") || "hiker";

/** Firestore rejects `undefined` values, so drop them before every write. */
function clean<T extends Record<string, unknown>>(obj: T): T {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as T;
}

async function toAppUser(user: User): Promise<AppUser> {
  const { db } = firebase();
  const snap = await getDoc(doc(db, "users", user.uid));
  const data = snap.data();
  return {
    uid: user.uid,
    email: user.email ?? "",
    displayName: data?.displayName ?? user.displayName ?? "Hiker",
    handle: handleFrom(user.email),
    role: data?.role ?? "hiker",
  };
}

export const firebaseAuth: AuthService = {
  onAuthChange(cb) {
    const { auth } = firebase();
    return onAuthStateChanged(auth, async (user) => {
      if (!user) return cb(null);
      try {
        cb(await toAppUser(user));
      } catch {
        // Profile doc not readable yet (just signed up). Fall back to basics.
        cb({ uid: user.uid, email: user.email ?? "", displayName: user.displayName ?? "Hiker", handle: handleFrom(user.email), role: "hiker" });
      }
    });
  },

  async signIn(email, password) {
    try {
      await signInWithEmailAndPassword(firebase().auth, email.trim(), password);
    } catch (e) {
      throw friendly(e);
    }
  },

  async signUp(email, password, displayName) {
    try {
      const { auth, db } = firebase();
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await updateProfile(cred.user, { displayName });
      // Firestore rules only allow creating your own profile as role "hiker".
      await setDoc(doc(db, "users", cred.user.uid), {
        displayName,
        role: "hiker",
        fcmTokens: [],
        following: [],
        createdAt: serverTimestamp(),
      });
      // Public profile. Stats start at zero and are only ever changed by the onActivityCreated function.
      await setDoc(doc(db, "profiles", cred.user.uid), {
        displayName,
        handle: handleFrom(email),
        hikes: 0,
        totalKm: 0,
        totalElevationM: 0,
        weeklyKm: 0,
      });
    } catch (e) {
      throw friendly(e);
    }
  },

  async signOut() {
    await fbSignOut(firebase().auth);
  },
};

export const firebaseTrails: TrailsService = {
  async listTrails() {
    try {
      const snap = await getDocs(query(collection(firebase().db, "trails"), where("active", "==", true)));
      return snap.docs.map((d) => ({ ...(d.data() as Trail), id: d.id }));
    } catch (e) {
      throw friendly(e);
    }
  },
  async getTrail(id) {
    try {
      const snap = await getDoc(doc(firebase().db, "trails", id));
      return snap.exists() ? { ...(snap.data() as Trail), id: snap.id } : null;
    } catch (e) {
      throw friendly(e);
    }
  },
};

export const firebaseBookings: BookingsService = {
  async createBookingCheckout(req) {
    try {
      const call = httpsCallable<CreateBookingCheckoutRequest, CreateBookingCheckoutResponse>(
        firebase().functions,
        "createBookingCheckout"
      );
      return (await call(req)).data;
    } catch (e) {
      throw friendly(e);
    }
  },

  subscribeMyBookings(uid, cb) {
    // The rules only allow reading your own bookings, so the query must filter by hikerId.
    const q = query(collection(firebase().db, "bookings"), where("hikerId", "==", uid));
    return onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => ({ ...(d.data() as Booking), id: d.id }));
        cb(list.sort((a, b) => b.createdAt - a.createdAt)); // newest first (no composite index needed)
      },
      () => cb([])
    );
  },
};

export const firebaseNotifications: NotificationsService = {
  async registerDevice(uid) {
    // The backend sends through FCM, which needs the native device token. Android only for now;
    // iOS needs extra APNs/FCM setup. Also needs a development build, not Expo Go.
    if (Platform.OS !== "android" || !Device.isDevice) return;
    try {
      const perm = await Notifications.requestPermissionsAsync();
      if (!perm.granted) return;
      const token = await Notifications.getDevicePushTokenAsync();
      if (typeof token.data !== "string") return;
      await updateDoc(doc(firebase().db, "users", uid), { fcmTokens: arrayUnion(token.data) });
    } catch {
      /* Notifications are optional; never block login because of them. */
    }
  },
};

export const firebaseReviews: ReviewsService = {
  async listReviews(trailId) {
    try {
      const snap = await getDocs(query(collection(firebase().db, "reviews"), where("trailId", "==", trailId)));
      const list = snap.docs.map((d) => ({ ...(d.data() as Review), id: d.id }));
      return list.sort((a, b) => b.createdAt - a.createdAt);
    } catch (e) {
      throw friendly(e);
    }
  },
  async createTrailReview(user, input) {
    try {
      await addDoc(collection(firebase().db, "reviews"), {
        trailId: input.trailId,
        userId: user.uid,
        userName: user.displayName,
        rating: Math.round(input.rating),
        comment: input.comment,
        createdAt: Date.now(),
      });
    } catch (e) {
      throw friendly(e);
    }
  },
  async createGuideReview(user, input) {
    try {
      await addDoc(
        collection(firebase().db, "guideReviews"),
        clean({
          guideId: input.guideId,
          bookingId: input.bookingId,
          hikerId: user.uid,
          hikerName: user.displayName,
          rating: Math.round(input.rating),
          tags: input.tags,
          comment: input.comment,
          createdAt: Date.now(),
        })
      );
    } catch (e) {
      throw friendly(e);
    }
  },
};

export const firebaseGuides: GuidesService = {
  async listGuides() {
    try {
      const snap = await getDocs(query(collection(firebase().db, "guides"), where("active", "==", true)));
      return snap.docs.map((d) => ({ ...(d.data() as Guide), id: d.id }));
    } catch (e) {
      throw friendly(e);
    }
  },
  async getGuide(id) {
    try {
      const snap = await getDoc(doc(firebase().db, "guides", id));
      return snap.exists() ? { ...(snap.data() as Guide), id: snap.id } : null;
    } catch (e) {
      throw friendly(e);
    }
  },
  async listGuideReviews(guideId) {
    try {
      const snap = await getDocs(query(collection(firebase().db, "guideReviews"), where("guideId", "==", guideId)));
      return snap.docs.map((d) => ({ ...(d.data() as GuideReview), id: d.id })).sort((a, b) => b.createdAt - a.createdAt);
    } catch (e) {
      throw friendly(e);
    }
  },
};

export const firebaseActivities: ActivitiesService = {
  async saveActivity(input) {
    try {
      const createdAt = Date.now();
      const ref = await addDoc(collection(firebase().db, "activities"), clean({ ...input, createdAt }));
      return { ...input, id: ref.id, createdAt };
    } catch (e) {
      throw friendly(e);
    }
  },
  async listMyActivities(uid) {
    try {
      const snap = await getDocs(query(collection(firebase().db, "activities"), where("hikerId", "==", uid)));
      return snap.docs.map((d) => ({ ...(d.data() as Activity), id: d.id })).sort((a, b) => b.startedAt - a.startedAt);
    } catch (e) {
      throw friendly(e);
    }
  },
};

const DAY_MS = 24 * 60 * 60 * 1000;

export const firebaseFeed: FeedService = {
  async listStories() {
    try {
      const q = query(collection(firebase().db, "stories"), where("createdAt", ">", Date.now() - DAY_MS));
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ ...(d.data() as Story), id: d.id })).sort((a, b) => a.createdAt - b.createdAt);
    } catch (e) {
      throw friendly(e);
    }
  },
  async listPosts() {
    try {
      const snap = await getDocs(query(collection(firebase().db, "posts"), orderBy("createdAt", "desc"), limit(30)));
      return snap.docs.map((d) => ({ ...(d.data() as Post), id: d.id }));
    } catch (e) {
      throw friendly(e);
    }
  },
  async toggleLike(postId, uid) {
    try {
      const ref = doc(firebase().db, "posts", postId);
      const snap = await getDoc(ref);
      const liked = ((snap.data()?.likedBy as string[] | undefined) ?? []).includes(uid);
      await updateDoc(ref, { likedBy: liked ? arrayRemove(uid) : arrayUnion(uid) });
    } catch (e) {
      throw friendly(e);
    }
  },
  async listComments(postId) {
    try {
      const snap = await getDocs(query(collection(firebase().db, "posts", postId, "comments"), orderBy("createdAt", "asc")));
      return snap.docs.map((d) => ({ ...(d.data() as PostComment), id: d.id }));
    } catch (e) {
      throw friendly(e);
    }
  },
  async addComment(postId, author, text) {
    try {
      const { db } = firebase();
      const data = { postId, authorId: author.uid, authorName: author.displayName, text, createdAt: Date.now() };
      const ref = await addDoc(collection(db, "posts", postId, "comments"), data);
      await updateDoc(doc(db, "posts", postId), { commentCount: increment(1) });
      return { ...data, id: ref.id };
    } catch (e) {
      throw friendly(e);
    }
  },
  async createPost(author, input) {
    // TODO (Data teammate): upload input.photoUri to Cloud Storage and use the download URL.
    // Until then, photos can't be saved in Firebase mode, so say so rather than silently dropping them.
    if (input.photoUri && !/^https?:/.test(input.photoUri)) {
      throw new ServiceError("Photo upload isn't set up yet. Post without a photo for now.", "unimplemented");
    }
    try {
      const { db } = firebase();
      if (input.asStory) {
        await addDoc(
          collection(db, "stories"),
          clean({ authorId: author.uid, authorName: author.displayName, photoUrl: input.photoUri, caption: input.caption, trailName: input.trailName, createdAt: Date.now() })
        );
        return;
      }
      await addDoc(
        collection(db, "posts"),
        clean({
          authorId: author.uid,
          authorName: author.displayName,
          caption: input.caption,
          trailId: input.trailId,
          trailName: input.trailName,
          photoUrls: input.photoUri ? [input.photoUri] : [],
          likedBy: [],
          commentCount: 0,
          createdAt: Date.now(),
          activity: input.activity,
        })
      );
    } catch (e) {
      throw friendly(e);
    }
  },
};

export const firebaseSocial: SocialService = {
  async listProfiles(me) {
    try {
      const snap = await getDocs(query(collection(firebase().db, "profiles"), limit(50)));
      return snap.docs.filter((d) => d.id !== me).map((d) => ({ ...(d.data() as Profile), uid: d.id }));
    } catch (e) {
      throw friendly(e);
    }
  },
  async getFollowing(uid) {
    try {
      const snap = await getDoc(doc(firebase().db, "users", uid));
      return (snap.data()?.following as string[] | undefined) ?? [];
    } catch (e) {
      throw friendly(e);
    }
  },
  async setFollowing(uid, targetUid, follow) {
    try {
      await updateDoc(doc(firebase().db, "users", uid), { following: follow ? arrayUnion(targetUid) : arrayRemove(targetUid) });
    } catch (e) {
      throw friendly(e);
    }
  },
  async leaderboard() {
    try {
      const snap = await getDocs(query(collection(firebase().db, "profiles"), orderBy("weeklyKm", "desc"), limit(20)));
      return snap.docs.map((d) => ({ ...(d.data() as Profile), uid: d.id }));
    } catch (e) {
      throw friendly(e);
    }
  },
};

export const firebaseSafety: SafetyService = {
  async sendEmergencyAlert() {
    // TODO (Backend): callable `sendEmergencyAlert` that notifies the assigned guide + barangay responders.
    return { sent: false };
  },
};
