import type { ChildGender, DailyPlan, MealEntry, NutritionGoal } from "@/types/kidfuel";
import {
  getDailyTrackerTargets,
  type GoalTrackerItem,
} from "@/lib/nutrition-targets";

function mealText(meal: MealEntry): string {
  return `${meal.name} ${meal.description}`.toLowerCase();
}

function countKeywordHits(text: string, keywords: string[]): number {
  return keywords.filter((k) => text.includes(k)).length;
}

function dayNutrientScore(day: DailyPlan, keywords: string[]): number {
  let hits = 0;
  for (const meal of day.meals) {
    hits += countKeywordHits(mealText(meal), keywords);
  }
  return Math.min(hits, 4);
}

const KEYWORDS = {
  protein: ["dal", "paneer", "egg", "chicken", "fish", "rajma", "moong", "nut", "almond", "protein", "tikka"],
  carbs: ["rice", "roti", "idli", "dosa", "oats", "pulao", "paratha", "dalia", "upma", "bread", "khichdi"],
  fiber: ["vegetable", "veggie", "fruit", "salad", "sprout", "ragi", "poriyal", "fiber", "whole"],
  iron: ["ragi", "spinach", "dal", "sprout", "date", "jaggery", "iron", "rajma"],
  calcium: ["milk", "curd", "paneer", "ragi", "sesame", "yogurt", "dosa", "cheese", "calcium"],
  vitaminD: ["milk", "egg", "fish", "curd", "sun", "fortified"],
  vitaminA: ["carrot", "mango", "papaya", "vegetable", "fruit", "amla", "sweet potato", "palak", "spinach"],
};

function percentFromScore(score: number, maxPerWeek: number): number {
  return Math.min(100, Math.round((score / maxPerWeek) * 100));
}

export function computeWeeklyGoalProgress(
  weekly: DailyPlan[],
  ageYears: number,
  gender: ChildGender = "male"
): GoalTrackerItem[] {
  const targets = getDailyTrackerTargets(ageYears, gender);
  const days = weekly.length || 1;

  const avgCalories =
    weekly.reduce((sum, d) => sum + d.meals.reduce((s, m) => s + m.caloriesApprox, 0), 0) / days;

  const proteinScore = weekly.reduce((s, d) => s + dayNutrientScore(d, KEYWORDS.protein), 0);
  const carbsScore = weekly.reduce((s, d) => s + dayNutrientScore(d, KEYWORDS.carbs), 0);
  const fiberScore = weekly.reduce((s, d) => s + dayNutrientScore(d, KEYWORDS.fiber), 0);
  const ironScore = weekly.reduce((s, d) => s + dayNutrientScore(d, KEYWORDS.iron), 0);
  const calciumScore = weekly.reduce((s, d) => s + dayNutrientScore(d, KEYWORDS.calcium), 0);
  const vitDScore = weekly.reduce((s, d) => s + dayNutrientScore(d, KEYWORDS.vitaminD), 0);
  const vitAScore = weekly.reduce((s, d) => s + dayNutrientScore(d, KEYWORDS.vitaminA), 0);

  const estProteinG = Math.round((proteinScore / (days * 4)) * targets.proteinG * 1.15);
  const estCarbsG = Math.round((carbsScore / (days * 4)) * targets.carbsG * 1.1);
  const estFiberG = Math.round((fiberScore / (days * 4)) * targets.fiberG * 1.1);

  return [
    {
      id: "energy",
      label: "Energy",
      goalLabel: "Meet daily calorie needs for active growth",
      percent: percentFromScore(avgCalories, targets.energyKcal),
      currentLabel: `~${Math.round(avgCalories)} kcal/day avg`,
      targetLabel: `${targets.energyKcal} kcal/day (mid-range)`,
    },
    {
      id: "protein",
      label: "Protein",
      goalLabel: "Cover daily protein for muscle & growth",
      percent: percentFromScore(estProteinG, targets.proteinG),
      currentLabel: `~${estProteinG} g/day est.`,
      targetLabel: `${targets.proteinG} g/day`,
    },
    {
      id: "carbs",
      label: "Carbohydrates",
      goalLabel: "Reach 130 g+ carbs daily for steady energy",
      percent: percentFromScore(estCarbsG, targets.carbsG),
      currentLabel: `~${estCarbsG} g/day est.`,
      targetLabel: `${targets.carbsG} g/day minimum`,
    },
    {
      id: "fiber",
      label: "Fiber",
      goalLabel: "Hit fiber target for digestion & fullness",
      percent: percentFromScore(estFiberG, targets.fiberG),
      currentLabel: `~${estFiberG} g/day est.`,
      targetLabel: `${targets.fiberG} g/day`,
    },
    {
      id: "iron",
      label: "Iron",
      goalLabel: "Cover 100% of iron needs across the week",
      percent: percentFromScore(ironScore, days * 2),
      currentLabel: `${ironScore} iron-rich meals this week`,
      targetLabel: `${targets.ironMg} mg/day`,
    },
    {
      id: "calcium",
      label: "Calcium",
      goalLabel: "Support bone strength with daily calcium",
      percent: percentFromScore(calciumScore, days * 2),
      currentLabel: `${calciumScore} calcium-rich meals this week`,
      targetLabel: `${targets.calciumMg} mg/day`,
    },
    {
      id: "vitaminD",
      label: "Vitamin D",
      goalLabel: "Include vitamin D sources regularly",
      percent: percentFromScore(vitDScore, days * 1.5),
      currentLabel: `${vitDScore} D-friendly meals this week`,
      targetLabel: `${targets.vitaminDIu} IU/day`,
    },
    {
      id: "vitaminA",
      label: "Vitamin A",
      goalLabel: "Boost immunity with vitamin A foods",
      percent: percentFromScore(vitAScore, days * 2),
      currentLabel: `${vitAScore} vitamin A meals this week`,
      targetLabel: `${targets.vitaminAUg} µg RAE/day`,
    },
  ];
}

