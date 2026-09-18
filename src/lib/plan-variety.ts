import type { DailyPlan, MealSlot } from "@/types/babybite";

export const MEAL_ENGINE_VERSION = 13;

function mealName(day: DailyPlan | undefined, slot: MealSlot): string | undefined {
  return day?.meals?.find((meal) => meal.slot === slot)?.name;
}

function slotHasDuplicate(days: DailyPlan[], slot: MealSlot): boolean {
  const names = days.map((day) => mealName(day, slot)).filter(Boolean);
  return names.length >= 7 && new Set(names).size < names.length;
}

export function uniqueSlotCount(days: DailyPlan[], slot: MealSlot): number {
  return new Set(days.map((day) => mealName(day, slot)).filter(Boolean)).size;
}

/** True when the week keeps serving the same lunch instead of rotating. */
export function lunchLooksRepeated(weekly: DailyPlan[]): boolean {
  return slotHasDuplicate(weekly, "lunch");
}

function consecutiveRepeat(days: DailyPlan[], slot: MealSlot, streak: number): boolean {
  const names = days.map((day) => mealName(day, slot));
  let run = 1;
  for (let i = 1; i < names.length; i += 1) {
    if (names[i] && names[i] === names[i - 1]) {
      run += 1;
      if (run >= streak) return true;
    } else {
      run = 1;
    }
  }
  return false;
}

/** True when the 30-day board loops a handful of plates. */
export function monthLooksRepeated(monthly: DailyPlan[]): boolean {
  if (monthly.length < 14) return false;
  return (
    consecutiveRepeat(monthly, "breakfast", 3) ||
    consecutiveRepeat(monthly, "lunch", 3) ||
    consecutiveRepeat(monthly, "dinner", 3) ||
    uniqueSlotCount(monthly, "lunch") < 8 ||
    uniqueSlotCount(monthly, "dinner") < 8
  );
}

/** True when the saved week is the old bug: same breakfast every day, or lunch = dinner. */
export function planLooksStuck(plan: {
  today?: DailyPlan;
  weekly?: DailyPlan[];
  monthly?: DailyPlan[];
}): boolean {
  const weekly = plan.weekly ?? [];
  const monthly = plan.monthly ?? [];
  const days = [plan.today, ...weekly, ...monthly].filter(Boolean) as DailyPlan[];

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
    slotHasDuplicate(weekly, "breakfast") ||
    slotHasDuplicate(weekly, "lunch") ||
    slotHasDuplicate(weekly, "dinner") ||
    monthLooksRepeated(monthly)
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
