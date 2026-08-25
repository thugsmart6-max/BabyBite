import { describe, expect, it } from "vitest";
import { generateNutritionAnalysis } from "@/services/analysis-engine";
import type { KidFuelChildProfile } from "@/types/kidfuel";

const baseProfile: KidFuelChildProfile = {
  id: "test-id",
  name: "Aanya",
  ageYears: 7,
  gender: "female",
  dietPreference: "vegetarian",
  foodStyle: "mixed-indian",
  challenges: ["picky-eater"],
  goal: "healthy-nutrition",
  allergies: [],
  dislikedFoods: [],
};

describe("generateNutritionAnalysis", () => {
  it("returns score, summary, and five improvement areas", () => {
    const result = generateNutritionAnalysis(baseProfile);
    expect(result.score).toBeGreaterThanOrEqual(52);
    expect(result.score).toBeLessThanOrEqual(88);
    expect(result.summary).toContain("Aanya");
    expect(result.improvements).toHaveLength(5);
  });

  it("lowers score with more challenges", () => {
    const mild = generateNutritionAnalysis(baseProfile);
    const heavy = generateNutritionAnalysis({
      ...baseProfile,
      challenges: ["underweight", "poor-appetite", "picky-eater", "no-vegetables"],
    });
    expect(heavy.score).toBeLessThan(mild.score);
  });

  it("marks protein as needs-work for protein-focus goal", () => {
    const result = generateNutritionAnalysis({
      ...baseProfile,
      goal: "protein-focus",
    });
    const protein = result.improvements.find((i) => i.label === "Protein Intake");
    expect(protein?.status).toBe("needs-work");
  });

  it("includes child name in summary", () => {
    const result = generateNutritionAnalysis({ ...baseProfile, name: "Rohan" });
    expect(result.summary).toMatch(/Rohan/);
  });
});
