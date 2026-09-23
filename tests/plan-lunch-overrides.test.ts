import { describe, expect, it } from "vitest";
import { applyLunchOverrides } from "@/lib/plan-lunch-overrides";
import type { GeneratedMealPlan } from "@/types/babybite";

const basePlan = (): GeneratedMealPlan => ({
  childName: "Meera",
  ageYears: 7,
  today: {
    date: "2026-01-01",
    dayLabel: "Wed",
    meals: [{ slot: "lunch", name: "Home Dal Rice", description: "Dal", tags: [] }],
  },
  weekly: [],
  monthly: [],
  breakdown: { protein: 0, iron: 0, calcium: 0, fiber: 0, energy: 0 },
  recommendedFoods: [],
  kitchenLists: {
    breakfast: [],
    lunch: [{ slot: "lunch", name: "Box Idli", description: "Idli", tags: ["school-tiffin"] }],
    dinner: [],
    snacks: [],
    tenMin: [],
    budget: [],
    schoolLunch: [{ slot: "lunch", name: "Box Idli", description: "Idli", tags: ["school-tiffin"] }],
    kidsFavourite: [],
    riceFree: [],
    homemadeSnacks: [],
  },
  planTier: "complete-bundle",
});

describe("applyLunchOverrides", () => {
  it("replaces lunch on a day when override is set", () => {
    const plan = basePlan();
    const next = applyLunchOverrides(plan, { "2026-01-01": "Box Idli" });
    const lunch = next.today.meals.find((m) => m.slot === "lunch");
    expect(lunch?.name).toBe("Box Idli");
  });
});
