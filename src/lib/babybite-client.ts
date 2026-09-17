import type {
  ChildGender,
  CookTime,
  DietPreference,
  FoodAllergy,
  FoodStyle,
  KitchenBudget,
  NutritionChallenge,
  NutritionGoal,
  RiceHabit,
  TiffinNeed,
} from "@/types/babybite";
import { ACTIVE_CHILD_KEY, rememberActiveChildId } from "@/lib/local-user-store";

export { ACTIVE_CHILD_KEY } from "@/lib/local-user-store";

export class BabyBiteApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = "BabyBiteApiError";
  }
}

export type BabyBiteChildSummary = {
  id: string;
  name: string;
  ageYears: number;
  gender: ChildGender;
  heightCm?: number;
  weightKg?: number;
  baselineHeightCm?: number;
  baselineWeightKg?: number;
  baselineNotedAt?: string;
  remeasuredAt?: string;
  dietPreference?: string;
  foodStyle?: string;
  hasPaid: boolean;
  selectedPlan?: string;
  pdfEmailSent?: boolean;
  challenges?: NutritionChallenge[];
  goal?: NutritionGoal;
  allergies?: FoodAllergy[];
  dislikedFoods?: string[];
  cookTime?: CookTime;
  kitchenBudget?: KitchenBudget;
  riceHabit?: RiceHabit;
  tiffinNeed?: TiffinNeed;
};

export type BabyBiteProfileResponse = {
  child: BabyBiteChildSummary | null;
  children?: BabyBiteChildSummary[];
  analysis: {
    score: number;
    summary: string;
    improvements: { label: string; icon: string; status: "good" | "needs-work" }[];
  } | null;
};

export function readActiveChildId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(ACTIVE_CHILD_KEY);
  } catch {
    return null;
  }
}

export function writeActiveChildId(id: string) {
  rememberActiveChildId(id);
}

export async function fetchBabyBiteProfile(childId?: string): Promise<BabyBiteProfileResponse> {
  const id = childId ?? readActiveChildId();
  const qs = id ? `?childId=${encodeURIComponent(id)}` : "";
  const res = await fetch(`/api/babybite/onboarding${qs}`);
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new BabyBiteApiError(res.status, json.error ?? "Failed to load profile");
  }
  if (json.child?.id) writeActiveChildId(json.child.id);
  return json;
}
