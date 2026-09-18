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
import { ageBandForYears, kitchenFacts } from "@/types/babybite";
import { foodStyleLabel } from "@/services/analysis-engine";
import {
  ALLERGEN_FREE_FALLBACK,
  ALLERGEN_FREE_RICE_FREE_FALLBACK,
  BABYBITE_MEALS,
  type MealTemplate,
} from "@/lib/data/babybite-meals";
import { MEAL_ENGINE_VERSION, planNeedsRegeneration } from "@/lib/plan-variety";
import { checklistSummary, explainMealMatch, isDairyHeavy } from "@/lib/meal-rationale";

export { MEAL_ENGINE_VERSION, planNeedsRegeneration };
export { lunchLooksRepeated, planLooksStuck } from "@/lib/plan-variety";

const SLOTS: MealSlot[] = ["breakfast", "morningSnack", "lunch", "eveningSnack", "dinner"];
const LIST_SIZE = 8;
const RECENT_LIMIT: Record<MealSlot, number> = {
  breakfast: 20,
  morningSnack: 12,
  lunch: 24,
  eveningSnack: 12,
  dinner: 20,
};

function emptyRecent(): Record<MealSlot, string[]> {
  return { breakfast: [], morningSnack: [], lunch: [], eveningSnack: [], dinner: [] };
}

