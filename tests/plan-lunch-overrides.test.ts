import { describe, expect, it } from "vitest";
import { applyLunchOverrides } from "@/lib/plan-lunch-overrides";
import type { GeneratedMealPlan } from "@/types/babybite";

const emptyBreakdown = {
  protein: "",
  carbohydrates: "",
  healthyFats: "",
  fiber: "",
  ironSources: "",
  calciumSources: "",
  vitaminSources: "",
};

const basePlan = (): GeneratedMealPlan => ({
  childName: "Meera",
  ageYears: 7,
  goal: "healthy-nutrition",
  foodStyle: "north-indian",
  today: {
    date: "2026-01-01",
    dayLabel: "Wed",
    meals: [{ slot: "lunch", name: "Home Dal Rice", description: "Dal", caloriesApprox: 350, tags: [] }],
  },
  weekly: [],
  monthly: [],
  breakdown: emptyBreakdown,
  recommendedFoods: [],
  kitchenLists: {
    breakfast: [],
    lunch: [{ slot: "lunch", name: "Box Idli", description: "Idli", caloriesApprox: 320, tags: ["school-tiffin"] }],
    dinner: [],
    snacks: [],
    tenMin: [],
    budget: [],
    schoolLunch: [{ slot: "lunch", name: "Box Idli", description: "Idli", caloriesApprox: 320, tags: ["school-tiffin"] }],
    kidsFavourite: [],
    riceFree: [],
    homemadeSnacks: [],
  },
});

describe("applyLunchOverrides", () => {
  it("replaces lunch on a day when override is set", () => {
    const plan = basePlan();
    const next = applyLunchOverrides(plan, { "2026-01-01": "Box Idli" });
    const lunch = next.today.meals.find((m) => m.slot === "lunch");
    expect(lunch?.name).toBe("Box Idli");
  });
});
