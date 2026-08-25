import { describe, expect, it } from "vitest";
import { KIDFUEL_MEALS } from "@/lib/data/kidfuel-meals";
import { generateKidFuelMealPlan, filterMealPool, pickMeal, mealFitsDiet, planNeedsRegeneration, MEAL_ENGINE_VERSION } from "@/services/kidfuel-meal-engine";
import type { KidFuelChildProfile } from "@/types/kidfuel";

const baseProfile: KidFuelChildProfile = {
  id: "507f1f77bcf86cd799439011",
  name: "Rohan",
  ageYears: 7,
  gender: "male",
  dietPreference: "vegetarian",
  foodStyle: "north-indian",
  challenges: ["picky-eater"],
  goal: "healthy-nutrition",
  allergies: [],
  dislikedFoods: [],
};

describe("generateKidFuelMealPlan", () => {
  it("returns today, 7 weekly days, and 30 monthly days", () => {
    const plan = generateKidFuelMealPlan(baseProfile);
    expect(plan.today.meals).toHaveLength(5);
    expect(plan.weekly).toHaveLength(7);
    expect(plan.monthly).toHaveLength(30);
    expect(plan.childName).toBe("Rohan");
  });

  it("keeps the first week identical in weekly and monthly views", () => {
    const plan = generateKidFuelMealPlan(baseProfile);
    expect(plan.today.date).toBe(plan.weekly[0].date);
    expect(plan.weekly[0].meals.map((m) => m.name)).toEqual(plan.monthly[0].meals.map((m) => m.name));
    expect(plan.weekly[3].meals.map((m) => m.name)).toEqual(plan.monthly[3].meals.map((m) => m.name));
  });

  it("never assigns non-veg meals to a vegetarian profile", () => {
    const plan = generateKidFuelMealPlan(baseProfile);
    const names = [
      ...plan.today.meals,
      ...plan.weekly.flatMap((d) => d.meals),
      ...plan.monthly.flatMap((d) => d.meals),
    ].map((m) => m.name.toLowerCase());
    expect(names.some((name) => name.includes("chicken") || name.includes("fish"))).toBe(false);
  });

  it("lets a non-veg child eat vegetarian plates as well as fish or chicken", () => {
    const plan = generateKidFuelMealPlan({
      ...baseProfile,
      dietPreference: "non-vegetarian",
      foodStyle: "south-indian",
      goal: "protein-focus",
    });
    const names = plan.weekly.flatMap((d) => d.meals).map((m) => m.name.toLowerCase());
    expect(names.some((name) => name.includes("dosa") || name.includes("idli") || name.includes("ragi"))).toBe(
      true
    );
    expect(names.some((name) => name.includes("fish") || name.includes("chicken") || name.includes("egg"))).toBe(
      true
    );
  });

  it("does not repeat the same dish twice in one day", () => {
    const plan = generateKidFuelMealPlan({
      ...baseProfile,
      dietPreference: "non-vegetarian",
      foodStyle: "south-indian",
    });
    for (const day of [plan.today, ...plan.weekly, ...plan.monthly]) {
      const names = day.meals.map((m) => m.name);
      expect(new Set(names).size).toBe(names.length);
    }
  });

  it("rotates breakfast, lunch, and dinner across the week", () => {
    const plan = generateKidFuelMealPlan({
      ...baseProfile,
      dietPreference: "non-vegetarian",
      foodStyle: "south-indian",
      goal: "protein-focus",
    });
    const unique = (slot: "breakfast" | "lunch" | "dinner") =>
      new Set(plan.weekly.map((day) => day.meals.find((m) => m.slot === slot)?.name)).size;
    expect(unique("breakfast")).toBeGreaterThan(1);
    expect(unique("lunch")).toBeGreaterThan(1);
    expect(unique("dinner")).toBeGreaterThan(1);
  });

  it("excludes dairy meals when dairy allergy is set", () => {
    const plan = generateKidFuelMealPlan({
      ...baseProfile,
      allergies: ["dairy"],
    });
    const names = plan.weekly.flatMap((d) => d.meals).map((m) => m.name.toLowerCase());
    expect(names.some((name) => name.includes("paneer") || name.includes("curd") || name.includes("raita"))).toBe(
      false
    );
  });

  it("uses smaller calorie band for ages 4–6", () => {
    const young = generateKidFuelMealPlan({ ...baseProfile, ageYears: 5 });
    const older = generateKidFuelMealPlan({ ...baseProfile, ageYears: 11 });
    const youngCals = young.today.meals.reduce((sum, m) => sum + m.caloriesApprox, 0);
    const olderCals = older.today.meals.reduce((sum, m) => sum + m.caloriesApprox, 0);
    expect(youngCals).toBeLessThan(olderCals);
    expect(young.today.meals[0].portionNote).toMatch(/4–6/);
  });

  it("keeps meal slots unique within a day", () => {
    const plan = generateKidFuelMealPlan(baseProfile);
    const slots = plan.today.meals.map((m) => m.slot);
    expect(new Set(slots).size).toBe(5);
  });
});

