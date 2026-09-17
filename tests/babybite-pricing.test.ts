import { describe, expect, it } from "vitest";
import { calcPlanPricing, SPIN_DISCOUNT_PERCENT } from "@/lib/babybite-pricing";

describe("calcPlanPricing", () => {
  it("returns plan price as final when no discount", () => {
    const pricing = calcPlanPricing(129, 0);
    expect(pricing.finalPrice).toBe(129);
    expect(pricing.originalPrice).toBe(129);
    expect(pricing.savings).toBe(0);
  });

  it("keeps historical 80% math available when a percent is passed in", () => {
    const pricing = calcPlanPricing(129, 80);
    expect(pricing.finalPrice).toBe(129);
    expect(pricing.originalPrice).toBe(645);
    expect(pricing.savings).toBe(516);
  });

  it("charges the complete bundle at list price", () => {
    const pricing = calcPlanPricing(159, SPIN_DISCOUNT_PERCENT);
    expect(pricing.finalPrice).toBe(159);
    expect(pricing.originalPrice).toBe(159);
    expect(pricing.savings).toBe(0);
  });

  it("handles protein focus tier at list price", () => {
    const pricing = calcPlanPricing(139, SPIN_DISCOUNT_PERCENT);
    expect(pricing.finalPrice).toBe(139);
    expect(pricing.savings).toBe(0);
  });
});
