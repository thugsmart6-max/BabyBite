import { describe, expect, it } from "vitest";
import { kidfuelOnboardingSchema, paymentSchema } from "@/schemas/kidfuel";
import { TERMS_SECTIONS } from "@/lib/constants";

const validOnboarding = {
  name: "Aanya",
  ageYears: 7,
  gender: "female" as const,
  dietPreference: "vegetarian" as const,
  foodStyle: "mixed-indian" as const,
  challenges: ["picky-eater" as const],
  goal: "healthy-nutrition" as const,
};

describe("kidfuelOnboardingSchema", () => {
  it("accepts valid onboarding payload", () => {
    const parsed = kidfuelOnboardingSchema.safeParse(validOnboarding);
    expect(parsed.success).toBe(true);
  });

  it("rejects empty child name", () => {
    const parsed = kidfuelOnboardingSchema.safeParse({ ...validOnboarding, name: "" });
    expect(parsed.success).toBe(false);
  });

  it("rejects age below funnel minimum", () => {
    const parsed = kidfuelOnboardingSchema.safeParse({ ...validOnboarding, ageYears: 3 });
    expect(parsed.success).toBe(false);
  });

  it("requires at least one challenge", () => {
    const parsed = kidfuelOnboardingSchema.safeParse({ ...validOnboarding, challenges: [] });
    expect(parsed.success).toBe(false);
  });

  it("accepts valid onboarding payload with optional allergies", () => {
    const parsed = kidfuelOnboardingSchema.safeParse({
      ...validOnboarding,
      allergies: ["dairy"],
      dislikedFoods: ["mushroom"],
    });
    expect(parsed.success).toBe(true);
  });
});

describe("paymentSchema", () => {
  it("accepts a valid checkout payload", () => {
    const parsed = paymentSchema.safeParse({
      childProfileId: "507f1f77bcf86cd799439011",
      planTier: "complete-bundle",
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects invalid plan tier", () => {
    const parsed = paymentSchema.safeParse({
      childProfileId: "507f1f77bcf86cd799439011",
      planTier: "premium",
    });
    expect(parsed.success).toBe(false);
  });

  it("ignores client-supplied discounts and does not require spin", () => {
    const parsed = paymentSchema.safeParse({
      childProfileId: "507f1f77bcf86cd799439011",
      planTier: "healthy-nutrition",
      spinResult: 80,
      spinCompleted: true,
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects a non-ObjectId child profile id", () => {
    const parsed = paymentSchema.safeParse({
      childProfileId: "abc",
      planTier: "complete-bundle",
    });
    expect(parsed.success).toBe(false);
  });
});

describe("TERMS_SECTIONS", () => {
  it("describes this step opening the personalized PDF for ages 4–12", () => {
    const section = TERMS_SECTIONS.find((item) => item.title.startsWith("7."));
    expect(section?.body).toMatch(/This step opens the personalized PDF/);
    expect(section?.body).toMatch(/4–12/);
    expect(section?.body).toMatch(/educational/i);
  });
});
