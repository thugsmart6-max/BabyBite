import type { GeneratedMealPlan } from "@/types/babybite";
import { ageBandForYears } from "@/types/babybite";
import { motherCopy, type MotherCopyKey, type MotherLang } from "@/lib/mother-copy";

const GOAL_KEYS: Record<GeneratedMealPlan["goal"], MotherCopyKey> = {
  "healthy-nutrition": "goalHealthy",
  "better-eating-habits": "goalHabits",
  "protein-focus": "goalProtein",
  "balanced-meals": "goalBalance",
  "food-variety": "goalVariety",
};

const CHALLENGE_KEYS: Record<NonNullable<GeneratedMealPlan["challenges"]>[number], MotherCopyKey> = {
  underweight: "chUnder",
  "poor-appetite": "chAppetite",
  "picky-eater": "chPicky",
  "no-vegetables": "chVeg",
  "no-milk": "chMilk",
  "low-energy": "chEnergy",
  "active-sports": "chSports",
};

const ALLERGY_KEYS: Record<NonNullable<GeneratedMealPlan["allergies"]>[number], MotherCopyKey> = {
  dairy: "allergyDairy",
  nuts: "allergyNuts",
  eggs: "allergyEggs",
  gluten: "allergyGluten",
  soy: "allergySoy",
  seafood: "allergySeafood",
};

function plateAgeKey(ageYears: number): MotherCopyKey {
  const band = ageBandForYears(ageYears);
  if (band === "4-5") return "plateAges45";
  if (band === "6-8") return "plateAges68";
  return "plateAges912";
}

/** Client-side checklist line built from plan fields — always follows locale. */
export function checklistSummaryLocalized(lang: MotherLang, plan: GeneratedMealPlan): string {
  const parts: string[] = [];
  if (plan.ageYears != null) parts.push(motherCopy(lang, plateAgeKey(plan.ageYears)));
  if (plan.dietPreference === "eggetarian") parts.push(motherCopy(lang, "egg"));
  else if (plan.dietPreference === "non-vegetarian") parts.push(motherCopy(lang, "nonveg"));
  else if (plan.dietPreference) parts.push(motherCopy(lang, "veg"));
  if (plan.foodStyle === "south-indian") parts.push(motherCopy(lang, "south"));
  else if (plan.foodStyle === "north-indian") parts.push(motherCopy(lang, "north"));
  else parts.push(motherCopy(lang, "mixed"));
  parts.push(motherCopy(lang, GOAL_KEYS[plan.goal]));
  for (const c of plan.challenges ?? []) {
    parts.push(motherCopy(lang, CHALLENGE_KEYS[c]));
  }
  if (plan.cookTime === "ten-min") parts.push(motherCopy(lang, "cookTenMin"));
  else if (plan.cookTime) parts.push(motherCopy(lang, "cookNormal"));
  if (plan.kitchenBudget === "tight") parts.push(motherCopy(lang, "budgetTight"));
  if (plan.riceHabit === "refuses-rice") parts.push(motherCopy(lang, "riceRefuses"));
  if (plan.tiffinNeed === "school-lunch") parts.push(motherCopy(lang, "tiffinSchool"));
  else if (plan.tiffinNeed) parts.push(motherCopy(lang, "packableLunch"));
  for (const a of plan.allergies ?? []) {
    parts.push(`${motherCopy(lang, "allergyNoPrefix")} ${motherCopy(lang, ALLERGY_KEYS[a])}`);
  }
  for (const item of plan.dislikedFoods ?? []) {
    if (item.trim()) parts.push(`${motherCopy(lang, "avoidFood")} ${item.trim()}`);
  }
  return parts.filter(Boolean).join(" · ");
}
