import { describe, expect, it } from "vitest";
import { BABYBITE_MEALS } from "@/lib/data/babybite-meals";
import { generateBabyBiteMealPlan, filterMealPool, pickMeal, mealFitsDiet, planNeedsRegeneration, MEAL_ENGINE_VERSION } from "@/services/babybite-meal-engine";
import type { BabyBiteChildProfile } from "@/types/babybite";

const baseProfile: BabyBiteChildProfile = {
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

describe("generateBabyBiteMealPlan", () => {
  it("returns today, 7 weekly days, and 30 monthly days", () => {
    const plan = generateBabyBiteMealPlan(baseProfile);
    expect(plan.today.meals).toHaveLength(5);
    expect(plan.weekly).toHaveLength(7);
    expect(plan.monthly).toHaveLength(30);
    expect(plan.childName).toBe("Rohan");
  });

  it("keeps the first week identical in weekly and monthly views", () => {
    const plan = generateBabyBiteMealPlan(baseProfile);
    expect(plan.today.date).toBe(plan.weekly[0].date);
    expect(plan.weekly[0].meals.map((m) => m.name)).toEqual(plan.monthly[0].meals.map((m) => m.name));
    expect(plan.weekly[3].meals.map((m) => m.name)).toEqual(plan.monthly[3].meals.map((m) => m.name));
  });

  it("never assigns non-veg meals to a vegetarian profile", () => {
    const plan = generateBabyBiteMealPlan(baseProfile);
    const names = [
      ...plan.today.meals,
      ...plan.weekly.flatMap((d) => d.meals),
      ...plan.monthly.flatMap((d) => d.meals),
    ].map((m) => m.name.toLowerCase());
    expect(names.some((name) => name.includes("chicken") || name.includes("fish"))).toBe(false);
  });

  it("lets a non-veg child eat vegetarian plates as well as fish or chicken", () => {
    const plan = generateBabyBiteMealPlan({
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
    const plan = generateBabyBiteMealPlan({
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
    const plan = generateBabyBiteMealPlan({
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
    const plan = generateBabyBiteMealPlan({
      ...baseProfile,
      allergies: ["dairy"],
    });
    const names = plan.weekly.flatMap((d) => d.meals).map((m) => m.name.toLowerCase());
    expect(names.some((name) => name.includes("paneer") || name.includes("curd") || name.includes("raita"))).toBe(
      false
    );
  });

  it("tags meals with age bands and keeps younger plates off the 9–12-only dishes", () => {
    expect(BABYBITE_MEALS.every((meal) => meal.ageBands.length > 0)).toBe(true);
    const youngLunch = filterMealPool({ ...baseProfile, ageYears: 4 }, "lunch", { ignoreGoal: true });
    const olderLunch = filterMealPool({ ...baseProfile, ageYears: 11 }, "lunch", { ignoreGoal: true });
    expect(youngLunch.every((meal) => meal.ageBands.includes("4-5"))).toBe(true);
    expect(youngLunch.some((meal) => meal.name.startsWith("Rajma Rice"))).toBe(false);
    expect(olderLunch.some((meal) => meal.name.startsWith("Rajma Rice"))).toBe(true);
  });

  it("packs weekday lunch from school-tiffin meals when the box is on", () => {
    const plan = generateBabyBiteMealPlan({
      ...baseProfile,
      tiffinNeed: "school-lunch",
      foodStyle: "mixed-indian",
      dietPreference: "non-vegetarian",
    });
    const weekdayLunches = plan.weekly
      .filter((day) => day.dayLabel !== "Saturday" && day.dayLabel !== "Sunday")
      .map((day) => day.meals.find((meal) => meal.slot === "lunch"));
    expect(weekdayLunches.length).toBeGreaterThan(0);
    expect(weekdayLunches.every((meal) => meal?.tags?.includes("school-tiffin"))).toBe(true);
    expect(plan.kitchenLists?.schoolLunch.length).toBeGreaterThan(0);
  });

  it("keeps breakfast, lunch, and dinner unique across a mixed week", () => {
    const plan = generateBabyBiteMealPlan({
      ...baseProfile,
      dietPreference: "non-vegetarian",
      foodStyle: "mixed-indian",
      goal: "food-variety",
    });
    const unique = (slot: "breakfast" | "lunch" | "dinner") =>
      new Set(plan.weekly.map((day) => day.meals.find((m) => m.slot === slot)?.name)).size;
    expect(unique("breakfast")).toBe(7);
    expect(unique("lunch")).toBe(7);
    expect(unique("dinner")).toBe(7);
  });

  it("does not stick the 30-day board on the same breakfast, lunch, or dinner", () => {
    const plan = generateBabyBiteMealPlan({
      ...baseProfile,
      dietPreference: "non-vegetarian",
      foodStyle: "mixed-indian",
      goal: "food-variety",
    });
    const names = (slot: "breakfast" | "lunch" | "dinner") =>
      plan.monthly.map((day) => day.meals.find((meal) => meal.slot === slot)?.name);
    for (const slot of ["breakfast", "lunch", "dinner"] as const) {
      const list = names(slot);
      expect(new Set(list).size).toBeGreaterThanOrEqual(10);
      expect(new Set(list.slice(7)).size).toBeGreaterThanOrEqual(8);
      for (let i = 2; i < list.length; i += 1) {
        expect(list[i] === list[i - 1] && list[i] === list[i - 2]).toBe(false);
      }
    }
  });

  it("writes why-this-plate notes from the onboarding checklist", () => {
    const plan = generateBabyBiteMealPlan({
      ...baseProfile,
      challenges: ["picky-eater", "no-vegetables"],
      cookTime: "ten-min",
      tiffinNeed: "home-only",
    });
    expect(plan.checklistSummary).toMatch(/Picky Eater/);
    expect(plan.checklistSummary).toMatch(/Doesn't Like Vegetables/);
    expect(plan.today.meals.every((meal) => (meal.whyThisPlate ?? "").length > 0)).toBe(true);
  });

  it("serves more hidden-vegetable plates when the child refuses sabzi", () => {
    const hidden = generateBabyBiteMealPlan({
      ...baseProfile,
      challenges: ["no-vegetables"],
      foodStyle: "mixed-indian",
    });
    const baseline = generateBabyBiteMealPlan({
      ...baseProfile,
      challenges: ["picky-eater"],
      foodStyle: "mixed-indian",
    });
    const count = (plan: typeof hidden) =>
      plan.weekly.flatMap((day) => day.meals).filter((meal) => meal.tags?.includes("hidden-veg")).length;
    expect(count(hidden)).toBeGreaterThan(count(baseline));
  });

  it("avoids dairy-heavy names when the child does not drink milk", () => {
    const plan = generateBabyBiteMealPlan({
      ...baseProfile,
      challenges: ["no-milk"],
      foodStyle: "mixed-indian",
    });
    const names = plan.weekly.flatMap((day) => day.meals).map((meal) => meal.name.toLowerCase());
    expect(names.some((name) => name.includes("paneer") || name.includes("curd") || name.includes("raita"))).toBe(
      false
    );
  });

  it("raises daily calories when underweight is ticked", () => {
    const thin = generateBabyBiteMealPlan({
      ...baseProfile,
      challenges: ["underweight"],
      foodStyle: "mixed-indian",
    });
    const typical = generateBabyBiteMealPlan({
      ...baseProfile,
      challenges: ["picky-eater"],
      foodStyle: "mixed-indian",
    });
    const cals = (plan: typeof thin) => plan.today.meals.reduce((sum, meal) => sum + meal.caloriesApprox, 0);
    expect(cals(thin)).toBeGreaterThan(cals(typical));
  });

  it("does not clone the week when regenerating with saved recent names", () => {
    const profile = {
      ...baseProfile,
      dietPreference: "non-vegetarian" as const,
      foodStyle: "mixed-indian" as const,
      goal: "food-variety" as const,
    };
    const first = generateBabyBiteMealPlan(profile);
    const second = generateBabyBiteMealPlan(profile, "complete-bundle", {
      recentMealNames: first.recentMealNames,
    });
    const names = (plan: typeof first, slot: "lunch" | "dinner") =>
      plan.weekly.map((day) => day.meals.find((meal) => meal.slot === slot)?.name).join("|");
    expect(names(second, "lunch")).not.toBe(names(first, "lunch"));
  });

  it("uses smaller calorie band for ages 4–5", () => {
    const young = generateBabyBiteMealPlan({ ...baseProfile, ageYears: 4 });
    const older = generateBabyBiteMealPlan({ ...baseProfile, ageYears: 11 });
    const youngCals = young.today.meals.reduce((sum, m) => sum + m.caloriesApprox, 0);
    const olderCals = older.today.meals.reduce((sum, m) => sum + m.caloriesApprox, 0);
    expect(youngCals).toBeLessThan(olderCals);
    expect(young.today.meals[0].portionNote).toMatch(/4–5/);
    expect(older.today.meals[0].portionNote).toMatch(/9–12/);
  });

  it("keeps today matching week/month day 0, with different lunches on days 1–6", () => {
    const plan = generateBabyBiteMealPlan({
      ...baseProfile,
      dietPreference: "non-vegetarian",
      foodStyle: "mixed-indian",
    });
    const lunch = (day: (typeof plan.weekly)[number]) => day.meals.find((meal) => meal.slot === "lunch")?.name;
    expect(plan.today.date).toBe(plan.weekly[0].date);
    expect(lunch(plan.today)).toBe(lunch(plan.weekly[0]));
    expect(lunch(plan.weekly[0])).toBe(lunch(plan.monthly[0]));
    const later = plan.weekly.slice(1).map(lunch);
    expect(later.every((name) => name && name !== lunch(plan.today))).toBe(true);
  });

  it("keeps meal slots unique within a day", () => {
    const plan = generateBabyBiteMealPlan(baseProfile);
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
  const ragi = BABYBITE_MEALS.find((meal) => meal.name.startsWith("Ragi Dosa"))!;
  const fish = BABYBITE_MEALS.find((meal) => meal.name.startsWith("Fish Curry"))!;
  const egg = BABYBITE_MEALS.find((meal) => meal.name.startsWith("Egg Dosa"))!;

  it("lets non-veg children eat vegetarian plates, not the reverse", () => {
    expect(mealFitsDiet(ragi, "non-vegetarian")).toBe(true);
    expect(mealFitsDiet(fish, "vegetarian")).toBe(false);
    expect(mealFitsDiet(egg, "vegetarian")).toBe(false);
    expect(mealFitsDiet(egg, "eggetarian")).toBe(true);
    expect(mealFitsDiet(fish, "eggetarian")).toBe(false);
  });
});

describe("kitchen tags and swaps", () => {
  it("tags every meal with minutes, pantry, and at least one kitchen tag", () => {
    expect(BABYBITE_MEALS.length).toBeGreaterThan(40);
    expect(new Set(BABYBITE_MEALS.map((meal) => meal.name)).size).toBe(BABYBITE_MEALS.length);
    for (const meal of BABYBITE_MEALS) {
      expect(meal.minutes).toBeGreaterThan(0);
      expect(meal.pantry.length).toBeGreaterThanOrEqual(3);
      expect(meal.tags.length).toBeGreaterThan(0);
      expect(meal.tags.includes("rice-based") || meal.tags.includes("rice-free")).toBe(true);
    }
    const riceFree = BABYBITE_MEALS.filter((meal) => meal.tags.includes("rice-free") && !meal.tags.includes("rice-based"));
    expect(riceFree.length).toBeGreaterThanOrEqual(12);
  });

  it("keeps plated rice off lunch and dinner when the child refuses rice", () => {
    const plan = generateBabyBiteMealPlan({
      ...baseProfile,
      foodStyle: "south-indian",
      riceHabit: "refuses-rice",
    });
    const mains = [plan.today, ...plan.weekly, ...plan.monthly].flatMap((day) =>
      day.meals.filter((meal) => meal.slot === "lunch" || meal.slot === "dinner")
    );
    expect(mains.every((meal) => !meal.tags?.includes("rice-based"))).toBe(true);
    expect(mains.every((meal) => meal.tags?.includes("rice-free"))).toBe(true);
  });

  it("prefers 10-minute plates when the kitchen only has 10 minutes", () => {
    const rushed = generateBabyBiteMealPlan({ ...baseProfile, cookTime: "ten-min" });
    const calm = generateBabyBiteMealPlan({ ...baseProfile, cookTime: "normal" });
    const avg = (plan: typeof rushed) =>
      plan.today.meals.reduce((sum, meal) => sum + (meal.minutes ?? 30), 0) / plan.today.meals.length;
    expect(avg(rushed)).toBeLessThanOrEqual(avg(calm));
    expect(rushed.today.meals.filter((meal) => (meal.minutes ?? 99) <= 10).length).toBeGreaterThan(0);
  });

  it("gives every plate two swaps, and rice plates swap to rice-free", () => {
    const plan = generateBabyBiteMealPlan({
      ...baseProfile,
      foodStyle: "south-indian",
      riceHabit: "eats-rice",
    });
    for (const meal of plan.today.meals) {
      expect(meal.swaps?.length).toBe(2);
    }
    const ricePlate = plan.monthly
      .flatMap((day) => day.meals)
      .find((meal) => meal.tags?.includes("rice-based"));
    expect(ricePlate).toBeTruthy();
    const riceNames = new Set(
      BABYBITE_MEALS.filter((meal) => meal.tags.includes("rice-based")).map((meal) => meal.name)
    );
    expect(ricePlate?.swaps?.every((swap) => !riceNames.has(swap.name))).toBe(true);
  });

  it("does not pair banana with peanut chutney, and does not copy the same refuse-this swaps onto every plate", () => {
    expect(BABYBITE_MEALS.some((meal) => /peanut chutney/i.test(meal.name))).toBe(false);
    expect(BABYBITE_MEALS.some((meal) => meal.name === "Banana with Peanut Butter")).toBe(true);
    const banana = BABYBITE_MEALS.find((meal) => meal.name.startsWith("Banana with Peanut"));
    expect(banana?.description.toLowerCase()).toMatch(/peanut butter/);
    expect(banana?.description.toLowerCase()).not.toMatch(/chutney/);

    const plan = generateBabyBiteMealPlan({
      ...baseProfile,
      challenges: ["picky-eater", "no-vegetables", "active-sports"],
      riceHabit: "refuses-rice",
      tiffinNeed: "school-lunch",
      foodStyle: "mixed-indian",
    });
    const snackWhy = plan.weekly
      .flatMap((day) => day.meals)
      .filter((meal) => meal.slot === "eveningSnack" || meal.slot === "morningSnack")
      .map((meal) => meal.whyThisPlate ?? "");
    expect(snackWhy.some((why) => /plated rice/i.test(why))).toBe(false);

    const lunchPairs = plan.weekly.map((day) =>
      (day.meals.find((meal) => meal.slot === "lunch")?.swaps ?? []).map((swap) => swap.name).join("|")
    );
    expect(new Set(lunchPairs).size).toBeGreaterThan(1);
  });

  it("builds meal and problem kitchen lists", () => {
    const plan = generateBabyBiteMealPlan(baseProfile);
    expect(plan.kitchenLists?.snacks.length).toBeGreaterThan(0);
    expect(plan.kitchenLists?.tenMin.length).toBeGreaterThan(0);
    expect(plan.kitchenLists?.homemadeSnacks.length).toBeGreaterThan(0);
    expect(plan.kitchenLists?.riceFree.length).toBeGreaterThan(0);
  });
});

describe("planNeedsRegeneration", () => {
  it("rebuilds plans saved before the variety engine", () => {
    const plan = generateBabyBiteMealPlan(baseProfile);
    expect(planNeedsRegeneration({ ...plan, engineVersion: 0 })).toBe(true);
    expect(planNeedsRegeneration({ ...plan, engineVersion: MEAL_ENGINE_VERSION })).toBe(false);
  });

  it("rebuilds a current-version plan that repeats lunch and dinner all week", () => {
    const plan = generateBabyBiteMealPlan(baseProfile);
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
