import { addDays, format } from "date-fns";
import type {
  DailyPlan,
  DietPreference,
  GeneratedMealPlan,
  BabyBiteChildProfile,
  KitchenLists,
  MealEntry,
  MealSlot,
  MealSwap,
  NutritionBreakdown,
  PlanTier,
} from "@/types/babybite";
import { kitchenFacts } from "@/types/babybite";
import { foodStyleLabel } from "@/services/analysis-engine";
import {
  ALLERGEN_FREE_FALLBACK,
  ALLERGEN_FREE_RICE_FREE_FALLBACK,
  BABYBITE_MEALS,
  type MealTemplate,
} from "@/lib/data/babybite-meals";
import { MEAL_ENGINE_VERSION, planNeedsRegeneration } from "@/lib/plan-variety";

export { MEAL_ENGINE_VERSION, planNeedsRegeneration };
export { planLooksStuck } from "@/lib/plan-variety";

const SLOTS: MealSlot[] = ["breakfast", "morningSnack", "lunch", "eveningSnack", "dinner"];
const LIST_SIZE = 8;

function emptyRecent(): Record<MealSlot, string[]> {
  return { breakfast: [], morningSnack: [], lunch: [], eveningSnack: [], dinner: [] };
}

function fallbackMeal(profile: BabyBiteChildProfile): MealTemplate {
  return kitchenFacts(profile).riceHabit === "refuses-rice"
    ? ALLERGEN_FREE_RICE_FREE_FALLBACK
    : ALLERGEN_FREE_FALLBACK;
}

function isRiceBased(meal: MealTemplate): boolean {
  return meal.tags.includes("rice-based");
}

function isRiceFree(meal: MealTemplate): boolean {
  return meal.tags.includes("rice-free") && !isRiceBased(meal);
}

