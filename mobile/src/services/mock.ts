import { GUIDES } from "../data/mockSocial";
import { SAMPLE_TRAILS } from "../data/sampleTrails";
import type { Booking, Guide, Trail } from "../types";
import {
  ServiceError,
  type AppUser,
  type AuthService,
  type BookingsService,
  type NotificationsService,
  type TrailsService,
} from "./contracts";

/** In-memory fake backend so the UI can be built with no Firebase and no internet. */

const MOCK_TRAILS: Trail[] = SAMPLE_TRAILS;

const MOCK_GUIDES: Pick<Guide, "id" | "name">[] = GUIDES;

let currentUser: AppUser | null = null;
const authListeners = new Set<(u: AppUser | null) => void>();
const emitAuth = () => authListeners.forEach((cb) => cb(currentUser));

export const mockAuth: AuthService = {
  onAuthChange(cb) {
    authListeners.add(cb);
    cb(currentUser);
    return () => authListeners.delete(cb);
  },
  async signIn(email) {
    const base = email.split("@")[0];
    currentUser = { uid: "mock-user", email, displayName: base, handle: base.toLowerCase().replace(/[^a-z0-9_.]/g, ""), role: "hiker" };
    emitAuth();
  },
  async signUp(email, _password, displayName) {
    currentUser = { uid: "mock-user", email, displayName, handle: displayName.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "") || "hiker", role: "hiker" };
    emitAuth();
  },
  async signOut() {
    currentUser = null;
    emitAuth();
  },
};

export const mockTrails: TrailsService = {
  async listTrails() {
    return MOCK_TRAILS.filter((t) => t.active);
  },
  async getTrail(id) {
    return MOCK_TRAILS.find((t) => t.id === id) ?? null;
  },
};

let bookings: Booking[] = [];
const bookingListeners = new Set<() => void>();
const emitBookings = () => bookingListeners.forEach((cb) => cb());
let nextId = 1;

export const mockBookings: BookingsService = {
  async createBookingCheckout(req) {
    const trail = MOCK_TRAILS.find((t) => t.id === req.trailId);
    if (!trail || !trail.active) throw new ServiceError("This trail is not open for booking.", "failed-precondition");
    if (req.partySize < 1 || req.partySize > trail.maxGroupSize) {
      throw new ServiceError(`Maximum group size is ${trail.maxGroupSize}.`, "invalid-argument");
    }
    const taken = bookings.filter((b) => b.dateKey === req.dateKey && b.status === "confirmed").length;
    if (taken >= MOCK_GUIDES.length) {
      throw new ServiceError("No guide is available for that date. Try another day.", "resource-exhausted");
    }

    const id = `mock-booking-${nextId++}`;
    const booking: Booking = {
      id,
      hikerId: "mock-user",
      trailId: req.trailId,
      guideId: null,
      dateKey: req.dateKey,
      partySize: req.partySize,
      amount: trail.pricePerPerson * req.partySize,
      status: "pending_payment",
      checkoutSessionId: `mock-session-${id}`,
      checkoutUrl: "mock://checkout",
      paymentId: null,
      createdAt: Date.now(),
      paidAt: null,
    };
    bookings = [booking, ...bookings];
    emitBookings();

    // Pretend PayMongo's webhook arrives 3 seconds later and the fair queue assigns a guide.
    setTimeout(() => {
      const guide = MOCK_GUIDES[(nextId - 1) % MOCK_GUIDES.length];
      bookings = bookings.map((b) =>
        b.id === id ? { ...b, status: "confirmed", guideId: guide.id, paymentId: "mock-pay", paidAt: Date.now() } : b
      );
      emitBookings();
    }, 3000);

    return { bookingId: id, checkoutUrl: "mock://checkout" };
  },

  subscribeMyBookings(_uid, cb) {
    const push = () => cb([...bookings]);
    bookingListeners.add(push);
    push();
    return () => bookingListeners.delete(push);
  },
};

export const mockNotifications: NotificationsService = {
  async registerDevice() {
    /* nothing to do in mock mode */
  },
};
