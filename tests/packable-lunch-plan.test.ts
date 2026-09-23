import { describe, expect, it } from "vitest";
import { planForTodayWeekDisplay } from "@/lib/packable-lunch-plan";
import type { GeneratedMealPlan } from "@/types/babybite";

const base = (): GeneratedMealPlan => ({
  childName: "Test",
  ageYears: 7,
  today: {
    date: "2026-01-01",
    dayLabel: "Wed",
    meals: [
      { slot: "breakfast", name: "Idli", description: "a", tags: [] },
      { slot: "lunch", name: "Home Dal Rice", description: "b", tags: [] },
    ],
  },
  weekly: [
    {
      date: "2026-01-01",
      dayLabel: "Wed",
      meals: [{ slot: "lunch", name: "Home Dal Rice", description: "b", tags: [] }],
    },
  ],
  monthly: [],
  breakdown: { protein: 0, iron: 0, calcium: 0, fiber: 0, energy: 0 },
  recommendedFoods: [],
  kitchenLists: {
    breakfast: [],
    lunch: [{ slot: "lunch", name: "Box Idli", description: "c", tags: ["school-tiffin"] }],
    dinner: [],
    snacks: [],
    tenMin: [],
    budget: [],
    schoolLunch: [{ slot: "lunch", name: "Box Idli", description: "c", tags: ["school-tiffin"] }],
    kidsFavourite: [],
    riceFree: [],
    homemadeSnacks: [],
  },
  planTier: "complete-bundle",
});

describe("planForTodayWeekDisplay", () => {
  it("uses packable lunch pool for today lunch", () => {
    const plan = planForTodayWeekDisplay(base(), {});
    const lunch = plan.today.meals.find((m) => m.slot === "lunch");
    expect(lunch?.name).toBe("Box Idli");
  });
});
