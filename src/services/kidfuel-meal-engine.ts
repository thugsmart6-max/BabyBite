import { addDays, format } from "date-fns";
import type {
  DailyPlan,
  DietPreference,
  GeneratedMealPlan,
  KidFuelChildProfile,
  MealEntry,
  MealSlot,
  NutritionBreakdown,
  PlanTier,
} from "@/types/kidfuel";
import { foodStyleLabel } from "@/services/analysis-engine";
import { ALLERGEN_FREE_FALLBACK, KIDFUEL_MEALS, type MealTemplate } from "@/lib/data/kidfuel-meals";
import { MEAL_ENGINE_VERSION, planNeedsRegeneration } from "@/lib/plan-variety";

export { MEAL_ENGINE_VERSION, planNeedsRegeneration };
export { planLooksStuck } from "@/lib/plan-variety";

const SLOTS: MealSlot[] = ["breakfast", "morningSnack", "lunch", "eveningSnack", "dinner"];

function emptyRecent(): Record<MealSlot, string[]> {
  return { breakfast: [], morningSnack: [], lunch: [], eveningSnack: [], dinner: [] };
}

function calorieMultiplier(profile: KidFuelChildProfile): number {
  let factor = 1;
  if (profile.ageYears <= 6) factor = 0.85;
  else if (profile.ageYears >= 10) factor = 1.15;

  if (profile.challenges.includes("underweight") || profile.challenges.includes("active-sports")) {
    factor += 0.08;
  }
  if (profile.challenges.includes("poor-appetite")) {
    factor -= 0.05;
  }
  if (profile.weightKg && profile.heightCm) {
    const heightM = profile.heightCm / 100;
    const bmi = profile.weightKg / (heightM * heightM);
    if (bmi < 14) factor += 0.08;
    if (bmi > 20 && profile.ageYears <= 8) factor -= 0.05;
  }
  return Math.max(0.75, Math.min(1.3, factor));
}

function portionNote(profile: KidFuelChildProfile): string {
  if (profile.ageYears <= 6) return "Smaller serving for ages 4–6";
  if (profile.ageYears >= 10) return "Heartier serving for ages 10–12";
  if (profile.challenges.includes("underweight")) return "Offer a slightly larger portion for catch-up energy";
  return "Standard school-age serving";
}

function excludesAllergies(meal: MealTemplate, profile: KidFuelChildProfile): boolean {
  const allergies = profile.allergies ?? [];
  if (allergies.length === 0) return true;
  return !meal.allergens.some((allergen) => allergies.includes(allergen));
}

function excludesDislikes(meal: MealTemplate, profile: KidFuelChildProfile): boolean {
  const disliked = (profile.dislikedFoods ?? []).map((d) => d.trim().toLowerCase()).filter(Boolean);
  if (disliked.length === 0) return true;
  const text = `${meal.name} ${meal.description}`.toLowerCase();
  return !disliked.some((term) => term.length > 1 && text.includes(term));
}

/** Non-veg children can eat vegetarian plates. Vegetarian children cannot eat egg/meat/fish. */
export function mealFitsDiet(meal: MealTemplate, preference: DietPreference): boolean {
  if (preference === "non-vegetarian") return true;
  if (preference === "eggetarian") {
    return meal.diets.includes("vegetarian") || meal.diets.includes("eggetarian");
  }
  return meal.diets.includes("vegetarian");
}

export function filterMealPool(
  profile: KidFuelChildProfile,
  slot: MealSlot,
  options?: { ignoreStyle?: boolean; ignoreGoal?: boolean }
): MealTemplate[] {
  return KIDFUEL_MEALS.filter((meal) => {
    if (!meal.slots.includes(slot)) return false;
    if (!mealFitsDiet(meal, profile.dietPreference)) return false;
    if (!excludesAllergies(meal, profile)) return false;
    if (!excludesDislikes(meal, profile)) return false;
    if (!options?.ignoreStyle) {
      const styleOk =
        profile.foodStyle === "mixed-indian" || meal.styles.includes(profile.foodStyle);
      if (!styleOk) return false;
    }
    if (!options?.ignoreGoal && !meal.goals.includes(profile.goal)) return false;
    return true;
  });
}

function resolvePool(profile: KidFuelChildProfile, slot: MealSlot): MealTemplate[] {
  const tight = filterMealPool(profile, slot);
  if (tight.length >= 5) return tight;
  const noGoal = filterMealPool(profile, slot, { ignoreGoal: true });
  if (noGoal.length >= 4) return noGoal;
  const noStyle = filterMealPool(profile, slot, { ignoreGoal: true, ignoreStyle: true });
  if (noStyle.length > 0) return noStyle;
  if (noGoal.length > 0) return noGoal;
  if (tight.length > 0) return tight;
  return [ALLERGEN_FREE_FALLBACK];
}

function toMealEntry(meal: MealTemplate, slot: MealSlot, profile: KidFuelChildProfile): MealEntry {
  const calories = Math.round(meal.caloriesApprox * calorieMultiplier(profile));
  return {
    slot,
    name: meal.name,
    description: meal.description,
    caloriesApprox: calories,
    portionNote: portionNote(profile),
  };
}

