import { describe, expect, it } from "vitest";
import { calcPlanPricing, SPIN_DISCOUNT_PERCENT } from "@/lib/kidfuel-pricing";

describe("calcPlanPricing", () => {
  it("returns plan price as final when no discount", () => {
    const pricing = calcPlanPricing(129, 0);
    expect(pricing.finalPrice).toBe(129);
    expect(pricing.originalPrice).toBe(129);
    expect(pricing.savings).toBe(0);
  });

  it("applies 80% off tier prices correctly for healthy plan", () => {
    const pricing = calcPlanPricing(129, SPIN_DISCOUNT_PERCENT);
    expect(pricing.finalPrice).toBe(129);
    expect(pricing.originalPrice).toBe(645);
    expect(pricing.savings).toBe(516);
  });

  it("applies 80% off tier prices correctly for complete bundle", () => {
    const pricing = calcPlanPricing(159, SPIN_DISCOUNT_PERCENT);
    expect(pricing.finalPrice).toBe(159);
    expect(pricing.originalPrice).toBe(795);
    expect(pricing.savings).toBe(636);
  });

  it("handles protein focus tier", () => {
    const pricing = calcPlanPricing(139, SPIN_DISCOUNT_PERCENT);
    expect(pricing.finalPrice).toBe(139);
    expect(pricing.savings).toBe(pricing.originalPrice - 139);
  });
});
