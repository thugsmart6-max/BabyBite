import { describe, expect, it } from "vitest";
import { getMealSupportNote, computeWeeklyGoalProgress } from "@/lib/meal-goal-notes";
import type { DailyPlan, MealEntry } from "@/types/kidfuel";

const ironMeal: MealEntry = {
  slot: "breakfast",
  name: "Ragi Dosa",
  description: "Ragi dosa with iron-rich batter",
  caloriesApprox: 280,
};

describe("meal goal notes", () => {
  it("returns iron support note for iron-rich meals", () => {
    const note = getMealSupportNote(ironMeal, "healthy-nutrition");
    expect(note).toContain("iron");
  });

  it("returns calcium note for paneer meals", () => {
    const note = getMealSupportNote(
      {
        slot: "lunch",
        name: "Paneer Paratha",
        description: "Paneer paratha with curd for calcium",
        caloriesApprox: 350,
      },
      "protein-focus"
    );
    expect(note.toLowerCase()).toMatch(/calcium|protein/);
  });
});

describe("weekly goal progress", () => {
  const sampleDay: DailyPlan = {
    date: "2026-01-01",
    dayLabel: "Monday",
    meals: [
      ironMeal,
      {
        slot: "lunch",
        name: "Rajma Rice",
        description: "Rajma curry with rice",
        caloriesApprox: 380,
      },
      {
        slot: "dinner",
        name: "Curd Rice",
        description: "Curd rice with pickle",
        caloriesApprox: 270,
      },
      {
        slot: "morningSnack",
        name: "Fruit Bowl",
        description: "Seasonal fruits and vegetables",
        caloriesApprox: 200,
      },
      {
        slot: "eveningSnack",
        name: "Sprouts Chaat",
        description: "Sprouts with lemon",
        caloriesApprox: 180,
      },
    ],
  };

  const weekly = Array.from({ length: 7 }, (_, i) => ({
    ...sampleDay,
    date: `2026-01-0${i + 1}`,
    dayLabel: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i],
  }));

  it("returns progress items for key nutrients", () => {
    const progress = computeWeeklyGoalProgress(weekly, 7, "male");
    expect(progress.length).toBeGreaterThanOrEqual(8);
    expect(progress.find((p) => p.id === "protein")).toBeDefined();
    expect(progress.find((p) => p.id === "iron")?.percent).toBeGreaterThan(0);
  });
});