function calorieMultiplier(profile: BabyBiteChildProfile): number {
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

function portionNote(profile: BabyBiteChildProfile): string {
  if (profile.ageYears <= 6) return "Smaller serving for ages 4–6";
  if (profile.ageYears >= 10) return "Heartier serving for ages 10–12";
  if (profile.challenges.includes("underweight")) return "Offer a slightly larger portion for catch-up energy";
  return "Standard school-age serving";
}

function excludesAllergies(meal: MealTemplate, profile: BabyBiteChildProfile): boolean {
  const allergies = profile.allergies ?? [];
  if (allergies.length === 0) return true;
  return !meal.allergens.some((allergen) => allergies.includes(allergen));
}

function excludesDislikes(meal: MealTemplate, profile: BabyBiteChildProfile): boolean {
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

export function kitchenScore(meal: MealTemplate, profile: BabyBiteChildProfile, slot: MealSlot): number {
  const kitchen = kitchenFacts(profile);
  if (kitchen.riceHabit === "refuses-rice" && isRiceBased(meal)) return -1000;

  let score = 0;
  if (kitchen.cookTime === "ten-min") {
    if (meal.tags.includes("ten-min") || meal.minutes <= 10) score += 4;
    else if (meal.minutes <= 20) score += 1;
  }
  if (kitchen.kitchenBudget === "tight" && meal.tags.includes("budget")) score += 3;
  if (kitchen.tiffinNeed === "school-lunch" && slot === "lunch" && meal.tags.includes("school-tiffin")) {
    score += 4;
  }
  if (kitchen.riceHabit === "refuses-rice" && isRiceFree(meal)) score += 2;
  return score;
}

export function filterMealPool(
  profile: BabyBiteChildProfile,
  slot: MealSlot,
  options?: { ignoreStyle?: boolean; ignoreGoal?: boolean; ignoreRice?: boolean }
): MealTemplate[] {
  const kitchen = kitchenFacts(profile);
  return BABYBITE_MEALS.filter((meal) => {
    if (!meal.slots.includes(slot)) return false;
    if (!mealFitsDiet(meal, profile.dietPreference)) return false;
    if (!excludesAllergies(meal, profile)) return false;
    if (!excludesDislikes(meal, profile)) return false;
    if (!options?.ignoreRice && kitchen.riceHabit === "refuses-rice" && isRiceBased(meal)) return false;
    if (!options?.ignoreStyle) {
      const styleOk =
        profile.foodStyle === "mixed-indian" || meal.styles.includes(profile.foodStyle);
      if (!styleOk) return false;
    }
    if (!options?.ignoreGoal && !meal.goals.includes(profile.goal)) return false;
    return true;
  });
}

function rankPool(pool: MealTemplate[], profile: BabyBiteChildProfile, slot: MealSlot): MealTemplate[] {
  if (pool.length === 0) return pool;
  const scored = pool
    .map((meal) => ({ meal, score: kitchenScore(meal, profile, slot) }))
    .filter((item) => item.score > -500)
    .sort((a, b) => b.score - a.score || a.meal.name.localeCompare(b.meal.name));
  if (scored.length === 0) return pool;
  const best = scored[0].score;
  const top = scored.filter((item) => item.score >= best - 1).map((item) => item.meal);
  return top.length > 0 ? top : scored.map((item) => item.meal);
}

function resolvePool(profile: BabyBiteChildProfile, slot: MealSlot): MealTemplate[] {
  const tight = filterMealPool(profile, slot);
  if (tight.length >= 5) return rankPool(tight, profile, slot);
  const noGoal = filterMealPool(profile, slot, { ignoreGoal: true });
  if (noGoal.length >= 4) return rankPool(noGoal, profile, slot);
  const noStyle = filterMealPool(profile, slot, { ignoreGoal: true, ignoreStyle: true });
  if (noStyle.length > 0) return rankPool(noStyle, profile, slot);
  if (noGoal.length > 0) return rankPool(noGoal, profile, slot);
  if (tight.length > 0) return rankPool(tight, profile, slot);
  return [fallbackMeal(profile)];
}

function swapWhy(chosen: MealTemplate, swap: MealTemplate): string {
  if (isRiceBased(chosen) && isRiceFree(swap)) return "If they refuse rice tonight";
  if (swap.tags.includes("ten-min") || swap.minutes <= 10) return "Ready in 10 minutes";
  if (swap.tags.includes("budget")) return "Uses what is already in the box";
  if (swap.tags.includes("school-tiffin")) return "Travels in a tiffin";
  return "Another plate for this slot";
}

export function pickSwaps(
  chosen: MealTemplate,
  slot: MealSlot,
  profile: BabyBiteChildProfile
): MealSwap[] {
  let pool = filterMealPool(profile, slot, { ignoreGoal: true }).filter((meal) => meal.name !== chosen.name);
  if (isRiceBased(chosen)) {
    const riceFree = pool.filter(isRiceFree);
    if (riceFree.length > 0) pool = riceFree;
  }
  const ranked = rankPool(pool, profile, slot);
  const seen = new Set<string>();
  const picks: MealTemplate[] = [];
  for (const meal of ranked) {
    if (seen.has(meal.name)) continue;
    seen.add(meal.name);
    picks.push(meal);
    if (picks.length === 2) break;
  }
  return picks.map((meal) => ({
    name: meal.name,
    description: meal.description,
    why: swapWhy(chosen, meal),
  }));
}

function toMealEntry(
  meal: MealTemplate,
  slot: MealSlot,
  profile: BabyBiteChildProfile,
  options?: { withSwaps?: boolean }
): MealEntry {
  const calories = Math.round(meal.caloriesApprox * calorieMultiplier(profile));
  return {
    slot,
    name: meal.name,
    description: meal.description,
    caloriesApprox: calories,
    portionNote: portionNote(profile),
    minutes: meal.minutes,
    pantry: meal.pantry,
    tags: meal.tags,
    ...(options?.withSwaps ? { swaps: pickSwaps(meal, slot, profile) } : {}),
  };
}

export function pickMeal(
  profile: BabyBiteChildProfile,
  slot: MealSlot,
  dayOffset: number,
  usedNames: Set<string>,
  recentForSlot: string[] = []
): MealEntry {
  const pools = [
    resolvePool(profile, slot),
    rankPool(filterMealPool(profile, slot, { ignoreGoal: true }), profile, slot),
    rankPool(filterMealPool(profile, slot, { ignoreGoal: true, ignoreStyle: true }), profile, slot),
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

  const meal = chosen ?? fallbackMeal(profile);
  usedNames.add(meal.name);
  return toMealEntry(meal, slot, profile, { withSwaps: true });
}

function buildDay(
  profile: BabyBiteChildProfile,
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

function uniqueList(
  meals: MealTemplate[],
  slot: MealSlot,
  profile: BabyBiteChildProfile
): MealEntry[] {
  const seen = new Set<string>();
  const out: MealEntry[] = [];
  for (const meal of meals) {
    if (seen.has(meal.name)) continue;
    seen.add(meal.name);
    out.push(toMealEntry(meal, slot, profile));
    if (out.length >= LIST_SIZE) break;
  }
  return out;
}

function catalogFor(profile: BabyBiteChildProfile, slot?: MealSlot): MealTemplate[] {
  const kitchen = kitchenFacts(profile);
  return BABYBITE_MEALS.filter((meal) => {
    if (slot && !meal.slots.includes(slot)) return false;
    if (!mealFitsDiet(meal, profile.dietPreference)) return false;
    if (!excludesAllergies(meal, profile)) return false;
    if (!excludesDislikes(meal, profile)) return false;
    if (kitchen.riceHabit === "refuses-rice" && isRiceBased(meal)) return false;
    if (profile.foodStyle !== "mixed-indian" && !meal.styles.includes(profile.foodStyle)) return false;
    return true;
  });
}

export function buildKitchenLists(profile: BabyBiteChildProfile): KitchenLists {
  const breakfast = uniqueList(
    rankPool(catalogFor(profile, "breakfast"), profile, "breakfast"),
    "breakfast",
    profile
  );
  const lunch = uniqueList(rankPool(catalogFor(profile, "lunch"), profile, "lunch"), "lunch", profile);
  const dinner = uniqueList(rankPool(catalogFor(profile, "dinner"), profile, "dinner"), "dinner", profile);
  const snackPool = [
    ...catalogFor(profile, "eveningSnack"),
    ...catalogFor(profile, "morningSnack"),
  ];
  const snacks = uniqueList(rankPool(snackPool, profile, "eveningSnack"), "eveningSnack", profile);

  const byTag = (tag: MealTemplate["tags"][number], slot: MealSlot) =>
    uniqueList(
      rankPool(
        catalogFor(profile).filter((meal) => meal.tags.includes(tag)),
        profile,
        slot
      ),
      slot,
      profile
    );

  return {
    breakfast,
    lunch,
    dinner,
    snacks,
    tenMin: uniqueList(
      rankPool(
        catalogFor(profile).filter((meal) => meal.tags.includes("ten-min") || meal.minutes <= 10),
        profile,
        "eveningSnack"
      ),
      "eveningSnack",
      profile
    ),
    budget: byTag("budget", "lunch"),
    schoolLunch: uniqueList(
      rankPool(
        catalogFor(profile, "lunch").filter((meal) => meal.tags.includes("school-tiffin")),
        profile,
        "lunch"
      ),
      "lunch",
      profile
    ),
    kidsFavourite: byTag("kids-favourite", "dinner"),
    riceFree: uniqueList(
      rankPool(catalogFor(profile).filter(isRiceFree), profile, "lunch"),
      "lunch",
      profile
    ),
    homemadeSnacks: uniqueList(
      rankPool(
        catalogFor(profile).filter((meal) => meal.tags.includes("homemade-snack")),
        profile,
        "eveningSnack"
      ),
      "eveningSnack",
      profile
    ),
  };
}

function recommendedFoods(profile: BabyBiteChildProfile): string[] {
  const kitchen = kitchenFacts(profile);
  const south = kitchen.riceHabit === "refuses-rice"
    ? ["Ragi dosa", "Idli", "Sambar", "Vegetable poha", "Masala dosa"]
    : ["Ragi dosa", "Idli", "Sambar", "Lemon rice", "Masala dosa"];
  const north = kitchen.riceHabit === "refuses-rice"
    ? ["Vegetable dalia khichdi", "Bajra roti", "Mixed veg paratha", "Besan cheela", "Phulka"]
    : ["Moong khichdi", "Rajma rice", "Vegetable pulao", "Besan cheela", "Palak dal"];
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
  if (kitchen.cookTime === "ten-min") {
    base.unshift("Roasted chana", "Seasonal fruit bowl");
  }
  if (profile.allergies.includes("dairy")) {
    return [...new Set(base.filter((item) => !/paneer|curd|milk|raita/i.test(item)))].slice(0, 10);
  }
  return [...new Set(base)].slice(0, 10);
}

function nutritionBreakdown(profile: BabyBiteChildProfile, tier: PlanTier): NutritionBreakdown {
  const proteinBoost = profile.goal === "protein-focus" || tier === "protein-focus";
  const dairyFree = profile.allergies.includes("dairy") || profile.challenges.includes("no-milk");
  const riceFree = kitchenFacts(profile).riceHabit === "refuses-rice";
  return {
    protein: proteinBoost
      ? "45–55g daily (dal, chickpeas, eggs if allowed, millet cheela)"
      : "35–45g daily (dal, chickpeas, curd or dairy-free dal)",
    carbohydrates: riceFree
      ? "130–160g daily (roti, millet, idli, poha, oats if tolerated)"
      : "130–160g daily (rice, millet roti, idli, oats if tolerated)",
    healthyFats: "35–45g daily (ghee if tolerated, coconut, seeds)",
    fiber: "18–22g daily (vegetables, fruits, whole grains)",
    ironSources: "Spinach dal, ragi, dates, jaggery, sprouts",
    calciumSources: dairyFree
      ? "Ragi, sesame, leafy greens, fortified plant milk if used"
      : "Milk, curd, paneer, ragi, sesame",
    vitaminSources: "Seasonal fruits, carrots, citrus, amla, mixed vegetables",
  };
}

export function generateBabyBiteMealPlan(
  profile: BabyBiteChildProfile,
  tier: PlanTier = "complete-bundle"
): GeneratedMealPlan {
  const allergies = profile.allergies ?? [];
  const dislikedFoods = profile.dislikedFoods ?? [];
  const normalized: BabyBiteChildProfile = {
    ...profile,
    allergies,
    dislikedFoods,
    ...kitchenFacts(profile),
  };
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
    kitchenLists: buildKitchenLists(normalized),
  };
}

export { foodStyleLabel };
