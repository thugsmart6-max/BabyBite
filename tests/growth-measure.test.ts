import { describe, expect, it } from "vitest";
import { nextGrowthFields } from "@/lib/growth-measure";

describe("nextGrowthFields", () => {
  it("sets the first note as the baseline", () => {
    const next = nextGrowthFields(null, { heightCm: 118, weightKg: 22 });
    expect(next.heightCm).toBe(118);
    expect(next.weightKg).toBe(22);
    expect(next.baselineHeightCm).toBe(118);
    expect(next.baselineWeightKg).toBe(22);
    expect(next.baselineNotedAt).toBeInstanceOf(Date);
    expect(next.remeasuredAt).toBeUndefined();
  });

  it("keeps the first note when a later measure is different", () => {
    const first = nextGrowthFields(null, { heightCm: 118, weightKg: 22 });
    const later = nextGrowthFields(
      {
        heightCm: 118,
        weightKg: 22,
        baselineHeightCm: first.baselineHeightCm,
        baselineWeightKg: first.baselineWeightKg,
        baselineNotedAt: first.baselineNotedAt,
      },
      { heightCm: 120, weightKg: 23 }
    );

    expect(later.baselineHeightCm).toBe(118);
    expect(later.baselineWeightKg).toBe(22);
    expect(later.heightCm).toBe(120);
    expect(later.weightKg).toBe(23);
    expect(later.remeasuredAt).toBeInstanceOf(Date);
  });

  it("does not let a later save overwrite the baseline", () => {
    const later = nextGrowthFields(
      {
        heightCm: 118,
        weightKg: 22,
        baselineHeightCm: 118,
        baselineWeightKg: 22,
        baselineNotedAt: new Date("2026-01-01"),
      },
      { heightCm: 121, weightKg: 22 }
    );

    expect(later.baselineHeightCm).toBe(118);
    expect(later.baselineWeightKg).toBe(22);
  });
});
