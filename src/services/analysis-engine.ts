import type {
  AnalysisImprovement,
  FoodStyle,
  KidFuelChildProfile,
  NutritionAnalysisResult,
  NutritionChallenge,
} from "@/types/kidfuel";
import { calmTableReading } from "@/lib/table-reading";

const IMPROVEMENT_AREAS = [
  { key: "protein", label: "Protein Intake", icon: "🥚" },
  { key: "diversity", label: "Meal Diversity", icon: "🥗" },
  { key: "calories", label: "Healthy Calorie Sources", icon: "🍚" },
  { key: "iron", label: "Iron Rich Foods", icon: "🥬" },
  { key: "vitamins", label: "Vitamin Sources", icon: "🍊" },
] as const;

function scoreFromChallenges(challenges: NutritionChallenge[]): number {
  let score = 82;
  const penalties: Record<NutritionChallenge, number> = {
    underweight: 8,
    "poor-appetite": 6,
    "picky-eater": 5,
    "no-vegetables": 4,
    "no-milk": 3,
    "low-energy": 4,
    "active-sports": 2,
  };
  for (const c of challenges) {
    score -= penalties[c] ?? 3;
  }
  return Math.max(52, Math.min(88, score));
}

function improvementStatus(
  key: string,
  challenges: NutritionChallenge[],
  goal: KidFuelChildProfile["goal"]
): "good" | "needs-work" {
  const needsWorkMap: Record<string, NutritionChallenge[]> = {
    protein: ["underweight", "poor-appetite", "active-sports"],
    diversity: ["picky-eater", "no-vegetables"],
    calories: ["underweight", "poor-appetite", "low-energy"],
    iron: ["low-energy", "poor-appetite"],
    vitamins: ["no-vegetables", "no-milk"],
  };
  if (goal === "protein-focus" && key === "protein") return "needs-work";
  if (goal === "food-variety" && key === "diversity") return "needs-work";
  const triggers = needsWorkMap[key] ?? [];
  return challenges.some((c) => triggers.includes(c)) ? "needs-work" : "good";
}

export function generateNutritionAnalysis(
  profile: KidFuelChildProfile
): NutritionAnalysisResult {
  const score = scoreFromChallenges(profile.challenges);
  const improvements: AnalysisImprovement[] = IMPROVEMENT_AREAS.map((area) => ({
    label: area.label,
    icon: area.icon,
    status: improvementStatus(area.key, profile.challenges, profile.goal),
  }));

  return { score, summary: calmTableReading(profile.name, improvements), improvements };
}

export function foodStyleLabel(style: FoodStyle): string {
  const labels: Record<FoodStyle, string> = {
    "south-indian": "South Indian",
    "north-indian": "North Indian",
    "mixed-indian": "Mixed Indian",
  };
  return labels[style];
}
