import type { ChildGender, FoodAllergy, NutritionChallenge, NutritionGoal } from "@/types/kidfuel";

export class KidFuelApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = "KidFuelApiError";
  }
}

export type KidFuelProfileResponse = {
  child: {
    id: string;
    name: string;
    ageYears: number;
    gender: ChildGender;
    heightCm?: number;
    weightKg?: number;
    dietPreference?: string;
    foodStyle?: string;
    hasPaid: boolean;
    selectedPlan?: string;
    pdfEmailSent?: boolean;
    challenges?: NutritionChallenge[];
    goal?: NutritionGoal;
    allergies?: FoodAllergy[];
    dislikedFoods?: string[];
  } | null;
  analysis: {
    score: number;
    summary: string;
    improvements: { label: string; icon: string; status: "good" | "needs-work" }[];
  } | null;
};

export async function fetchKidFuelProfile(): Promise<KidFuelProfileResponse> {
  const res = await fetch("/api/kidfuel/onboarding");
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new KidFuelApiError(res.status, json.error ?? "Failed to load profile");
  }
  return json;
}
