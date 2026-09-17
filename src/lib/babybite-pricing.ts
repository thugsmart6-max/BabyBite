/** Checkout records list price. Discount math remains available for historical records. */
export const SPIN_DISCOUNT_PERCENT = 0;

/** Honest checkout: ₹159 for 30 days and the fridge PDF. No fake strike-through. */
export const COMPLETE_BUNDLE_CHECKOUT = {
  originalPrice: 159,
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
