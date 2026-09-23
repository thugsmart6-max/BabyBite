import type {
  BabyBiteChildProfile,
  MealSlot,
  NutritionChallenge,
} from "@/types/babybite";
import {
  AGE_BAND_LABELS,
  ALLERGY_LABELS,
  CHALLENGE_LABELS,
  GOAL_LABELS,
  ageBandForYears,
  kitchenFacts,
} from "@/types/babybite";
import type { MealTemplate } from "@/lib/data/babybite-meals";

const DIET_LABELS = {
  vegetarian: "Vegetarian",
  eggetarian: "Eggetarian",
  "non-vegetarian": "Non-vegetarian",
} as const;

const STYLE_LABELS = {
  "south-indian": "South Indian kitchen",
  "north-indian": "North Indian kitchen",
  "mixed-indian": "Mixed Indian kitchen",
} as const;

export function isDairyHeavy(meal: { name: string; description: string; allergens?: string[] }): boolean {
  if (meal.allergens?.includes("dairy")) return true;
  return /paneer|curd|raita|lassi|milk|smoothie|cheese|yogurt/i.test(`${meal.name} ${meal.description}`);
}

export function explainMealMatch(
  meal: MealTemplate,
  profile: BabyBiteChildProfile,
  slot: MealSlot
): string {
  const kitchen = kitchenFacts(profile);
  const challenges = profile.challenges ?? [];
  const reasons: string[] = [];

  if ((challenges.includes("picky-eater") || challenges.includes("poor-appetite")) && meal.tags.includes("kids-favourite")) {
    reasons.push("You marked picky eating — this is a plate children usually finish.");
  }
  if (challenges.includes("no-vegetables") && meal.tags.includes("hidden-veg")) {
    reasons.push("Vegetables are mixed in, because they refuse plain sabzi.");
  }
  if ((challenges.includes("no-milk") || profile.allergies.includes("dairy")) && !isDairyHeavy(meal)) {
    reasons.push("No milk or curd on this plate, as you asked.");
  }
  if (challenges.includes("underweight") && meal.caloriesApprox >= 300) {
    reasons.push("Higher-energy plate for catch-up eating.");
  }
  if ((challenges.includes("low-energy") || challenges.includes("active-sports")) && meal.goals.includes("protein-focus")) {
    reasons.push("Protein-forward, for the energy and sports you noted.");
  }
  if (kitchen.cookTime === "ten-min" && (meal.tags.includes("ten-min") || meal.minutes <= 10)) {
    reasons.push(`Ready in ${meal.minutes} minutes — you only have a short cook.`);
  }
  if (kitchen.kitchenBudget === "tight" && meal.tags.includes("budget")) {
    reasons.push("Uses pantry staples for a tight kitchen.");
  }
  if (kitchen.tiffinNeed === "school-lunch" && slot === "lunch" && meal.tags.includes("school-tiffin")) {
    reasons.push("Packs in a school box, from your tiffin answer.");
  }
  if (
    kitchen.riceHabit === "refuses-rice" &&
    (slot === "lunch" || slot === "dinner") &&
    meal.tags.includes("rice-free") &&
    !meal.tags.includes("rice-based")
  ) {
    reasons.push("No plated rice — you asked to skip rice.");
  }
  if (profile.allergies.length > 0 && !meal.allergens.some((item) => profile.allergies.includes(item))) {
    const labels = profile.allergies.map((item) => ALLERGY_LABELS[item]).join(", ");
    if (reasons.length < 2) reasons.push(`Kept off ${labels.toLowerCase()} from your allergy list.`);
  }
  if (meal.goals.includes(profile.goal) && reasons.length < 2) {
    reasons.push(`Chosen for your goal: ${GOAL_LABELS[profile.goal].toLowerCase()}.`);
  }
  if (profile.ageYears <= 5 && reasons.length < 2) {
    reasons.push("Softer serving for ages 4–5.");
  } else if (profile.ageYears >= 9 && reasons.length < 2) {
    reasons.push("Heartier plate for ages 9–12.");
  }

  return reasons.slice(0, 2).join(" ");
}

export function checklistSummary(profile: Pick<
  BabyBiteChildProfile,
  | "ageYears"
  | "dietPreference"
  | "foodStyle"
  | "challenges"
  | "goal"
  | "allergies"
  | "dislikedFoods"
  | "cookTime"
  | "kitchenBudget"
  | "riceHabit"
  | "tiffinNeed"
>): string {
  const kitchen = kitchenFacts(profile);
  const parts = [
    AGE_BAND_LABELS[ageBandForYears(profile.ageYears)],
    DIET_LABELS[profile.dietPreference],
    STYLE_LABELS[profile.foodStyle],
    GOAL_LABELS[profile.goal],
    ...(profile.challenges ?? []).map((item: NutritionChallenge) => CHALLENGE_LABELS[item]),
    kitchen.cookTime === "ten-min" ? "10-minute kitchen" : "Normal cook time",
    kitchen.kitchenBudget === "tight" ? "Tight budget" : null,
    kitchen.riceHabit === "refuses-rice" ? "No plated rice" : null,
    kitchen.tiffinNeed === "school-lunch" ? "School tiffin" : "Packable lunch",
    ...(profile.allergies ?? []).map((item) => `No ${ALLERGY_LABELS[item].toLowerCase()}`),
    ...(profile.dislikedFoods ?? []).filter(Boolean).map((item) => `Avoid ${item}`),
  ].filter(Boolean);

  return parts.join(" · ");
}
