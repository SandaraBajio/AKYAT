import { defineSecret, defineString } from "firebase-functions/params";

export const REGION = "asia-southeast1"; // Singapore, closest to Batangas
export const TIME_ZONE = "Asia/Manila";

/** Secrets: set with `firebase functions:secrets:set <NAME>` (never commit these). */
export const PAYMONGO_SECRET_KEY = defineSecret("PAYMONGO_SECRET_KEY");
export const PAYMONGO_WEBHOOK_SECRET = defineSecret("PAYMONGO_WEBHOOK_SECRET");

/** Plain params: set in functions/.env (see .env.example). */
export const APP_SUCCESS_URL = defineString("APP_SUCCESS_URL", {
  default: "akyat://booking/success",
});
export const APP_CANCEL_URL = defineString("APP_CANCEL_URL", {
  default: "akyat://booking/cancelled",
});

/** Collection names, shared with the Data & Integrations schema. */
export const COL = {
  users: "users",
  trails: "trails",
  guides: "guides",
  bookings: "bookings",
  activities: "activities",
  profiles: "profiles",
} as const;

/** A pending checkout older than this with no payment is cancelled. */
export const CHECKOUT_EXPIRY_MS = 24 * 60 * 60 * 1000;
/** Reconciliation ignores bookings younger than this, so normal webhooks win the race. */
export const RECONCILE_MIN_AGE_MS = 5 * 60 * 1000;
