import { describe, expect, it } from "vitest";
import {
  formatOfferTimeRemaining,
  PAYMENT_FOLLOWUP_WINDOW_MS,
  PAYMENT_INTRO_WINDOW_MS,
  PAYMENT_LIST_PRICE_INR,
  PAYMENT_TIER1_FINAL_INR,
  PAYMENT_TIER2_FINAL_INR,
  resolvePaymentOffer,
} from "@/lib/payment-offer";

describe("resolvePaymentOffer", () => {
  const start = new Date("2026-01-01T12:00:00.000Z");

  it("shows 80% / ₹149 for the first 3 days", () => {
    const offer = resolvePaymentOffer(start, new Date(start.getTime() + 60_000));
    expect(offer.tier).toBe("intro-80");
    expect(offer.listPrice).toBe(PAYMENT_LIST_PRICE_INR);
    expect(offer.finalPrice).toBe(PAYMENT_TIER1_FINAL_INR);
    expect(offer.discountPercent).toBe(80);
    expect(offer.showStrike).toBe(true);
  });

  it("shows 50% after 3 days for 1.5 days", () => {
    const offer = resolvePaymentOffer(
      start,
      new Date(start.getTime() + PAYMENT_INTRO_WINDOW_MS + 60_000)
    );
    expect(offer.tier).toBe("followup-50");
    expect(offer.finalPrice).toBe(PAYMENT_TIER2_FINAL_INR);
    expect(offer.discountPercent).toBe(50);
  });

  it("formats countdown as days plus HH:MM:SS", () => {
    expect(formatOfferTimeRemaining(180_061_000)).toBe("2d 02:01:01");
    expect(formatOfferTimeRemaining(90_061_000)).toBe("1d 01:01:01");
    expect(formatOfferTimeRemaining(3_661_000)).toBe("01:01:01");
    expect(formatOfferTimeRemaining(0)).toBe("00:00:00");
  });

  it("shows full ₹745 after intro and follow-up windows", () => {
    const offer = resolvePaymentOffer(
      start,
      new Date(start.getTime() + PAYMENT_INTRO_WINDOW_MS + PAYMENT_FOLLOWUP_WINDOW_MS + 1)
    );
    expect(offer.tier).toBe("list");
    expect(offer.finalPrice).toBe(PAYMENT_LIST_PRICE_INR);
    expect(offer.showStrike).toBe(false);
    expect(offer.offerBadge).toBe(null);
  });
});
