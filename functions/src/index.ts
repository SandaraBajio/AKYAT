import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";
import { onCall, onRequest, HttpsError } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { onDocumentCreated, onDocumentUpdated } from "firebase-functions/v2/firestore";
import { logger } from "firebase-functions/v2";

import {
  APP_CANCEL_URL,
  APP_SUCCESS_URL,
  CHECKOUT_EXPIRY_MS,
  COL,
  PAYMONGO_SECRET_KEY,
  PAYMONGO_WEBHOOK_SECRET,
  RECONCILE_MIN_AGE_MS,
  REGION,
  TIME_ZONE,
} from "./config";
import { finalizePaidBooking, hasAvailableGuide } from "./bookings";
import { isValidDateKey, todayKey, tomorrowKey } from "./dates";
import {
  createCheckoutSession,
  getCheckoutSessionState,
  verifyWebhookSignature,
} from "./paymongo";
import { sanitizeActivityNumbers, sumWeeklyKm } from "./stats";
import type {
  Activity,
  Booking,
  CreateBookingCheckoutRequest,
  CreateBookingCheckoutResponse,
  Trail,
} from "./types";

initializeApp();
const db = getFirestore();

/* -------------------------------------------------------------------------- */
/* 1. createBookingCheckout (callable, called by the mobile app)              */
/* -------------------------------------------------------------------------- */
export const createBookingCheckout = onCall(
  { region: REGION, secrets: [PAYMONGO_SECRET_KEY] },
  async (request): Promise<CreateBookingCheckoutResponse> => {
    if (!request.auth) throw new HttpsError("unauthenticated", "Please sign in to book a hike.");

    const { trailId, dateKey, partySize } = (request.data ?? {}) as Partial<CreateBookingCheckoutRequest>;
    if (typeof trailId !== "string" || !trailId) {
      throw new HttpsError("invalid-argument", "trailId is required.");
    }
    if (!isValidDateKey(dateKey)) {
      throw new HttpsError("invalid-argument", "dateKey must be a valid YYYY-MM-DD date.");
    }
    if (dateKey < todayKey()) {
      throw new HttpsError("invalid-argument", "You can't book a hike in the past.");
    }
    if (!Number.isInteger(partySize) || (partySize as number) < 1) {
      throw new HttpsError("invalid-argument", "partySize must be a whole number of at least 1.");
    }

    const trailSnap = await db.collection(COL.trails).doc(trailId).get();
    if (!trailSnap.exists) throw new HttpsError("not-found", "Trail not found.");
    const trail = { ...(trailSnap.data() as Trail), id: trailSnap.id };
    if (!trail.active) throw new HttpsError("failed-precondition", "This trail is not open for booking.");
    if ((partySize as number) > trail.maxGroupSize) {
      throw new HttpsError("invalid-argument", `Maximum group size is ${trail.maxGroupSize}.`);
    }

    // Don't take money if nobody can guide that day. (Not a reservation: see finalizePaidBooking.)
    if (!(await hasAvailableGuide(trailId, dateKey, db))) {
      throw new HttpsError("resource-exhausted", "No guide is available for that date. Try another day.");
    }

    const amount = trail.pricePerPerson * (partySize as number);
    const bookingRef = db.collection(COL.bookings).doc();
    const now = Date.now();
    const booking: Booking = {
      id: bookingRef.id,
      hikerId: request.auth.uid,
      trailId,
      guideId: null,
      dateKey,
      partySize: partySize as number,
      amount,
      status: "pending_payment",
      checkoutSessionId: null,
      checkoutUrl: null,
      paymentId: null,
      createdAt: now,
      paidAt: null,
    };
    await bookingRef.set(booking);

    try {
      const session = await createCheckoutSession({
        secretKey: PAYMONGO_SECRET_KEY.value(),
        bookingId: bookingRef.id,
        amount: trail.pricePerPerson,
        quantity: partySize as number,
        name: `${trail.name} hike (${dateKey})`,
        description: `Akyat guided hike booking ${bookingRef.id}`,
        successUrl: APP_SUCCESS_URL.value(),
        cancelUrl: APP_CANCEL_URL.value(),
      });
      await bookingRef.update({
        checkoutSessionId: session.sessionId,
        checkoutUrl: session.checkoutUrl,
      });
      return { bookingId: bookingRef.id, checkoutUrl: session.checkoutUrl };
    } catch (err) {
      logger.error("Checkout creation failed", { bookingId: bookingRef.id, err });
      await bookingRef.update({ status: "cancelled" });
      throw new HttpsError("internal", "Could not start payment. Please try again.");
    }
  }
);

