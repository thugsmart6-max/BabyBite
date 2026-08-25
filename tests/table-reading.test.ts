import { describe, expect, it } from "vitest";
import { calmTableReading, groceryForToday, whatsappTonightText } from "@/lib/table-reading";
import type { GeneratedMealPlan } from "@/types/kidfuel";

const plan: GeneratedMealPlan = {
  childName: "Rohan",
  goal: "healthy-nutrition",
  foodStyle: "south-indian",
  today: {
    date: "2026-08-20",
    dayLabel: "Thu",
    meals: [
      {
        slot: "breakfast",
        name: "Ragi dosa",
        description: "Ragi dosa with coconut chutney",
        caloriesApprox: 280,
      },
      {
        slot: "dinner",
        name: "Egg dosa",
        description: "Egg dosa with tomato chutney",
        caloriesApprox: 360,
      },
    ],
  },
  weekly: [],
  monthly: [],
  breakdown: {
    protein: "",
    carbohydrates: "",
    healthyFats: "",
    fiber: "",
    ironSources: "",
    calciumSources: "",
    vitaminSources: "",
  },
  recommendedFoods: ["Palak", "Eggs", "Curd"],
};

describe("calmTableReading", () => {
  it("names the child and a kitchen need, not a score", () => {
    const sentence = calmTableReading("Rohan", [
      { label: "Iron Rich Foods", status: "needs-work", icon: "🥬" },
    ]);
    expect(sentence).toContain("Rohan");
    expect(sentence).toContain("more iron this week");
    expect(sentence).not.toMatch(/\d{2}/);
  });

  it("stays calm when nothing needs work", () => {
    expect(calmTableReading("Meera")).toContain("Meera");
    expect(calmTableReading("Meera")).toContain("steady table");
  });
});

describe("groceryForToday", () => {
  it("returns a short tick list from the plan", () => {
    const items = groceryForToday(plan);
    expect(items).toEqual(expect.arrayContaining(["Palak", "Eggs", "Curd"]));
    expect(items.length).toBeLessThanOrEqual(8);
  });
});

describe("whatsappTonightText", () => {
  it("shares tonight’s dinner", () => {
    const text = whatsappTonightText(plan);
    expect(text).toContain("Rohan");
    expect(text).toContain("Egg dosa");
  });
});
