# Akyat Backend / Logic (Firebase Cloud Functions)

Server-side rules for booking, payment, guide dispatch, and notifications.
TypeScript, Node 20, region `asia-southeast1`.

## What's in here

| Function | Type | Purpose |
|---|---|---|
| `createBookingCheckout` | Callable | Validates a booking request, creates a `pending_payment` booking, returns a PayMongo checkout URL |
| `paymongoWebhook` | HTTPS | Verifies PayMongo's signature, then marks the booking paid and assigns a guide (idempotent) |
| `reconcilePendingPayments` | Scheduled, every 15 min | Asks PayMongo about unconfirmed bookings so a missed webhook never leaves a booking stuck |
| `onBookingConfirmed` | Firestore trigger | Sends FCM push to the hiker and the assigned guide |
| `sendHikeReminders` | Scheduled, daily 18:00 Manila | Reminds hiker and guide about tomorrow's hikes |

## Booking flow

```
App --createBookingCheckout--> booking: pending_payment --> PayMongo checkout URL
Hiker pays (GCash / Maya / card)
PayMongo --webhook--> verify signature --> finalizePaidBooking (transaction)
      guide found  -> status "confirmed", guide.assignedCount + 1
      no guide     -> status "paid_unassigned" (admin must reassign or refund)
(if webhook is lost) reconcilePendingPayments polls PayMongo and finishes the same step
```

## Fair-queue dispatch (`src/dispatch.ts`)

Among guides that are active, accredited for the trail, and free that day, choose the one with
the **fewest assignments**; ties go to whoever has **waited longest**. It is a pure function, so it is unit tested.

## Contracts for your teammates

**UI team** calls the callable and opens `checkoutUrl` (in-app browser or `Linking.openURL`):

```ts
import { getFunctions, httpsCallable } from "firebase/functions";
const fn = httpsCallable<CreateBookingCheckoutRequest, CreateBookingCheckoutResponse>(
  getFunctions(app, "asia-southeast1"), "createBookingCheckout");
const { data } = await fn({ trailId, dateKey: "2026-12-05", partySize: 3 });
// data.checkoutUrl -> open it; then listen to bookings/{data.bookingId} for status changes
```

Error codes the UI should handle: `unauthenticated`, `invalid-argument`, `not-found`,
`failed-precondition` (trail closed), `resource-exhausted` (no guide that day), `internal`.

**Data & Integrations team** must provide:
- Collections `trails`, `guides`, `bookings`, `users` with the fields in `src/types.ts`
  (money in centavos; `dateKey` is `YYYY-MM-DD` in Manila time).
- `users/{uid}.fcmTokens: string[]` (save the device token from Expo Notifications / FCM on login).
  Guides use the same `users/{uid}` document, so a guide's `guides/{id}` should equal their user uid.
- Security rules: clients must **not** write `bookings.status`, `guideId`, `paymentId`, or guide counters.
  Only Cloud Functions (admin SDK) write those.

## Setup

```bash
cd functions
npm install
cp .env.example .env
firebase functions:secrets:set PAYMONGO_SECRET_KEY      # sk_test_... from PayMongo dashboard
firebase functions:secrets:set PAYMONGO_WEBHOOK_SECRET  # whsk_... from the webhook you register
npm test            # unit tests
npm run serve       # local emulators
npm run deploy      # deploy functions (Blaze plan required)
```

Register the webhook in the PayMongo dashboard, event `checkout_session.payment.paid`,
pointing at the deployed `paymongoWebhook` URL.

## Notes and limits

- Cloud Functions with secrets and outbound network calls (PayMongo, FCM) need the Firebase **Blaze** plan.
  Usage for a school project stays in the free allowance.
- The availability check before payment is not a reservation. If two hikers pay at the same moment for
  the last guide, the second booking becomes `paid_unassigned` instead of double-booking a guide.
  Show these to an admin for reassignment or refund.
- Refunds are not automated yet.
- Test with PayMongo **test keys** and the emulator before going live.
