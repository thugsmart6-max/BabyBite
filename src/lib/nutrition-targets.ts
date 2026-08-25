import type { ChildGender } from "@/types/kidfuel";

export type AgeGroup = "4-8" | "9-12";

export type NutritionTargetItem = {
  id: string;
  label: string;
  value: string;
  note?: string;
};

export type NutritionTargets = {
  ageGroup: AgeGroup;
  ageGroupLabel: string;
  items: NutritionTargetItem[];
};

export function getAgeGroup(ageYears: number): AgeGroup {
  if (ageYears <= 8) return "4-8";
  return "9-12";
}

export function getAgeGroupLabel(ageGroup: AgeGroup): string {
  return ageGroup === "4-8" ? "Ages 4–8 years" : "Ages 9–12 years";
}

export function getNutritionTargets(
  ageYears: number,
  gender: ChildGender = "male"
): NutritionTargets {
  const ageGroup = getAgeGroup(ageYears);

  if (ageGroup === "4-8") {
    return {
      ageGroup,
      ageGroupLabel: getAgeGroupLabel(ageGroup),
      items: [
        { id: "energy", label: "Energy", value: "1200–1800 kcal/day" },
        { id: "protein", label: "Protein", value: "~20 g/day" },
        {
          id: "carbs",
          label: "Carbohydrates",
          value: "130 g/day minimum",
          note: "45–65% of calories",
        },
        { id: "fat", label: "Fat", value: "25–35% of calories" },
        { id: "fiber", label: "Fiber", value: "~19 g/day", note: "Age + 5 rule (~9–13 g)" },
        { id: "iron", label: "Iron", value: "10 mg/day" },
        { id: "calcium", label: "Calcium", value: "1000 mg/day" },
        { id: "vitaminD", label: "Vitamin D", value: "600 IU/day" },
        { id: "vitaminA", label: "Vitamin A", value: "400–500 µg RAE/day" },
        { id: "zinc", label: "Zinc", value: "~5 mg/day" },
      ],
    };
  }

  const ironNote =
    gender === "female" ? "15 mg/day recommended for teenage girls" : undefined;

  return {
    ageGroup,
    ageGroupLabel: getAgeGroupLabel(ageGroup),
    items: [
      { id: "energy", label: "Energy", value: "1600–2400 kcal/day" },
      { id: "protein", label: "Protein", value: "~35 g/day" },
      {
        id: "carbs",
        label: "Carbohydrates",
        value: "130 g/day minimum",
        note: "45–65% of calories",
      },
      { id: "fat", label: "Fat", value: "25–35% of calories" },
      { id: "fiber", label: "Fiber", value: "~22–25 g/day", note: "Age + 5 rule (~14–17 g)" },
      { id: "iron", label: "Iron", value: "10 mg/day", note: ironNote },
      { id: "calcium", label: "Calcium", value: "1300 mg/day" },
      { id: "vitaminD", label: "Vitamin D", value: "600 IU/day" },
      { id: "vitaminA", label: "Vitamin A", value: "600–700 µg RAE/day" },
      { id: "zinc", label: "Zinc", value: "~8 mg/day" },
    ],
  };
}

/** Numeric daily targets for goal tracker progress (midpoints where ranges apply). */
export function getDailyTrackerTargets(ageYears: number, gender: ChildGender = "male") {
  const group = getAgeGroup(ageYears);
  const fiberAgeRule = ageYears + 5;

  if (group === "4-8") {
    return {
      energyKcal: 1500,
      proteinG: 20,
      carbsG: 130,
      fiberG: Math.max(19, fiberAgeRule),
      ironMg: 10,
      calciumMg: 1000,
      vitaminDIu: 600,
      vitaminAUg: 450,
      zincMg: 5,
    };
  }

  return {
    energyKcal: 2000,
    proteinG: 35,
    carbsG: 130,
    fiberG: Math.max(23, fiberAgeRule),
    ironMg: gender === "female" && ageYears >= 11 ? 15 : 10,
    calciumMg: 1300,
    vitaminDIu: 600,
    vitaminAUg: 650,
    zincMg: 8,
  };
}

export type GoalTrackerItem = {
  id: string;
  label: string;
  goalLabel: string;
  percent: number;
  currentLabel: string;
  targetLabel: string;
};
