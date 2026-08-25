export type ChildGender = "male" | "female" | "other";

export type DietPreference = "vegetarian" | "eggetarian" | "non-vegetarian";

export type FoodStyle = "south-indian" | "north-indian" | "mixed-indian";

export type FoodAllergy = "dairy" | "nuts" | "eggs" | "gluten" | "soy" | "seafood";

export type NutritionChallenge =
  | "underweight"
  | "poor-appetite"
  | "picky-eater"
  | "no-vegetables"
  | "no-milk"
  | "low-energy"
  | "active-sports";

export type NutritionGoal =
  | "healthy-nutrition"
  | "better-eating-habits"
  | "protein-focus"
  | "balanced-meals"
  | "food-variety";

export type MealSlot =
  | "breakfast"
  | "morningSnack"
  | "lunch"
  | "eveningSnack"
  | "dinner";

export type PlanTier = "healthy-nutrition" | "protein-focus" | "complete-bundle";

export const MEAL_SLOT_LABELS: Record<MealSlot, string> = {
  breakfast: "Breakfast",
  morningSnack: "Morning Snack",
  lunch: "Lunch",
  eveningSnack: "Evening Snack",
  dinner: "Dinner",
};

export const MEAL_SLOT_INITIALS: Record<MealSlot, string> = {
  breakfast: "B",
  morningSnack: "MS",
  lunch: "L",
  eveningSnack: "E",
  dinner: "D",
};

export const CHALLENGE_LABELS: Record<NutritionChallenge, string> = {
  underweight: "Underweight",
  "poor-appetite": "Poor Appetite",
  "picky-eater": "Picky Eater",
  "no-vegetables": "Doesn't Like Vegetables",
  "no-milk": "Doesn't Drink Milk",
  "low-energy": "Low Energy",
  "active-sports": "Active Sports Child",
};

export const GOAL_LABELS: Record<NutritionGoal, string> = {
  "healthy-nutrition": "Healthy Nutrition",
  "better-eating-habits": "Better Eating Habits",
  "protein-focus": "Protein Focus",
  "balanced-meals": "Balanced Meals",
  "food-variety": "Improved Food Variety",
};

export const ALLERGY_LABELS: Record<FoodAllergy, string> = {
  dairy: "Dairy",
  nuts: "Tree nuts",
  eggs: "Eggs",
  gluten: "Gluten / wheat",
  soy: "Soy",
  seafood: "Fish / seafood",
};

export const PLAN_TIERS: Record<
  PlanTier,
  { name: string; price: number; description: string }
> = {
  "healthy-nutrition": {
    name: "Healthy Nutrition Plan",
    price: 129,
    description: "Balanced Indian plates, five meals a day, daily + weekly guidance",
  },
  "protein-focus": {
    name: "Protein Focus Plan",
    price: 139,
    description: "Dal, dairy, eggs or meat — growth-focused plates for ages 4–12",
  },
  "complete-bundle": {
    name: "Complete Nutrition Bundle",
    price: 159,
    description: "Full 30-day calendar, nutrition notes, and the fridge PDF",
  },
};

export interface KidFuelChildProfile {
  id: string;
  name: string;
  ageYears: number;
  gender: ChildGender;
  heightCm?: number;
  weightKg?: number;
  dietPreference: DietPreference;
  foodStyle: FoodStyle;
  challenges: NutritionChallenge[];
  goal: NutritionGoal;
  allergies: FoodAllergy[];
  dislikedFoods: string[];
}

export interface AnalysisImprovement {
  label: string;
  status: "good" | "needs-work";
  icon: string;
}

export interface NutritionAnalysisResult {
  score: number;
  summary: string;
  improvements: AnalysisImprovement[];
}

export interface MealEntry {
  slot: MealSlot;
  name: string;
  description: string;
  caloriesApprox: number;
  portionNote?: string;
}

export interface DailyPlan {
  date: string;
  dayLabel: string;
  meals: MealEntry[];
}

export interface NutritionBreakdown {
  protein: string;
  carbohydrates: string;
  healthyFats: string;
  fiber: string;
  ironSources: string;
  calciumSources: string;
  vitaminSources: string;
}

export interface GeneratedMealPlan {
  childName: string;
  ageYears?: number;
  gender?: ChildGender;
  goal: NutritionGoal;
  foodStyle: FoodStyle;
  today: DailyPlan;
  weekly: DailyPlan[];
  monthly: DailyPlan[];
  breakdown: NutritionBreakdown;
  recommendedFoods: string[];
}
