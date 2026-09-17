import { describe, expect, it } from "vitest";
import { COMPLETE_BUNDLE_CHECKOUT, SPIN_DISCOUNT_PERCENT } from "@/lib/babybite-pricing";
import { paymentSchema } from "@/schemas/babybite";
import { PLAN_TIERS } from "@/types/babybite";

describe("payment flow (mocked)", () => {
  it("checkout charges an honest ₹159 with no fake strike-through", () => {
    expect(COMPLETE_BUNDLE_CHECKOUT.originalPrice).toBe(159);
    expect(COMPLETE_BUNDLE_CHECKOUT.salePrice).toBe(159);
    expect(COMPLETE_BUNDLE_CHECKOUT.discountPercent).toBe(0);
    expect(PLAN_TIERS["complete-bundle"].price).toBe(159);
    expect(SPIN_DISCOUNT_PERCENT).toBe(0);
  });

  it("simulated payment POST body passes schema validation", () => {
    const childProfileId = "507f1f77bcf86cd799439011";
    const body = { childProfileId, planTier: "complete-bundle" };
    const parsed = paymentSchema.safeParse(body);
    expect(parsed.success).toBe(true);
  });
});
