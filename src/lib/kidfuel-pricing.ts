/** Checkout records list price. Discount math remains available for historical records. */
export const SPIN_DISCOUNT_PERCENT = 80;

/** What the mother sees after onboarding: ₹745 struck, 80% off, ₹159. */
export const COMPLETE_BUNDLE_CHECKOUT = {
  originalPrice: 745,
  salePrice: 159,
  discountPercent: SPIN_DISCOUNT_PERCENT,
} as const;

export type PlanPricing = {
  originalPrice: number;
  planPrice: number;
  discountPercent: number;
  savings: number;
  finalPrice: number;
};

/**
 * Plan tier prices (₹129 / ₹139 / ₹159) are the checkout amounts.
 * Pass 0 for discountPercent to charge list price.
 */
export function calcPlanPricing(
  planPrice: number,
  discountPercent = 0
): PlanPricing {
  if (discountPercent <= 0 || discountPercent >= 100) {
    return {
      originalPrice: planPrice,
      planPrice,
      discountPercent: 0,
      savings: 0,
      finalPrice: planPrice,
    };
  }

  const finalPrice = planPrice;
  const originalPrice = Math.round(planPrice / (1 - discountPercent / 100));
  const savings = originalPrice - finalPrice;

  return {
    originalPrice,
    planPrice,
    discountPercent,
    savings,
    finalPrice,
  };
}

export function formatRupee(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}