export function cloneRecent(seed?: Record<MealSlot, string[]>): Record<MealSlot, string[]> {
  const recent = emptyRecent();
  if (!seed) return recent;
  for (const slot of SLOTS) {
    recent[slot] = [...(seed[slot] ?? [])].slice(-RECENT_LIMIT[slot]);
  }
  return recent;
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
  if (profile.ageYears <= 5) factor = 0.85;
  else if (profile.ageYears >= 9) factor = 1.15;

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

function portionNote(profile: BabyBiteChildProfile, meal?: MealTemplate): string {
  const bits: string[] = [];
  if (profile.ageYears <= 5) bits.push("Smaller serving for ages 4–5");
  else if (profile.ageYears >= 9) bits.push("Heartier serving for ages 9–12");
  if (profile.challenges.includes("underweight")) bits.push("Offer a little more for catch-up energy");
  if (profile.challenges.includes("poor-appetite")) bits.push("Start small, then offer more if they eat");
  if (kitchenFacts(profile).cookTime === "ten-min" && meal && meal.minutes <= 10) {
    bits.push("Fits a 10-minute kitchen");
  }
  return bits[0] ?? "Standard school-age serving";
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

function mealFitsAge(meal: MealTemplate, ageYears: number): boolean {
  const bands = meal.ageBands?.length ? meal.ageBands : (["4-5", "6-8", "9-12"] as const);
  return bands.includes(ageBandForYears(ageYears));
}

function isWeekday(date: Date): boolean {
  const day = date.getDay();
  return day >= 1 && day <= 5;
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
  if (meal.goals.includes(profile.goal)) score += 6;
  if (kitchen.cookTime === "ten-min") {
    if (meal.tags.includes("ten-min") || meal.minutes <= 10) score += 8;
    else if (meal.minutes <= 20) score += 1;
    else score -= 2;
  }
  if (kitchen.kitchenBudget === "tight" && meal.tags.includes("budget")) score += 5;
  if (kitchen.tiffinNeed === "school-lunch" && slot === "lunch" && meal.tags.includes("school-tiffin")) {
    score += 10;
  }
  if (kitchen.riceHabit === "refuses-rice" && isRiceFree(meal)) score += 4;

  const challenges = profile.challenges ?? [];
  if (challenges.includes("picky-eater") || challenges.includes("poor-appetite")) {
    if (meal.tags.includes("kids-favourite")) score += 8;
    if (meal.tags.includes("ten-min") || meal.minutes <= 10) score += 3;
  }
  if (challenges.includes("no-vegetables")) {
    if (meal.tags.includes("hidden-veg")) score += 10;
    else score -= 3;
  }
  if (challenges.includes("underweight")) {
    if (meal.caloriesApprox >= 300) score += 7;
    if (meal.tags.includes("kids-favourite")) score += 3;
  }
  if (challenges.includes("no-milk") || profile.allergies.includes("dairy")) {
    if (isDairyHeavy(meal)) score -= 10;
    else score += 5;
  }
  if (challenges.includes("low-energy") || challenges.includes("active-sports")) {
    if (meal.goals.includes("protein-focus")) score += 6;
    if (meal.caloriesApprox >= 320) score += 3;
  }
  return score;
}

export function filterMealPool(
  profile: BabyBiteChildProfile,
  slot: MealSlot,
  options?: { ignoreStyle?: boolean; ignoreGoal?: boolean; ignoreRice?: boolean; ignoreAge?: boolean }
): MealTemplate[] {
  const kitchen = kitchenFacts(profile);
  return BABYBITE_MEALS.filter((meal) => {
    if (!meal.slots.includes(slot)) return false;
    if (!mealFitsDiet(meal, profile.dietPreference)) return false;
    if (!excludesAllergies(meal, profile)) return false;
    if (!excludesDislikes(meal, profile)) return false;
    if (!options?.ignoreAge && !mealFitsAge(meal, profile.ageYears)) return false;
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
  const preferred = scored.filter((item) => item.score >= best - 2);
  const keepCount = Math.min(scored.length, Math.max(24, preferred.length));
  return scored.slice(0, keepCount).map((item) => item.meal);
}

function resolvePool(
  profile: BabyBiteChildProfile,
  slot: MealSlot,
  options?: { tiffinOnly?: boolean }
): MealTemplate[] {
  const applyTiffin = (pool: MealTemplate[]) =>
    options?.tiffinOnly ? pool.filter((meal) => meal.tags.includes("school-tiffin")) : pool;

  const tight = applyTiffin(filterMealPool(profile, slot));
  if (tight.length >= 4) return rankPool(tight, profile, slot);
  const noGoal = applyTiffin(filterMealPool(profile, slot, { ignoreGoal: true }));
  if (noGoal.length >= 4) return rankPool(noGoal, profile, slot);
  const noStyle = applyTiffin(filterMealPool(profile, slot, { ignoreGoal: true, ignoreStyle: true }));
  if (noStyle.length > 0) return rankPool(noStyle, profile, slot);
  if (noGoal.length > 0) return rankPool(noGoal, profile, slot);
  if (tight.length > 0) return rankPool(tight, profile, slot);
  const noAge = applyTiffin(filterMealPool(profile, slot, { ignoreGoal: true, ignoreStyle: true, ignoreAge: true }));
  if (noAge.length > 0) return rankPool(noAge, profile, slot);
  if (options?.tiffinOnly) return resolvePool(profile, slot);
  return [fallbackMeal(profile)];
}

function uniqueByName(meals: MealTemplate[]): MealTemplate[] {
  const seen = new Set<string>();
  return meals.filter((meal) => {
    if (seen.has(meal.name)) return false;
    seen.add(meal.name);
    return true;
  });
}

function tiffinMeals(profile: BabyBiteChildProfile): MealTemplate[] {
  const tagged = (slot: MealSlot, ignoreStyle: boolean) =>
    filterMealPool(profile, slot, { ignoreGoal: true, ignoreStyle }).filter((meal) =>
      meal.tags.includes("school-tiffin")
    );

  let pool = uniqueByName([...tagged("lunch", false), ...tagged("breakfast", false)]);
  if (pool.length < 10) {
    pool = uniqueByName([...pool, ...tagged("lunch", true), ...tagged("breakfast", true)]);
  }
  return pool;
}

function slotPool(profile: BabyBiteChildProfile, slot: MealSlot, date?: Date): MealTemplate[] {
  const kitchen = kitchenFacts(profile);
  const tiffinLunch = kitchen.tiffinNeed === "school-lunch" && slot === "lunch" && (!date || isWeekday(date));
  if (!tiffinLunch) return resolvePool(profile, slot);

  const tiffin = tiffinMeals(profile);
  if (tiffin.length > 0) return rankPool(tiffin, profile, slot);
  return resolvePool(profile, slot);
}

function nameSalt(name: string): number {
  return name.split("").reduce((sum, ch, index) => sum + ch.charCodeAt(0) * (index + 3), 0);
}

function swapWhy(chosen: MealTemplate, swap: MealTemplate, profile: BabyBiteChildProfile): string {
  if (isRiceBased(chosen) && isRiceFree(swap)) return "If they refuse rice tonight";
  if (profile.challenges.includes("no-vegetables") && swap.tags.includes("hidden-veg")) {
    return "Vegetables stay hidden if they refuse the first plate";
  }
  if ((profile.challenges.includes("picky-eater") || profile.challenges.includes("poor-appetite")) && swap.tags.includes("kids-favourite")) {
    return "A familiar plate if they refuse this one";
  }
  if (swap.tags.includes("ten-min") || swap.minutes <= 10) return "Ready in 10 minutes";
  if (swap.tags.includes("budget")) return "Uses what is already in the box";
  if (swap.tags.includes("school-tiffin")) return "Travels in a tiffin";
  return "Another plate for this slot from your kitchen answers";
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
  if (ranked.length === 0) return [];
  const band = ranked.slice(0, Math.min(ranked.length, 10));
  const start = Math.abs(nameSalt(chosen.name)) % band.length;
  const picks: MealTemplate[] = [];
  for (let i = 0; i < band.length && picks.length < 2; i += 1) {
    const meal = band[(start + i) % band.length];
    if (picks.some((pick) => pick.name === meal.name)) continue;
    picks.push(meal);
  }
  return picks.map((meal) => ({
    name: meal.name,
    description: meal.description,
    why: swapWhy(chosen, meal, profile),
  }));
}

function toMealEntry(
  meal: MealTemplate,
  slot: MealSlot,
  profile: BabyBiteChildProfile,
  options?: { withSwaps?: boolean }
): MealEntry {
  const calories = Math.round(meal.caloriesApprox * calorieMultiplier(profile));
  const why = explainMealMatch(meal, profile, slot);
  return {
    slot,
    name: meal.name,
    description: meal.description,
    caloriesApprox: calories,
    portionNote: portionNote(profile, meal),
    whyThisPlate: why || undefined,
    minutes: meal.minutes,
    pantry: meal.pantry,
    tags: meal.tags,
    ...(options?.withSwaps ? { swaps: pickSwaps(meal, slot, profile) } : {}),
  };
}

function leastRecentFirst(pool: MealTemplate[], recent: string[]): MealTemplate[] {
  return [...pool].sort((a, b) => {
    const aIndex = recent.lastIndexOf(a.name);
    const bIndex = recent.lastIndexOf(b.name);
    if (aIndex !== bIndex) return aIndex - bIndex;
    return a.name.localeCompare(b.name);
  });
}

function pickFromPool(
  pool: MealTemplate[],
  usedNames: Set<string>,
  recentForSlot: string[],
  requireFresh: boolean
): MealTemplate | undefined {
  const notToday = pool.filter((meal) => !usedNames.has(meal.name));
  if (notToday.length === 0) return undefined;
  const fresh = notToday.filter((meal) => !recentForSlot.includes(meal.name));
  if (fresh.length > 0) return fresh[0];
  if (requireFresh) return undefined;
  const last = recentForSlot[recentForSlot.length - 1];
  const notLast = last ? notToday.filter((meal) => meal.name !== last) : notToday;
  return leastRecentFirst(notLast.length > 0 ? notLast : notToday, recentForSlot)[0];
}

export function pickMeal(
  profile: BabyBiteChildProfile,
  slot: MealSlot,
  _dayOffset: number,
  usedNames: Set<string>,
  recentForSlot: string[] = [],
  date?: Date
): MealEntry {
  const pools = [
    slotPool(profile, slot, date),
    rankPool(filterMealPool(profile, slot, { ignoreGoal: true }), profile, slot),
    rankPool(filterMealPool(profile, slot, { ignoreGoal: true, ignoreStyle: true }), profile, slot),
  ];
  if (kitchenFacts(profile).tiffinNeed === "school-lunch" && slot === "lunch") {
    pools.splice(1, 0, rankPool(
      filterMealPool(profile, slot, { ignoreGoal: true, ignoreStyle: true }).filter((meal) =>
        meal.tags.includes("school-tiffin")
      ),
      profile,
      slot
    ));
  }

  const monthUnique =
    slot === "breakfast" || slot === "lunch" || slot === "dinner" || slot === "morningSnack" || slot === "eveningSnack";

  let chosen: MealTemplate | undefined;
  for (const pool of pools) {
    chosen = pickFromPool(pool, usedNames, recentForSlot, monthUnique);
    if (chosen) break;
  }

  if (!chosen && monthUnique) {
    const extra = rankPool(
      filterMealPool(profile, slot, { ignoreGoal: true, ignoreStyle: true }),
      profile,
      slot
    );
    chosen = pickFromPool(extra, usedNames, recentForSlot, true);
  }

  if (!chosen) {
    for (const pool of pools) {
      chosen = pickFromPool(pool, usedNames, recentForSlot, false);
      if (chosen) break;
    }
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
      const entry = pickMeal(profile, slot, dayOffset, used, recent[slot], date);
      recent[slot] = [...recent[slot], entry.name].slice(-RECENT_LIMIT[slot]);
      return entry;
    }),
  };
}

function uniqueList(
  meals: MealTemplate[],
  slot: MealSlot,
  profile: BabyBiteChildProfile,
  limit = LIST_SIZE
): MealEntry[] {
  const seen = new Set<string>();
  const out: MealEntry[] = [];
  for (const meal of meals) {
    if (seen.has(meal.name)) continue;
    seen.add(meal.name);
    out.push(toMealEntry(meal, slot, profile));
    if (out.length >= limit) break;
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
    if (!mealFitsAge(meal, profile.ageYears)) return false;
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
      rankPool(tiffinMeals(profile), profile, "lunch"),
      "lunch",
      profile,
      16
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
  if (profile.challenges.includes("no-vegetables")) {
    base.unshift("Vegetable poha", "Masala dosa");
  }
  if (profile.challenges.includes("underweight")) {
    base.unshift("Banana almond smoothie", "Moong khichdi");
  }
  if (profile.allergies.includes("dairy") || profile.challenges.includes("no-milk")) {
    return [...new Set(base.filter((item) => !/paneer|curd|milk|raita|smoothie/i.test(item)))].slice(0, 10);
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
  tier: PlanTier = "complete-bundle",
  options?: { recentMealNames?: Record<MealSlot, string[]> }
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
  const recent = cloneRecent(options?.recentMealNames);
  const monthly = Array.from({ length: 30 }, (_, i) =>
    buildDay(normalized, addDays(today, i), i, recent)
  );
  const weekly = monthly.slice(0, 7);

  return {
    childName: profile.name,
    ageYears: profile.ageYears,
    ageBand: ageBandForYears(profile.ageYears),
    gender: profile.gender,
    goal: profile.goal,
    foodStyle: profile.foodStyle,
    dietPreference: profile.dietPreference,
    challenges: profile.challenges,
    allergies,
    dislikedFoods,
    cookTime: normalized.cookTime,
    kitchenBudget: normalized.kitchenBudget,
    riceHabit: normalized.riceHabit,
    tiffinNeed: normalized.tiffinNeed,
    checklistSummary: checklistSummary(normalized),
    today: monthly[0],
    weekly,
    monthly,
    breakdown: nutritionBreakdown(normalized, tier),
    recommendedFoods: recommendedFoods(normalized),
    kitchenLists: buildKitchenLists(normalized),
    recentMealNames: cloneRecent(recent),
  };
}

export { foodStyleLabel };
