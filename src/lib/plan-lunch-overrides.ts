import type { DailyPlan, GeneratedMealPlan, KitchenLists, MealEntry } from "@/types/babybite";

function allMeals(lists: KitchenLists): MealEntry[] {
  return [
    ...(lists.breakfast ?? []),
    ...(lists.lunch ?? []),
    ...(lists.dinner ?? []),
    ...(lists.snacks ?? []),
    ...(lists.schoolLunch ?? []),
    ...(lists.tenMin ?? []),
    ...(lists.budget ?? []),
    ...(lists.kidsFavourite ?? []),
    ...(lists.riceFree ?? []),
    ...(lists.homemadeSnacks ?? []),
  ];
}

function findMealByName(lists: KitchenLists, name: string): MealEntry | undefined {
  return allMeals(lists).find((meal) => meal.name === name);
}

function patchDayLunch(day: DailyPlan, nextLunch: MealEntry): DailyPlan {
  return {
    ...day,
    meals: (day.meals ?? []).map((meal) =>
      meal.slot === "lunch" ? { ...nextLunch, slot: "lunch", swaps: meal.swaps ?? nextLunch.swaps } : meal
    ),
  };
}

export function applyLunchOverrides(
  plan: GeneratedMealPlan,
  overrides: Record<string, string> | undefined | null
): GeneratedMealPlan {
  if (!overrides || Object.keys(overrides).length === 0) return plan;
  const lists = plan.kitchenLists;
  if (!lists) return plan;

  const patchDays = (days: DailyPlan[]) =>
    days.map((day) => {
      const name = overrides[day.date];
      if (!name) return day;
      const meal = findMealByName(lists, name);
      if (!meal) return day;
      return patchDayLunch(day, meal);
    });

  const todayOverride = overrides[plan.today.date];
  const todayMeal = todayOverride ? findMealByName(lists, todayOverride) : undefined;

  return {
    ...plan,
    today: todayMeal ? patchDayLunch(plan.today, todayMeal) : plan.today,
    weekly: plan.weekly?.length ? patchDays(plan.weekly) : plan.weekly,
    monthly: plan.monthly?.length ? patchDays(plan.monthly) : plan.monthly,
  };
}

export function collectLunchAlternatives(plan: GeneratedMealPlan, schoolOn: boolean): MealEntry[] {
  const lists = plan.kitchenLists;
  if (!lists) return [];
  const seen = new Set<string>();
  const pool = schoolOn
    ? [...(lists.schoolLunch ?? []), ...(lists.lunch ?? []).filter((m) => m.tags?.includes("school-tiffin"))]
    : [
        ...(lists.lunch ?? []),
        ...(lists.schoolLunch ?? []),
        ...(lists.kidsFavourite ?? []),
        ...(lists.tenMin ?? []),
      ];
  const out: MealEntry[] = [];
  for (const meal of pool) {
    if (!meal.name || seen.has(meal.name)) continue;
    seen.add(meal.name);
    out.push({ ...meal, slot: "lunch" });
  }
  return out;
}
