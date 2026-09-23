import { overlaySchoolPlan } from "@/lib/school-lunch-view";
import { applyLunchOverrides } from "@/lib/plan-lunch-overrides";
import type { GeneratedMealPlan } from "@/types/babybite";

/** Today & week shelves always show packable (school-box) lunches. */
export function planForTodayWeekDisplay(
  plan: GeneratedMealPlan,
  lunchOverrides: Record<string, string> | undefined
): GeneratedMealPlan {
  return applyLunchOverrides(overlaySchoolPlan(plan, true), lunchOverrides);
}
