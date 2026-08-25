import type { AnalysisImprovement, GeneratedMealPlan, MealEntry } from "@/types/kidfuel";

const FOCUS: Record<string, string> = {
  "Protein Intake": "more protein on the plate this week",
  "Meal Diversity": "a little more variety at the table",
  "Healthy Calorie Sources": "steady energy through the school day",
  "Iron Rich Foods": "more iron this week",
  "Vitamin Sources": "more colour on the plate",
};

/** A kitchen sentence. Never a grade. */
export function calmTableReading(
  name: string,
  improvements: AnalysisImprovement[] = []
): string {
  const child = name.trim() || "Your child";
  const need = improvements.find((item) => item.status === "needs-work");
  if (!need) {
    return `${child} has a steady table. The meals stay in your kitchen — ages 4–12.`;
  }
  const focus = FOCUS[need.label] ?? "a gentler plate this month";
  return `${child} needs ${focus}. The plates follow that. Not a grade.`;
}

export function groceryForToday(plan: GeneratedMealPlan): string[] {
  const fromPlan = (plan.recommendedFoods ?? []).map((item) => item.trim()).filter(Boolean);
  if (fromPlan.length >= 4) return [...new Set(fromPlan)].slice(0, 8);

  const fromMeals = plan.today.meals.flatMap((meal) => groceryFromMeal(meal));
  return [...new Set([...fromPlan, ...fromMeals])].slice(0, 8);
}

const STAPLES: { match: RegExp; item: string }[] = [
  { match: /ragi/i, item: "Ragi flour" },
  { match: /idli|dosa|sambar/i, item: "Idli / dosa batter" },
  { match: /coconut/i, item: "Coconut" },
  { match: /oat/i, item: "Oats" },
  { match: /banana/i, item: "Bananas" },
  { match: /paneer/i, item: "Paneer" },
  { match: /dal|sambar|rajma/i, item: "Dal" },
  { match: /rice/i, item: "Rice" },
  { match: /fish/i, item: "Fish" },
  { match: /egg/i, item: "Eggs" },
  { match: /curd|yogurt/i, item: "Curd" },
  { match: /milk|smoothie/i, item: "Milk" },
  { match: /palak|spinach/i, item: "Palak" },
  { match: /tomato/i, item: "Tomatoes" },
  { match: /vegetable|veggie/i, item: "Mixed vegetables" },
];

function groceryFromMeal(meal: MealEntry): string[] {
  const text = `${meal.name} ${meal.description}`;
  return STAPLES.filter((row) => row.match.test(text)).map((row) => row.item);
}

export function whatsappTonightText(plan: GeneratedMealPlan): string {
  const dinner = plan.today.meals.find((meal) => meal.slot === "dinner");
  const plate = dinner?.name ?? plan.today.meals[0]?.name ?? "Tonight’s plate";
  return [
    `Tonight for ${plan.childName} (ages 4–12):`,
    plate,
    dinner?.description ?? "",
    "",
    "From BabyBite — Indian meals for the school-age table.",
  ]
    .filter(Boolean)
    .join("\n");
}
