import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { verifyWebhookSignature } from "./paymongo";
import { isValidDateKey, toDateKey } from "./dates";

const SECRET = "whsk_test_secret";
const body = JSON.stringify({ data: { attributes: { type: "checkout_session.payment.paid" } } });
const NOW = 1_800_000_000_000;
const ts = Math.floor(NOW / 1000);

const sign = (t: number, payload: string, secret = SECRET) =>
  createHmac("sha256", secret).update(`${t}.${payload}`).digest("hex");

describe("verifyWebhookSignature", () => {
  it("accepts a valid test-mode signature", () => {
    const header = `t=${ts},te=${sign(ts, body)},li=`;
    expect(verifyWebhookSignature(body, header, SECRET, { nowMs: NOW })).toBe(true);
  });

  it("accepts a valid live-mode signature", () => {
    const header = `t=${ts},te=,li=${sign(ts, body)}`;
    expect(verifyWebhookSignature(body, header, SECRET, { nowMs: NOW })).toBe(true);
  });

  it("rejects a tampered body", () => {
    const header = `t=${ts},te=${sign(ts, body)},li=`;
    expect(verifyWebhookSignature(body + " ", header, SECRET, { nowMs: NOW })).toBe(false);
  });

  it("rejects the wrong secret", () => {
    const header = `t=${ts},te=${sign(ts, body, "other")},li=`;
    expect(verifyWebhookSignature(body, header, SECRET, { nowMs: NOW })).toBe(false);
  });

  it("rejects stale timestamps (replay protection)", () => {
    const old = ts - 3600;
    const header = `t=${old},te=${sign(old, body)},li=`;
    expect(verifyWebhookSignature(body, header, SECRET, { nowMs: NOW })).toBe(false);
  });

  it("rejects missing or malformed headers", () => {
    expect(verifyWebhookSignature(body, undefined, SECRET, { nowMs: NOW })).toBe(false);
    expect(verifyWebhookSignature(body, "garbage", SECRET, { nowMs: NOW })).toBe(false);
  });
});

describe("dates", () => {
  it("validates real calendar dates only", () => {
    expect(isValidDateKey("2026-11-16")).toBe(true);
    expect(isValidDateKey("2026-02-31")).toBe(false);
    expect(isValidDateKey("16-11-2026")).toBe(false);
    expect(isValidDateKey(20261116)).toBe(false);
  });

  it("uses Manila time for the date key", () => {
    // 2026-11-16 17:00 UTC is already 2026-11-17 01:00 in Manila (UTC+8)
    expect(toDateKey(Date.UTC(2026, 10, 16, 17, 0, 0))).toBe("2026-11-17");
  });
});
