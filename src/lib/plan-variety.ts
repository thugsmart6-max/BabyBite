import type { DailyPlan, MealSlot } from "@/types/kidfuel";

export const MEAL_ENGINE_VERSION = 5;

function mealName(day: DailyPlan | undefined, slot: MealSlot): string | undefined {
  return day?.meals?.find((meal) => meal.slot === slot)?.name;
}

function slotColumnStuck(days: DailyPlan[], slot: MealSlot): boolean {
  const names = days.map((day) => mealName(day, slot)).filter(Boolean);
  return names.length >= 3 && new Set(names).size === 1;
}

/** True when the saved week is the old bug: same breakfast every day, or lunch = dinner. */
export function planLooksStuck(plan: {
  today?: DailyPlan;
  weekly?: DailyPlan[];
  monthly?: DailyPlan[];
}): boolean {
  const weekly = plan.weekly ?? [];
  const days = [plan.today, ...weekly, ...(plan.monthly ?? [])].filter(Boolean) as DailyPlan[];

  for (const day of days) {
    const meals = day.meals ?? [];
    const names = meals.map((meal) => meal.name).filter(Boolean);
    if (names.length >= 2 && new Set(names).size < names.length) return true;
    const lunch = mealName(day, "lunch");
    const dinner = mealName(day, "dinner");
    if (lunch && dinner && lunch === dinner) return true;
    const morning = mealName(day, "morningSnack");
    const evening = mealName(day, "eveningSnack");
    if (morning && evening && morning === evening) return true;
  }

  return (
    slotColumnStuck(weekly, "breakfast") ||
    slotColumnStuck(weekly, "lunch") ||
    slotColumnStuck(weekly, "dinner")
  );
}

export function planNeedsRegeneration(plan: {
  engineVersion?: number | null;
  toObject?: () => unknown;
  today?: DailyPlan;
  weekly?: DailyPlan[];
  monthly?: DailyPlan[];
}): boolean {
  const plain =
    typeof plan.toObject === "function"
      ? (plan.toObject() as typeof plan)
      : plan;
  if (plain.engineVersion !== MEAL_ENGINE_VERSION) return true;
  return planLooksStuck(plain);
}