describe("filterMealPool", () => {
  it("returns a dairy-free breakfast pool when dairy is listed", () => {
    const pool = filterMealPool({ ...baseProfile, allergies: ["dairy"] }, "breakfast", {
      ignoreGoal: true,
    });
    expect(pool.length).toBeGreaterThan(0);
    expect(pool.every((meal) => !meal.allergens.includes("dairy"))).toBe(true);
  });
});

describe("pickMeal", () => {
  it("falls back safely when the used-name set is full", () => {
    const used = new Set<string>(["placeholder"]);
    const meal = pickMeal(baseProfile, "lunch", 3, used);
    expect(meal.name.length).toBeGreaterThan(0);
    expect(meal.slot).toBe("lunch");
  });
});

describe("mealFitsDiet", () => {
  const ragi = KIDFUEL_MEALS.find((meal) => meal.name.startsWith("Ragi Dosa"))!;
  const fish = KIDFUEL_MEALS.find((meal) => meal.name.startsWith("Fish Curry"))!;
  const egg = KIDFUEL_MEALS.find((meal) => meal.name.startsWith("Egg Dosa"))!;

  it("lets non-veg children eat vegetarian plates, not the reverse", () => {
    expect(mealFitsDiet(ragi, "non-vegetarian")).toBe(true);
    expect(mealFitsDiet(fish, "vegetarian")).toBe(false);
    expect(mealFitsDiet(egg, "vegetarian")).toBe(false);
    expect(mealFitsDiet(egg, "eggetarian")).toBe(true);
    expect(mealFitsDiet(fish, "eggetarian")).toBe(false);
  });
});

describe("planNeedsRegeneration", () => {
  it("rebuilds plans saved before the variety engine", () => {
    const plan = generateKidFuelMealPlan(baseProfile);
    expect(planNeedsRegeneration({ ...plan, engineVersion: 0 })).toBe(true);
    expect(planNeedsRegeneration({ ...plan, engineVersion: MEAL_ENGINE_VERSION })).toBe(false);
  });

  it("rebuilds a current-version plan that repeats lunch and dinner all week", () => {
    const plan = generateKidFuelMealPlan(baseProfile);
    const stuckWeekly = plan.weekly.map((day) => ({
      ...day,
      meals: day.meals.map((meal) =>
        meal.slot === "dinner" || meal.slot === "lunch"
          ? { ...meal, name: "Fish Curry with Rice" }
          : meal.slot === "breakfast"
            ? { ...meal, name: "Ragi Dosa with Coconut Chutney" }
            : meal
      ),
    }));
    expect(
      planNeedsRegeneration({
        ...plan,
        weekly: stuckWeekly,
        engineVersion: MEAL_ENGINE_VERSION,
      })
    ).toBe(true);
  });
});
