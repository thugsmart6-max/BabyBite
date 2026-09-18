import { ChildProfile, toBabyBiteProfile, type IChildProfile } from "@/models/ChildProfile";
import { MealPlan, type IMealPlan } from "@/models/MealPlan";
import {
  generateBabyBiteMealPlan,
  MEAL_ENGINE_VERSION,
  planNeedsRegeneration,
} from "@/services/babybite-meal-engine";
import type { GeneratedMealPlan, MealSlot, PlanTier } from "@/types/babybite";
import { ageBandForYears } from "@/types/babybite";
import { checklistSummary } from "@/lib/meal-rationale";

export function toResponsePlan(child: IChildProfile, generated: GeneratedMealPlan) {
  const profile = toBabyBiteProfile(child);
  return {
    childName: child.name,
    ageYears: child.ageYears,
    ageBand: generated.ageBand ?? ageBandForYears(child.ageYears),
    gender: child.gender,
    goal: child.goal,
    foodStyle: child.foodStyle,
    dietPreference: child.dietPreference,
    challenges: child.challenges,
    allergies: child.allergies,
    dislikedFoods: child.dislikedFoods,
    cookTime: child.cookTime,
    kitchenBudget: child.kitchenBudget,
    riceHabit: child.riceHabit,
    tiffinNeed: child.tiffinNeed,
    checklistSummary: generated.checklistSummary ?? checklistSummary(profile),
    today: generated.today,
    weekly: generated.weekly,
    monthly: generated.monthly,
    breakdown: generated.breakdown,
    recommendedFoods: generated.recommendedFoods,
    kitchenLists: generated.kitchenLists,
    planTier: child.selectedPlan ?? "complete-bundle",
    recentMealNames: generated.recentMealNames,
  };
}

export function storedPlanToResponse(child: IChildProfile, plan: IMealPlan) {
  const profile = toBabyBiteProfile(child);
  return {
    childName: child.name,
    ageYears: child.ageYears,
    ageBand: ageBandForYears(child.ageYears),
    gender: child.gender,
    goal: child.goal,
    foodStyle: child.foodStyle,
    dietPreference: child.dietPreference,
    challenges: child.challenges,
    allergies: child.allergies,
    dislikedFoods: child.dislikedFoods,
    cookTime: child.cookTime,
    kitchenBudget: child.kitchenBudget,
    riceHabit: child.riceHabit,
    tiffinNeed: child.tiffinNeed,
    checklistSummary: checklistSummary(profile),
    today: plan.today,
    weekly: plan.weekly,
    monthly: plan.monthly,
    breakdown: plan.breakdown,
    recommendedFoods: plan.recommendedFoods,
    kitchenLists: plan.kitchenLists,
    planTier: plan.planTier,
    recentMealNames: plan.recentMealNames,
  };
}

function generatedPayload(userId: string, child: IChildProfile, generated: GeneratedMealPlan, tier: PlanTier) {
  return {
    userId,
    childProfileId: child._id,
    planTier: tier,
    today: generated.today,
    weekly: generated.weekly,
    monthly: generated.monthly,
    breakdown: generated.breakdown,
    recommendedFoods: generated.recommendedFoods,
    kitchenLists: generated.kitchenLists,
    recentMealNames: generated.recentMealNames,
    engineVersion: MEAL_ENGINE_VERSION,
  };
}

const SLOTS: MealSlot[] = ["breakfast", "morningSnack", "lunch", "eveningSnack", "dinner"];

function recentFromExisting(plan: IMealPlan | null): Record<MealSlot, string[]> | undefined {
  if (!plan) return undefined;
  if (plan.recentMealNames) return plan.recentMealNames;
  const recent: Record<MealSlot, string[]> = {
    breakfast: [],
    morningSnack: [],
    lunch: [],
    eveningSnack: [],
    dinner: [],
  };
  for (const day of [...(plan.weekly ?? []), ...(plan.monthly ?? [])]) {
    for (const meal of day.meals ?? []) {
      if (!SLOTS.includes(meal.slot)) continue;
      recent[meal.slot] = [...recent[meal.slot], meal.name].slice(-10);
    }
  }
  return recent;
}

export async function saveGeneratedPlan(
  userId: string,
  child: IChildProfile,
  existing: IMealPlan | null
) {
  const profile = toBabyBiteProfile(child);
  const tier = (child.selectedPlan ?? "complete-bundle") as PlanTier;
  const generated = generateBabyBiteMealPlan(profile, tier, {
    recentMealNames: recentFromExisting(existing),
  });
  const payload = generatedPayload(userId, child, generated, tier);

  if (existing) {
    const mealPlan = await MealPlan.findByIdAndUpdate(
      existing._id,
      { $set: payload },
      { new: true }
    );
    if (!mealPlan) {
      const created = await MealPlan.create(payload);
      return { mealPlan: created, generated, reused: false as const };
    }
    return { mealPlan, generated, reused: false as const };
  }

  const mealPlan = await MealPlan.create(payload);
  return { mealPlan, generated, reused: false as const };
}

export async function loadStoredMealPlan(userId: string, child: IChildProfile) {
  const existing = await MealPlan.findOne({
    userId,
    childProfileId: child._id,
  }).sort({ createdAt: -1 });

  if (!existing) {
    return { mealPlan: null, generated: null, reused: false as const };
  }

  return {
    mealPlan: existing,
    generated: storedPlanToResponse(child, existing),
    reused: true as const,
  };
}

export async function getOrRefreshMealPlan(
  userId: string,
  child: IChildProfile,
  options?: { force?: boolean }
) {
  const existing = await MealPlan.findOne({
    userId,
    childProfileId: child._id,
  }).sort({ createdAt: -1 });

  const stale = !existing || planNeedsRegeneration(existing);
  const shouldRegen = Boolean(options?.force) || stale;

  if (existing && !shouldRegen) {
    return {
      mealPlan: existing,
      generated: storedPlanToResponse(child, existing),
      reused: true as const,
    };
  }

  const saved = await saveGeneratedPlan(userId, child, existing);
  if (!saved.mealPlan) {
    return { mealPlan: null, generated: null, reused: false as const };
  }

  if (stale && child.pdfEmailSentAt) {
    child.pdfEmailSentAt = undefined;
    await child.save();
  }

  return {
    mealPlan: saved.mealPlan,
    generated: toResponsePlan(child, saved.generated),
    reused: false as const,
  };
}

export async function loadLatestChild(userId: string, childProfileId?: string | null) {
  const query = childProfileId ? { _id: childProfileId, userId } : { userId };
  return ChildProfile.findOne(query).sort({ createdAt: -1 });
}