export function pickMeal(
  profile: KidFuelChildProfile,
  slot: MealSlot,
  dayOffset: number,
  usedNames: Set<string>,
  recentForSlot: string[] = []
): MealEntry {
  const pools = [
    resolvePool(profile, slot),
    filterMealPool(profile, slot, { ignoreGoal: true }),
    filterMealPool(profile, slot, { ignoreGoal: true, ignoreStyle: true }),
  ];

  let chosen: MealTemplate | undefined;
  for (const pool of pools) {
    const notToday = pool.filter((meal) => !usedNames.has(meal.name));
    if (notToday.length === 0) continue;
    const fresh = notToday.filter((meal) => !recentForSlot.includes(meal.name));
    const list = fresh.length > 0 ? fresh : notToday;
    const index = Math.abs(dayOffset * 7 + SLOTS.indexOf(slot) * 11) % list.length;
    chosen = list[index];
    break;
  }

  const meal = chosen ?? ALLERGEN_FREE_FALLBACK;
  usedNames.add(meal.name);
  return toMealEntry(meal, slot, profile);
}

function buildDay(
  profile: KidFuelChildProfile,
  date: Date,
  dayOffset: number,
  recent: Record<MealSlot, string[]>
): DailyPlan {
  const used = new Set<string>();
  return {
    date: format(date, "yyyy-MM-dd"),
    dayLabel: format(date, "EEEE"),
    meals: SLOTS.map((slot) => {
      const entry = pickMeal(profile, slot, dayOffset, used, recent[slot]);
      recent[slot] = [...recent[slot], entry.name].slice(-8);
      return entry;
    }),
  };
}

function recommendedFoods(profile: KidFuelChildProfile): string[] {
  const south = ["Ragi dosa", "Idli", "Sambar", "Lemon rice", "Masala dosa"];
  const north = ["Moong khichdi", "Rajma rice", "Vegetable pulao", "Besan cheela", "Palak dal"];
  const mixed = ["Sprouts chaat", "Seasonal fruit bowl", "Vegetable poha", "Ragi porridge"];

  const base =
    profile.foodStyle === "south-indian"
      ? south
      : profile.foodStyle === "north-indian"
        ? north
        : [...south.slice(0, 2), ...north.slice(0, 2), ...mixed.slice(0, 2)];

  if (profile.dietPreference === "non-vegetarian" && !profile.allergies.includes("seafood")) {
    base.push("Mild chicken stew");
  }
  if (profile.goal === "protein-focus") {
    base.unshift("Moong dal", "Chole", "Besan cheela");
  }
  if (profile.allergies.includes("dairy")) {
    return [...new Set(base.filter((item) => !/paneer|curd|milk|raita/i.test(item)))].slice(0, 10);
  }
  return [...new Set(base)].slice(0, 10);
}

function nutritionBreakdown(profile: KidFuelChildProfile, tier: PlanTier): NutritionBreakdown {
  const proteinBoost = profile.goal === "protein-focus" || tier === "protein-focus";
  const dairyFree = profile.allergies.includes("dairy") || profile.challenges.includes("no-milk");
  return {
    protein: proteinBoost
      ? "45–55g daily (dal, chickpeas, eggs if allowed, millet cheela)"
      : "35–45g daily (dal, chickpeas, curd or dairy-free dal)",
    carbohydrates: "130–160g daily (rice, millet roti, idli, oats if tolerated)",
    healthyFats: "35–45g daily (ghee if tolerated, coconut, seeds)",
    fiber: "18–22g daily (vegetables, fruits, whole grains)",
    ironSources: "Spinach dal, ragi, dates, jaggery, sprouts",
    calciumSources: dairyFree
      ? "Ragi, sesame, leafy greens, fortified plant milk if used"
      : "Milk, curd, paneer, ragi, sesame",
    vitaminSources: "Seasonal fruits, carrots, citrus, amla, mixed vegetables",
  };
}

export function generateKidFuelMealPlan(
  profile: KidFuelChildProfile,
  tier: PlanTier = "complete-bundle"
): GeneratedMealPlan {
  const allergies = profile.allergies ?? [];
  const dislikedFoods = profile.dislikedFoods ?? [];
  const normalized: KidFuelChildProfile = { ...profile, allergies, dislikedFoods };
  const today = new Date();
  const recent = emptyRecent();
  const monthly = Array.from({ length: 30 }, (_, i) =>
    buildDay(normalized, addDays(today, i), i, recent)
  );
  const weekly = monthly.slice(0, 7);

  return {
    childName: profile.name,
    ageYears: profile.ageYears,
    gender: profile.gender,
    goal: profile.goal,
    foodStyle: profile.foodStyle,
    today: monthly[0],
    weekly,
    monthly,
    breakdown: nutritionBreakdown(normalized, tier),
    recommendedFoods: recommendedFoods(normalized),
  };
}

export { foodStyleLabel };
