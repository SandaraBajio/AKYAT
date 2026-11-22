import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { COL } from "./config";
import { pickFairGuide } from "./dispatch";
import type { Booking, Guide } from "./types";

export type FinalizeOutcome =
  | { result: "confirmed"; guideId: string }
  | { result: "paid_unassigned" }
  | { result: "already_processed" }
  | { result: "not_found" };

/** Statuses that occupy a guide for a given day. */
const ACTIVE_STATUSES = ["confirmed"];

/** Guides already committed on `dateKey`, read inside the transaction. */
async function busyGuidesOn(tx: FirebaseFirestore.Transaction, db: Firestore, dateKey: string) {
  const snap = await tx.get(
    db
      .collection(COL.bookings)
      .where("dateKey", "==", dateKey)
      .where("status", "in", ACTIVE_STATUSES)
  );
  const busy = new Set<string>();
  snap.forEach((d) => {
    const gid = (d.data() as Booking).guideId;
    if (gid) busy.add(gid);
  });
  return busy;
}

/**
 * Mark a booking paid and assign a guide, atomically.
 * Safe to call repeatedly (webhook retries, reconciliation): once a booking has left
 * "pending_payment" it is never touched again, so the webhook is idempotent.
 */
export async function finalizePaidBooking(
  bookingId: string,
  paymentId: string | null,
  db: Firestore = getFirestore()
): Promise<FinalizeOutcome> {
  const bookingRef = db.collection(COL.bookings).doc(bookingId);

  return db.runTransaction(async (tx) => {
    const bookingSnap = await tx.get(bookingRef);
    if (!bookingSnap.exists) return { result: "not_found" } as const;
    const booking = bookingSnap.data() as Booking;
    if (booking.status !== "pending_payment") return { result: "already_processed" } as const;

    const [guideSnap, busy] = await Promise.all([
      tx.get(
        db
          .collection(COL.guides)
          .where("active", "==", true)
          .where("trailIds", "array-contains", booking.trailId)
      ),
      busyGuidesOn(tx, db, booking.dateKey),
    ]);
    const guides = guideSnap.docs.map((d) => ({ ...(d.data() as Guide), id: d.id }));
    const chosen = pickFairGuide(guides, booking.trailId, busy);
    const now = Date.now();

    if (!chosen) {
      tx.update(bookingRef, { status: "paid_unassigned", paymentId, paidAt: now });
      return { result: "paid_unassigned" } as const;
    }

    tx.update(bookingRef, {
      status: "confirmed",
      guideId: chosen.id,
      paymentId,
      paidAt: now,
    });
    tx.update(db.collection(COL.guides).doc(chosen.id), {
      assignedCount: chosen.assignedCount + 1,
      lastAssignedAt: now,
    });
    return { result: "confirmed", guideId: chosen.id } as const;
  });
}

/** Non-reserving availability check, used before taking payment. */
export async function hasAvailableGuide(
  trailId: string,
  dateKey: string,
  db: Firestore = getFirestore()
): Promise<boolean> {
  const [guideSnap, busySnap] = await Promise.all([
    db
      .collection(COL.guides)
      .where("active", "==", true)
      .where("trailIds", "array-contains", trailId)
      .get(),
    db
      .collection(COL.bookings)
      .where("dateKey", "==", dateKey)
      .where("status", "in", ACTIVE_STATUSES)
      .get(),
  ]);
  const busy = new Set<string>();
  busySnap.forEach((d) => {
    const gid = (d.data() as Booking).guideId;
    if (gid) busy.add(gid);
  });
  const guides = guideSnap.docs.map((d) => ({ ...(d.data() as Guide), id: d.id }));
  return pickFairGuide(guides, trailId, busy) !== null;
}
