import { describe, expect, it } from "vitest";
import { COMPLETE_BUNDLE_CHECKOUT, SPIN_DISCOUNT_PERCENT } from "@/lib/kidfuel-pricing";
import { paymentSchema } from "@/schemas/kidfuel";
import { PLAN_TIERS } from "@/types/kidfuel";

describe("payment flow (mocked)", () => {
  it("checkout shows ₹745 struck through and charges ₹159 at 80% off", () => {
    expect(COMPLETE_BUNDLE_CHECKOUT.originalPrice).toBe(745);
    expect(COMPLETE_BUNDLE_CHECKOUT.salePrice).toBe(159);
    expect(COMPLETE_BUNDLE_CHECKOUT.discountPercent).toBe(80);
    expect(PLAN_TIERS["complete-bundle"].price).toBe(159);
    expect(SPIN_DISCOUNT_PERCENT).toBe(80);
  });

  it("simulated payment POST body passes schema validation", () => {
    const childProfileId = "507f1f77bcf86cd799439011";
    const body = { childProfileId, planTier: "complete-bundle" };
    const parsed = paymentSchema.safeParse(body);
    expect(parsed.success).toBe(true);
  });
});