export function getMealSupportNote(meal: MealEntry, goal: NutritionGoal): string {
  const text = mealText(meal);

  if (countKeywordHits(text, KEYWORDS.iron)) {
    return "Supports iron needs for growth and energy";
  }
  if (countKeywordHits(text, KEYWORDS.calcium)) {
    return "Helps achieve calcium target for bone strength";
  }
  if (countKeywordHits(text, KEYWORDS.protein)) {
    return "Builds protein toward your child's daily muscle-growth target";
  }
  if (countKeywordHits(text, KEYWORDS.fiber)) {
    return "Adds fiber to meet digestion and fullness goals";
  }
  if (countKeywordHits(text, KEYWORDS.vitaminA)) {
    return "Supports vitamin A for immunity and healthy vision";
  }
  if (countKeywordHits(text, KEYWORDS.carbs)) {
    return "Provides steady carbohydrates for active days";
  }

  const goalNotes: Record<NutritionGoal, string> = {
    "healthy-nutrition": "Balanced choice aligned with your healthy nutrition goal",
    "better-eating-habits": "Easy, kid-friendly meal to build consistent eating habits",
    "protein-focus": "Contributes to your protein-focused growth plan",
    "balanced-meals": "Part of a balanced plate for the day",
    "food-variety": "Adds variety to expand your child's food preferences",
  };

  return goalNotes[goal];
}

export function getMealFocus(meal: MealEntry): "Iron" | "Calcium" | "Protein" | "Fiber" | "Energy" {
  const text = mealText(meal);
  if (countKeywordHits(text, KEYWORDS.iron)) return "Iron";
  if (countKeywordHits(text, KEYWORDS.calcium)) return "Calcium";
  if (countKeywordHits(text, KEYWORDS.protein)) return "Protein";
  if (countKeywordHits(text, KEYWORDS.fiber)) return "Fiber";
  return "Energy";
}

export function getEmotionalMealNote(meal: MealEntry, childName: string, goal: NutritionGoal): string {
  const focus = getMealFocus(meal);
  const notes: Record<typeof focus, string> = {
    Iron: `Iron for ${childName}'s energy through a school day — not a lecture, a plate.`,
    Calcium: `Calcium for the years ${childName}'s bones are still adding length.`,
    Protein: `Protein so growth has something to build with, meal after meal.`,
    Fiber: `Vegetables ${childName} can actually finish — variety without a fight.`,
    Energy: `Steady food for a body that is still growing, ages 4–12.`,
  };
  return notes[focus] || getMealSupportNote(meal, goal);
}

export function getWeeklyDisplayMeals(day: DailyPlan): {
  slot: string;
  label: string;
  meals: MealEntry[];
}[] {
  const bySlot = Object.fromEntries(day.meals.map((m) => [m.slot, m])) as Partial<
    Record<MealEntry["slot"], MealEntry>
  >;

  const snacks = day.meals.filter(
    (m) => m.slot === "morningSnack" || m.slot === "eveningSnack"
  );

  return [
    { slot: "breakfast", label: "Breakfast", meals: bySlot.breakfast ? [bySlot.breakfast] : [] },
    { slot: "lunch", label: "Lunch", meals: bySlot.lunch ? [bySlot.lunch] : [] },
    { slot: "dinner", label: "Dinner", meals: bySlot.dinner ? [bySlot.dinner] : [] },
    { slot: "snacks", label: "Snacks", meals: snacks },
  ].filter((row) => row.meals.length > 0);
}
