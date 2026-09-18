import { describe, expect, it } from "vitest";
import { checklistSummary, explainMealMatch, isDairyHeavy } from "@/lib/meal-rationale";
import { BABYBITE_MEALS } from "@/lib/data/babybite-meals";
import type { BabyBiteChildProfile } from "@/types/babybite";

const profile: BabyBiteChildProfile = {
  id: "507f1f77bcf86cd799439011",
  name: "Rohan",
  ageYears: 7,
  gender: "male",
  dietPreference: "vegetarian",
  foodStyle: "north-indian",
  challenges: ["picky-eater", "no-vegetables", "no-milk"],
  goal: "protein-focus",
  allergies: [],
  dislikedFoods: ["bitter gourd"],
  cookTime: "ten-min",
  kitchenBudget: "tight",
  riceHabit: "eats-rice",
  tiffinNeed: "school-lunch",
};

describe("checklistSummary", () => {
  it("lists the onboarding answers a mother actually ticked", () => {
    const line = checklistSummary(profile);
    expect(line).toMatch(/Vegetarian/);
    expect(line).toMatch(/Picky Eater/);
    expect(line).toMatch(/Doesn't Like Vegetables/);
    expect(line).toMatch(/School tiffin/);
    expect(line).toMatch(/Avoid bitter gourd/);
    expect(line).toMatch(/10-minute kitchen/);
  });
});

describe("explainMealMatch", () => {
  it("explains hidden vegetables and picky plates in mother language", () => {
    const hidden = BABYBITE_MEALS.find((meal) => meal.tags.includes("hidden-veg") && meal.tags.includes("kids-favourite"));
    expect(hidden).toBeTruthy();
    const why = explainMealMatch(hidden!, profile, "lunch");
    expect(why).toMatch(/picky/i);
    expect(why).toMatch(/Vegetable/i);
  });
});

describe("isDairyHeavy", () => {
  it("flags paneer and curd plates", () => {
    const paneer = BABYBITE_MEALS.find((meal) => /paneer/i.test(meal.name));
    expect(paneer).toBeTruthy();
    expect(isDairyHeavy(paneer!)).toBe(true);
  });
});
