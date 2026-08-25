import { ChildProfile, toKidFuelProfile, type IChildProfile } from "@/models/ChildProfile";
import { MealPlan, type IMealPlan } from "@/models/MealPlan";
import {
  generateKidFuelMealPlan,
  MEAL_ENGINE_VERSION,
  planNeedsRegeneration,
} from "@/services/kidfuel-meal-engine";
import type { GeneratedMealPlan, PlanTier } from "@/types/kidfuel";

export function toResponsePlan(child: IChildProfile, generated: GeneratedMealPlan) {
  return {
    childName: child.name,
    ageYears: child.ageYears,
    gender: child.gender,
    goal: child.goal,
    foodStyle: child.foodStyle,
    today: generated.today,
    weekly: generated.weekly,
    monthly: generated.monthly,
    breakdown: generated.breakdown,
    recommendedFoods: generated.recommendedFoods,
    planTier: child.selectedPlan ?? "complete-bundle",
  };
}

export function storedPlanToResponse(child: IChildProfile, plan: IMealPlan) {
  return {
    childName: child.name,
    ageYears: child.ageYears,
    gender: child.gender,
    goal: child.goal,
    foodStyle: child.foodStyle,
    today: plan.today,
    weekly: plan.weekly,
    monthly: plan.monthly,
    breakdown: plan.breakdown,
    recommendedFoods: plan.recommendedFoods,
    planTier: plan.planTier,
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
    engineVersion: MEAL_ENGINE_VERSION,
  };
}

export async function saveGeneratedPlan(
  userId: string,
  child: IChildProfile,
  existing: IMealPlan | null
) {
  const profile = toKidFuelProfile(child);
  const tier = (child.selectedPlan ?? "complete-bundle") as PlanTier;
  const generated = generateKidFuelMealPlan(profile, tier);
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
