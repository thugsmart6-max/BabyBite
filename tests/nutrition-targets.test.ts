import { describe, expect, it } from "vitest";
import {
  getAgeGroup,
  getNutritionTargets,
  getDailyTrackerTargets,
} from "@/lib/nutrition-targets";

describe("nutrition targets by age", () => {
  it("assigns ages 4–8 to younger group", () => {
    expect(getAgeGroup(4)).toBe("4-8");
    expect(getAgeGroup(8)).toBe("4-8");
  });

  it("assigns ages 9–12 to older group", () => {
    expect(getAgeGroup(9)).toBe("9-12");
    expect(getAgeGroup(12)).toBe("9-12");
  });

  it("returns younger daily targets with 1000 mg calcium", () => {
    const targets = getNutritionTargets(6, "male");
    const calcium = targets.items.find((i) => i.id === "calcium");
    expect(calcium?.value).toBe("1000 mg/day");
    expect(targets.items.find((i) => i.id === "protein")?.value).toBe("~20 g/day");
  });

  it("returns older daily targets with 1300 mg calcium", () => {
    const targets = getNutritionTargets(10, "male");
    expect(targets.items.find((i) => i.id === "calcium")?.value).toBe("1300 mg/day");
    expect(targets.items.find((i) => i.id === "protein")?.value).toBe("~35 g/day");
  });

  it("notes higher iron for older girls", () => {
    const targets = getNutritionTargets(11, "female");
    expect(targets.items.find((i) => i.id === "iron")?.note).toContain("teenage girls");
  });

  it("tracker targets scale with age group", () => {
    const young = getDailyTrackerTargets(7);
    const older = getDailyTrackerTargets(11, "male");
    expect(young.proteinG).toBe(20);
    expect(older.proteinG).toBe(35);
    expect(older.calciumMg).toBeGreaterThan(young.calciumMg);
  });
});
