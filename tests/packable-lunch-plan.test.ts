import { describe, expect, it } from "vitest";
import { planForTodayWeekDisplay } from "@/lib/packable-lunch-plan";
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

const base = (): GeneratedMealPlan => ({
  childName: "Test",
  ageYears: 7,
  goal: "healthy-nutrition",
  foodStyle: "north-indian",
  today: {
    date: "2026-01-01",
    dayLabel: "Wed",
    meals: [
      { slot: "breakfast", name: "Idli", description: "a", caloriesApprox: 200, tags: [] },
      { slot: "lunch", name: "Home Dal Rice", description: "b", caloriesApprox: 350, tags: [] },
    ],
  },
  weekly: [
    {
      date: "2026-01-01",
      dayLabel: "Wed",
      meals: [{ slot: "lunch", name: "Home Dal Rice", description: "b", caloriesApprox: 350, tags: [] }],
    },
  ],
  monthly: [],
  breakdown: emptyBreakdown,
  recommendedFoods: [],
  kitchenLists: {
    breakfast: [],
    lunch: [{ slot: "lunch", name: "Box Idli", description: "c", caloriesApprox: 320, tags: ["school-tiffin"] }],
    dinner: [],
    snacks: [],
    tenMin: [],
    budget: [],
    schoolLunch: [{ slot: "lunch", name: "Box Idli", description: "c", caloriesApprox: 320, tags: ["school-tiffin"] }],
    kidsFavourite: [],
    riceFree: [],
    homemadeSnacks: [],
  },
});

describe("planForTodayWeekDisplay", () => {
  it("uses packable lunch pool for today lunch", () => {
    const plan = planForTodayWeekDisplay(base(), {});
    const lunch = plan.today.meals.find((m) => m.slot === "lunch");
    expect(lunch?.name).toBe("Box Idli");
  });
});
