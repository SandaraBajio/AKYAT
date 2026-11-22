import { createHmac, timingSafeEqual } from "node:crypto";

const API = "https://api.paymongo.com/v1";

function authHeader(secretKey: string): string {
  return "Basic " + Buffer.from(`${secretKey}:`).toString("base64");
}

export interface CheckoutInput {
  secretKey: string;
  bookingId: string;
  amount: number; // centavos
  name: string;
  description: string;
  successUrl: string;
  cancelUrl: string;
  quantity?: number;
}

export interface CheckoutResult {
  sessionId: string;
  checkoutUrl: string;
}

/** Create a hosted PayMongo Checkout Session (GCash, Maya, cards). */
export async function createCheckoutSession(input: CheckoutInput): Promise<CheckoutResult> {
  const res = await fetch(`${API}/checkout_sessions`, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      authorization: authHeader(input.secretKey),
    },
    body: JSON.stringify({
      data: {
        attributes: {
          send_email_receipt: false,
          show_description: true,
          show_line_items: true,
          description: input.description,
          reference_number: input.bookingId,
          line_items: [
            {
              currency: "PHP",
              amount: input.amount, // unit price in centavos
              name: input.name,
              quantity: input.quantity ?? 1,
            },
          ],
          payment_method_types: ["gcash", "paymaya", "card"],
          success_url: input.successUrl,
          cancel_url: input.cancelUrl,
          metadata: { bookingId: input.bookingId },
        },
      },
    }),
  });

  if (!res.ok) {
    throw new Error(`PayMongo checkout failed (${res.status}): ${await res.text()}`);
  }
  const json: any = await res.json();
  return {
    sessionId: json.data.id,
    checkoutUrl: json.data.attributes.checkout_url,
  };
}

export interface SessionPaymentState {
  paid: boolean;
  paymentId: string | null;
  expired: boolean;
}

/** Ask PayMongo directly whether a checkout session was paid (used by reconciliation). */
export async function getCheckoutSessionState(
  secretKey: string,
  sessionId: string
): Promise<SessionPaymentState> {
  const res = await fetch(`${API}/checkout_sessions/${encodeURIComponent(sessionId)}`, {
    headers: { accept: "application/json", authorization: authHeader(secretKey) },
  });
  if (!res.ok) {
    throw new Error(`PayMongo lookup failed (${res.status}): ${await res.text()}`);
  }
  const json: any = await res.json();
  const attrs = json.data?.attributes ?? {};
  const payments: any[] = attrs.payments ?? [];
  const paidPayment = payments.find((p) => p?.attributes?.status === "paid");
  return {
    paid: Boolean(paidPayment),
    paymentId: paidPayment?.id ?? null,
    expired: attrs.status === "expired",
  };
}

/**
 * Verify a PayMongo webhook signature.
 * Header format: "t=<timestamp>,te=<test signature>,li=<live signature>".
 * Signed payload is `${timestamp}.${rawBody}` using HMAC-SHA256 with the webhook secret.
 * A test-mode secret key produces `te`; a live one produces `li`.
 */
export function verifyWebhookSignature(
  rawBody: string,
  header: string | undefined,
  webhookSecret: string,
  opts: { toleranceSeconds?: number; nowMs?: number } = {}
): boolean {
  if (!header) return false;
  const parts = Object.fromEntries(
    header.split(",").map((kv) => {
      const i = kv.indexOf("=");
      return [kv.slice(0, i).trim(), kv.slice(i + 1).trim()];
    })
  );
  const timestamp = parts["t"];
  const candidates = [parts["te"], parts["li"]].filter(Boolean) as string[];
  if (!timestamp || candidates.length === 0) return false;

  const tolerance = opts.toleranceSeconds ?? 5 * 60;
  const nowSec = Math.floor((opts.nowMs ?? Date.now()) / 1000);
  const ts = Number(timestamp);
  if (!Number.isFinite(ts) || Math.abs(nowSec - ts) > tolerance) return false; // replay protection

  const expected = createHmac("sha256", webhookSecret)
    .update(`${timestamp}.${rawBody}`)
    .digest("hex");
  const expectedBuf = Buffer.from(expected);

  return candidates.some((sig) => {
    const sigBuf = Buffer.from(sig);
    return sigBuf.length === expectedBuf.length && timingSafeEqual(sigBuf, expectedBuf);
  });
}
