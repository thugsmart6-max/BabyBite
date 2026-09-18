import { describe, expect, it } from "vitest";
import { generateBabyBiteMealPlan } from "@/services/babybite-meal-engine";
import { overlaySchoolPlan } from "@/lib/school-lunch-view";
import { ageBandForYears } from "@/types/babybite";
import type { BabyBiteChildProfile } from "@/types/babybite";

const baseProfile: BabyBiteChildProfile = {
  id: "507f1f77bcf86cd799439011",
  name: "Rohan",
  ageYears: 7,
  gender: "male",
  dietPreference: "non-vegetarian",
  foodStyle: "mixed-indian",
  challenges: ["picky-eater"],
  goal: "food-variety",
  allergies: [],
  dislikedFoods: [],
};

describe("ageBandForYears", () => {
  it("maps 4–5 / 6–8 / 9–12", () => {
    expect(ageBandForYears(4)).toBe("4-5");
    expect(ageBandForYears(5)).toBe("4-5");
    expect(ageBandForYears(6)).toBe("6-8");
    expect(ageBandForYears(8)).toBe("6-8");
    expect(ageBandForYears(9)).toBe("9-12");
    expect(ageBandForYears(12)).toBe("9-12");
  });
});

describe("overlaySchoolPlan", () => {
  it("changes visible lunch when the School filter is toggled on a home kitchen", () => {
    const plan = generateBabyBiteMealPlan({ ...baseProfile, tiffinNeed: "home-only" });
    const on = overlaySchoolPlan(plan, true);
    const off = overlaySchoolPlan(plan, false);
    const lunch = (day: (typeof plan.weekly)[number]) => day.meals.find((meal) => meal.slot === "lunch")?.name;
    expect(plan.kitchenLists?.schoolLunch.length).toBeGreaterThan(0);
    expect(lunch(on.today)).not.toBe(lunch(off.today));
    expect(on.today.meals.find((meal) => meal.slot === "lunch")?.tags?.includes("school-tiffin")).toBe(true);
  });

  it("swaps weekday tiffin back to home lunch when the School filter is off", () => {
    const plan = generateBabyBiteMealPlan({ ...baseProfile, tiffinNeed: "school-lunch" });
    const on = overlaySchoolPlan(plan, true);
    const off = overlaySchoolPlan(plan, false);
    const lunch = (day: (typeof plan.weekly)[number]) => day.meals.find((meal) => meal.slot === "lunch");
    const weekday = on.weekly.find((day) => day.dayLabel !== "Saturday" && day.dayLabel !== "Sunday")!;
    const weekdayOff = off.weekly.find((day) => day.date === weekday.date)!;
    expect(lunch(weekday)?.tags?.includes("school-tiffin")).toBe(true);
    expect(lunch(weekdayOff)?.tags?.includes("school-tiffin")).toBe(false);
    expect(lunch(weekdayOff)?.name).not.toBe(lunch(weekday)?.name);
  });

  it("does not crash when a stored plan is missing week or month rows", () => {
    const plan = generateBabyBiteMealPlan({ ...baseProfile, tiffinNeed: "home-only" });
    const thin = { ...plan, weekly: undefined, monthly: undefined } as unknown as typeof plan;
    expect(() => overlaySchoolPlan(thin, true)).not.toThrow();
    expect(overlaySchoolPlan(thin, true).today.meals.length).toBeGreaterThan(0);
  });

  it("does not paint the same school lunch across the 30-day board", () => {
    const plan = generateBabyBiteMealPlan({ ...baseProfile, tiffinNeed: "home-only" });
    const on = overlaySchoolPlan(plan, true);
    const lunches = on.monthly.map((day) => day.meals.find((meal) => meal.slot === "lunch")?.name);
    expect(new Set(lunches).size).toBeGreaterThan(1);
    for (let i = 2; i < lunches.length; i += 1) {
      expect(lunches[i] === lunches[i - 1] && lunches[i] === lunches[i - 2]).toBe(false);
    }
  });

  it("does not alternate two tiffin names across 30 school days", () => {
    const plan = generateBabyBiteMealPlan({
      ...baseProfile,
      foodStyle: "south-indian",
      dietPreference: "vegetarian",
      tiffinNeed: "school-lunch",
      riceHabit: "refuses-rice",
    });
    const on = overlaySchoolPlan(plan, true);
    const lunches = on.monthly.map((day) => day.meals.find((meal) => meal.slot === "lunch")?.name);
    expect(new Set(lunches).size).toBeGreaterThanOrEqual(8);
    expect(new Set(lunches.slice(7)).size).toBeGreaterThanOrEqual(8);
    for (let i = 2; i < lunches.length; i += 1) {
      expect(lunches[i] === lunches[i - 1] && lunches[i] === lunches[i - 2]).toBe(false);
    }
  });

  it("does not loop three tiffin names after the first week", () => {
    const plan = generateBabyBiteMealPlan({
      ...baseProfile,
      tiffinNeed: "school-lunch",
      dietPreference: "non-vegetarian",
      foodStyle: "mixed-indian",
    });
    const on = overlaySchoolPlan(plan, true);
    const lunches = on.monthly.map((day) => day.meals.find((meal) => meal.slot === "lunch")?.name);
    expect(new Set(lunches).size).toBeGreaterThanOrEqual(10);
    expect(new Set(lunches.slice(7)).size).toBeGreaterThanOrEqual(8);
  });
});