/* -------------------------------------------------------------------------- */
/* 2. paymongoWebhook (HTTPS, called by PayMongo)                             */
/* -------------------------------------------------------------------------- */
export const paymongoWebhook = onRequest(
  { region: REGION, secrets: [PAYMONGO_WEBHOOK_SECRET] },
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).send("Method not allowed");
      return;
    }

    const rawBody = req.rawBody.toString("utf8");
    const signature = req.header("Paymongo-Signature");
    if (!verifyWebhookSignature(rawBody, signature, PAYMONGO_WEBHOOK_SECRET.value())) {
      logger.warn("Rejected webhook with invalid signature");
      res.status(401).send("Invalid signature");
      return;
    }

    try {
      const event = req.body?.data?.attributes;
      if (event?.type !== "checkout_session.payment.paid") {
        res.status(200).send("Ignored"); // acknowledge events we don't act on
        return;
      }

      const session = event.data;
      const bookingId: string | undefined =
        session?.attributes?.metadata?.bookingId ?? session?.attributes?.reference_number;
      const paymentId: string | null = session?.attributes?.payments?.[0]?.id ?? null;
      if (!bookingId) {
        logger.error("Paid webhook without bookingId", { sessionId: session?.id });
        res.status(200).send("No booking reference"); // retrying won't help
        return;
      }

      const outcome = await finalizePaidBooking(bookingId, paymentId, db);
      logger.info("Webhook processed", { bookingId, outcome });
      res.status(200).json({ ok: true, outcome: outcome.result });
    } catch (err) {
      logger.error("Webhook processing failed", err);
      res.status(500).send("Processing error"); // non-2xx makes PayMongo retry
    }
  }
);

/* -------------------------------------------------------------------------- */
/* 3. reconcilePendingPayments (fallback if a webhook is missed)              */
/* -------------------------------------------------------------------------- */
export const reconcilePendingPayments = onSchedule(
  {
    region: REGION,
    schedule: "every 15 minutes",
    timeZone: TIME_ZONE,
    secrets: [PAYMONGO_SECRET_KEY],
  },
  async () => {
    const now = Date.now();
    const snap = await db
      .collection(COL.bookings)
      .where("status", "==", "pending_payment")
      .where("createdAt", "<", now - RECONCILE_MIN_AGE_MS)
      .get();

    for (const doc of snap.docs) {
      const booking = doc.data() as Booking;
      try {
        if (!booking.checkoutSessionId) {
          // Checkout was never created; nothing to pay for.
          if (now - booking.createdAt > RECONCILE_MIN_AGE_MS) {
            await doc.ref.update({ status: "cancelled" });
          }
          continue;
        }
        const state = await getCheckoutSessionState(
          PAYMONGO_SECRET_KEY.value(),
          booking.checkoutSessionId
        );
        if (state.paid) {
          const outcome = await finalizePaidBooking(booking.id, state.paymentId, db);
          logger.info("Reconciled missed payment", { bookingId: booking.id, outcome });
        } else if (state.expired || now - booking.createdAt > CHECKOUT_EXPIRY_MS) {
          await doc.ref.update({ status: "cancelled" });
        }
      } catch (err) {
        logger.error("Reconcile failed for booking", { bookingId: booking.id, err });
      }
    }
  }
);

/* -------------------------------------------------------------------------- */
/* 4. Push notifications (FCM)                                                */
/* -------------------------------------------------------------------------- */
async function tokensFor(uid: string): Promise<string[]> {
  const snap = await db.collection(COL.users).doc(uid).get();
  const tokens = snap.data()?.fcmTokens;
  return Array.isArray(tokens) ? tokens.filter((t) => typeof t === "string") : [];
}

