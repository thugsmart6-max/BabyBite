import { describe, expect, it } from "vitest";
import { babybiteOnboardingSchema, paymentSchema } from "@/schemas/babybite";
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

describe("babybiteOnboardingSchema", () => {
  it("accepts valid onboarding payload", () => {
    const parsed = babybiteOnboardingSchema.safeParse(validOnboarding);
    expect(parsed.success).toBe(true);
  });

  it("rejects empty child name", () => {
    const parsed = babybiteOnboardingSchema.safeParse({ ...validOnboarding, name: "" });
    expect(parsed.success).toBe(false);
  });

  it("rejects age below funnel minimum", () => {
    const parsed = babybiteOnboardingSchema.safeParse({ ...validOnboarding, ageYears: 3 });
    expect(parsed.success).toBe(false);
  });

  it("rejects age above 12", () => {
    const parsed = babybiteOnboardingSchema.safeParse({ ...validOnboarding, ageYears: 13 });
    expect(parsed.success).toBe(false);
  });

  it("accepts only boy or girl", () => {
    expect(babybiteOnboardingSchema.safeParse({ ...validOnboarding, gender: "male" }).success).toBe(true);
    expect(babybiteOnboardingSchema.safeParse({ ...validOnboarding, gender: "female" }).success).toBe(true);
    expect(babybiteOnboardingSchema.safeParse({ ...validOnboarding, gender: "other" }).success).toBe(false);
  });

  it("requires at least one challenge", () => {
    const parsed = babybiteOnboardingSchema.safeParse({ ...validOnboarding, challenges: [] });
    expect(parsed.success).toBe(false);
  });

  it("accepts valid onboarding payload with optional allergies", () => {
    const parsed = babybiteOnboardingSchema.safeParse({
      ...validOnboarding,
      allergies: ["dairy"],
      dislikedFoods: ["mushroom"],
    });
    expect(parsed.success).toBe(true);
  });

  it("accepts a second-child create and a named child update", () => {
    expect(
      babybiteOnboardingSchema.safeParse({ ...validOnboarding, createNew: true }).success
    ).toBe(true);
    expect(
      babybiteOnboardingSchema.safeParse({
        ...validOnboarding,
        childProfileId: "507f1f77bcf86cd799439011",
      }).success
    ).toBe(true);
  });

  it("treats blank height and weight as skipped", () => {
    const parsed = babybiteOnboardingSchema.safeParse({
      ...validOnboarding,
      heightCm: "",
      weightKg: "  ",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.heightCm).toBeUndefined();
      expect(parsed.data.weightKg).toBeUndefined();
    }
  });

  it("treats missing kitchen facts as the home defaults", () => {
    const parsed = babybiteOnboardingSchema.safeParse(validOnboarding);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.cookTime).toBe("normal");
      expect(parsed.data.kitchenBudget).toBe("normal");
      expect(parsed.data.riceHabit).toBe("eats-rice");
      expect(parsed.data.tiffinNeed).toBe("home-only");
    }
  });

  it("accepts the four kitchen facts from the mother’s PDF", () => {
    const parsed = babybiteOnboardingSchema.safeParse({
      ...validOnboarding,
      cookTime: "ten-min",
      kitchenBudget: "tight",
      riceHabit: "refuses-rice",
      tiffinNeed: "school-lunch",
    });
    expect(parsed.success).toBe(true);
  });

  it("does not block onboarding when height or weight is out of range", () => {
    const parsed = babybiteOnboardingSchema.safeParse({
      ...validOnboarding,
      heightCm: 0,
      weightKg: "4",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.heightCm).toBeUndefined();
      expect(parsed.data.weightKg).toBeUndefined();
    }
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
