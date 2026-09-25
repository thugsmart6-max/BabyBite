/** Full bundle list price shown on the payment page. */
export const PAYMENT_LIST_PRICE_INR = 745;

export const PAYMENT_TIER1_FINAL_INR = 149;
export const PAYMENT_TIER2_FINAL_INR = Math.round(PAYMENT_LIST_PRICE_INR * 0.5);

/** 80% intro price — first 3 days after onboarding. */
export const PAYMENT_INTRO_WINDOW_MS = 3 * 24 * 60 * 60 * 1000;
/** 50% follow-up — next 1.5 days if intro was missed. */
export const PAYMENT_FOLLOWUP_WINDOW_MS = 1.5 * 24 * 60 * 60 * 1000;

export type PaymentOfferTier = "intro-80" | "followup-50" | "list";

export type PaymentOfferSnapshot = {
  tier: PaymentOfferTier;
  listPrice: number;
  finalPrice: number;
  discountPercent: number;
  showStrike: boolean;
  offerBadge: "80" | "50" | null;
  endsAt: string | null;
  msRemaining: number;
};

export function discountPercentFromPrices(listPrice: number, finalPrice: number): number {
  if (listPrice <= 0 || finalPrice >= listPrice) return 0;
  return Math.round((1 - finalPrice / listPrice) * 100);
}

export function resolvePaymentOffer(
  startedAt: Date | string | null | undefined,
  now: Date = new Date()
): PaymentOfferSnapshot {
  const listPrice = PAYMENT_LIST_PRICE_INR;

  if (!startedAt) {
    return tierSnapshot("intro-80", listPrice, PAYMENT_TIER1_FINAL_INR, null, PAYMENT_INTRO_WINDOW_MS);
  }

  const start = startedAt instanceof Date ? startedAt : new Date(startedAt);
  const elapsed = now.getTime() - start.getTime();

  if (elapsed < PAYMENT_INTRO_WINDOW_MS) {
    const msRemaining = PAYMENT_INTRO_WINDOW_MS - elapsed;
    const endsAt = new Date(start.getTime() + PAYMENT_INTRO_WINDOW_MS);
    return tierSnapshot("intro-80", listPrice, PAYMENT_TIER1_FINAL_INR, endsAt, msRemaining);
  }

  const afterIntro = elapsed - PAYMENT_INTRO_WINDOW_MS;
  if (afterIntro < PAYMENT_FOLLOWUP_WINDOW_MS) {
    const msRemaining = PAYMENT_FOLLOWUP_WINDOW_MS - afterIntro;
    const endsAt = new Date(
      start.getTime() + PAYMENT_INTRO_WINDOW_MS + PAYMENT_FOLLOWUP_WINDOW_MS
    );
    return tierSnapshot("followup-50", listPrice, PAYMENT_TIER2_FINAL_INR, endsAt, msRemaining);
  }

  return tierSnapshot("list", listPrice, listPrice, null, 0);
}

function tierSnapshot(
  tier: PaymentOfferTier,
  listPrice: number,
  finalPrice: number,
  endsAt: Date | null,
  msRemaining: number
): PaymentOfferSnapshot {
  const showStrike = finalPrice < listPrice;
  return {
    tier,
    listPrice,
    finalPrice,
    discountPercent: discountPercentFromPrices(listPrice, finalPrice),
    showStrike,
    offerBadge: tier === "intro-80" ? "80" : tier === "followup-50" ? "50" : null,
    endsAt: endsAt?.toISOString() ?? null,
    msRemaining: Math.max(0, msRemaining),
  };
}

function pad2(n: number): string {
  return String(Math.max(0, n)).padStart(2, "0");
}

/** Live countdown: optional days prefix + `HH:MM:SS` (same digits in EN/TA/HI). */
export function formatOfferTimeRemaining(ms: number): string {
  if (ms <= 0) return "00:00:00";

  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86_400);
  const hours = Math.floor((totalSeconds % 86_400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const clock = `${pad2(hours)}:${pad2(minutes)}:${pad2(seconds)}`;
  if (days <= 0) return clock;
  return `${days}d ${clock}`;
}