async function notify(uid: string, title: string, body: string, data: Record<string, string>) {
  const tokens = await tokensFor(uid);
  if (tokens.length === 0) return;
  const result = await getMessaging().sendEachForMulticast({
    tokens,
    notification: { title, body },
    data,
  });
  // Remove tokens FCM says are dead so we don't keep sending to them.
  const dead = tokens.filter((_, i) => {
    const code = result.responses[i].error?.code;
    return (
      code === "messaging/registration-token-not-registered" ||
      code === "messaging/invalid-registration-token"
    );
  });
  if (dead.length > 0) {
    const { FieldValue } = await import("firebase-admin/firestore");
    await db
      .collection(COL.users)
      .doc(uid)
      .update({ fcmTokens: FieldValue.arrayRemove(...dead) });
  }
}

/** Tell hiker and guide when a booking becomes confirmed. */
export const onBookingConfirmed = onDocumentUpdated(
  { region: REGION, document: `${COL.bookings}/{bookingId}` },
  async (event) => {
    const before = event.data?.before.data() as Booking | undefined;
    const after = event.data?.after.data() as Booking | undefined;
    if (!before || !after) return;
    if (before.status === "confirmed" || after.status !== "confirmed") return;

    const data = { bookingId: after.id, type: "booking_confirmed" };
    await notify(
      after.hikerId,
      "Booking confirmed",
      `Your hike on ${after.dateKey} is confirmed. A guide has been assigned.`,
      data
    );
    if (after.guideId) {
      await notify(
        after.guideId,
        "New hike assigned",
        `You have a new hike on ${after.dateKey}.`,
        { ...data, type: "guide_assigned" }
      );
    }
  }
);

/** Every evening, remind hikers and guides about tomorrow's hikes. */
export const sendHikeReminders = onSchedule(
  { region: REGION, schedule: "every day 18:00", timeZone: TIME_ZONE },
  async () => {
    const snap = await db
      .collection(COL.bookings)
      .where("dateKey", "==", tomorrowKey())
      .where("status", "==", "confirmed")
      .get();

    for (const doc of snap.docs) {
      const b = doc.data() as Booking;
      const data = { bookingId: b.id, type: "hike_reminder" };
      try {
        await notify(b.hikerId, "Hike tomorrow", "Your hike is tomorrow. Pack water and start early.", data);
        if (b.guideId) {
          await notify(b.guideId, "Hike tomorrow", "You have a guided hike tomorrow.", data);
        }
      } catch (err) {
        logger.error("Reminder failed", { bookingId: b.id, err });
      }
    }
  }
);

/* -------------------------------------------------------------------------- */
/* 5. onActivityCreated: keep public profile stats honest                      */
/* -------------------------------------------------------------------------- */
/**
 * Clients can create their own `activities` but can never write `profiles` stats.
 * This trigger adds the new hike to the owner's totals and recomputes the 7-day distance
 * used by the leaderboard.
 */
export const onActivityCreated = onDocumentCreated(
  { region: REGION, document: `${COL.activities}/{activityId}` },
  async (event) => {
    const activity = event.data?.data() as Activity | undefined;
    if (!activity?.hikerId) return;
    const { distanceKm, elevationGainM } = sanitizeActivityNumbers(activity);

    const { FieldValue } = await import("firebase-admin/firestore");
    const week = await db
      .collection(COL.activities)
      .where("hikerId", "==", activity.hikerId)
      .where("startedAt", ">=", Date.now() - 7 * 24 * 60 * 60 * 1000)
      .get();
    const weeklyKm = sumWeeklyKm(
      week.docs.map((d) => d.data() as Pick<Activity, "startedAt" | "distanceKm">),
      Date.now()
    );

    await db
      .collection(COL.profiles)
      .doc(activity.hikerId)
      .set(
        {
          hikes: FieldValue.increment(1),
          totalKm: FieldValue.increment(distanceKm),
          totalElevationM: FieldValue.increment(elevationGainM),
          weeklyKm,
        },
        { merge: true }
      );
  }
);
