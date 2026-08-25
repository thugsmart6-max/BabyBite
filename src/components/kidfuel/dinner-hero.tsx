"use client";

import { useMemo, useState } from "react";
import { MEAL_SLOT_LABELS, type GeneratedMealPlan, type MealEntry, type MealSlot } from "@/types/kidfuel";
import { getMealFocus } from "@/lib/meal-goal-notes";
import { groceryForToday } from "@/lib/table-reading";
import { MealPack, MealShelf, type PackTone } from "@/components/kidfuel/oats-brand";
import { useMotherLocale } from "@/components/providers/locale-provider";
import { mealSlotCopy, type MotherCopyKey } from "@/lib/mother-copy";
import { translateKitchen } from "@/lib/kitchen-translate";
import { cn } from "@/lib/utils";

const SLOT_ORDER: MealSlot[] = ["breakfast", "morningSnack", "lunch", "eveningSnack", "dinner"];

const SLOT_TONE: Record<MealSlot, PackTone> = {
  breakfast: "sage",
  morningSnack: "pink",
  lunch: "cocoa",
  eveningSnack: "sky",
  dinner: "yellow",
};

const WEEK_TONE: PackTone[] = ["sage", "yellow", "pink", "sky", "cocoa", "forest", "cream"];

const FOCUS_KEY: Record<ReturnType<typeof getMealFocus>, MotherCopyKey> = {
  Iron: "focusIron",
  Calcium: "focusCalcium",
  Protein: "focusProtein",
  Fiber: "focusFiber",
  Energy: "focusEnergy",
};

export function DinnerHero({ plan }: { plan: GeneratedMealPlan }) {
  const { t, lang } = useMotherLocale();
  const dinner = plan.today.meals.find((meal) => meal.slot === "dinner") ?? plan.today.meals[0];
  if (!dinner) return null;

  const note = t(FOCUS_KEY[getMealFocus(dinner)]);
  const share = [
    `${t("tonight")} · ${plan.childName}`,
    translateKitchen(lang, dinner.name),
    "",
    "BabyBite",
  ].join("\n");

  return (
    <div className="os-hero-pack">
      <MealPack name={translateKitchen(lang, dinner.name)} slot={t("dinnerIs")} tone="yellow" size="lg" note={note} lift={false} />
      <a
        className="bb-cta"
        href={`https://wa.me/?text=${encodeURIComponent(share)}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        {t("whatsapp")}
      </a>
    </div>
  );
}

export function TodayShelf({ plan }: { plan: GeneratedMealPlan }) {
  const { t, lang } = useMotherLocale();
  const items = SLOT_ORDER.map((slot) => plan.today.meals.find((meal) => meal.slot === slot))
    .filter((meal): meal is MealEntry => Boolean(meal))
    .map((meal) => ({
      name: translateKitchen(lang, meal.name),
      slot: mealSlotCopy(lang, meal.slot),
      tone: SLOT_TONE[meal.slot],
      note: t(FOCUS_KEY[getMealFocus(meal)]),
    }));

  if (items.length === 0) return null;
  return <MealShelf items={items} lift={false} />;
}

export function WeekShelf({ plan }: { plan: GeneratedMealPlan }) {
  const { t, lang } = useMotherLocale();
  const items = plan.weekly.map((day, index) => {
    const dinner = day.meals.find((meal) => meal.slot === "dinner") ?? day.meals[0];
    return {
      name: translateKitchen(lang, dinner?.name ?? "—"),
      slot: translateKitchen(lang, day.dayLabel),
      tone: WEEK_TONE[index % WEEK_TONE.length],
      note: dinner ? t(FOCUS_KEY[getMealFocus(dinner)]) : undefined,
    };
  });

  if (items.length === 0) return null;
  return <MealShelf items={items} lift={false} />;
}

export function GroceryTicks({ plan }: { plan: GeneratedMealPlan }) {
  const { t, lang } = useMotherLocale();
  const items = useMemo(() => groceryForToday(plan), [plan]);
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  if (items.length === 0) return null;

  return (
    <div className="os-grocery">
      <p className="os-band-kicker">{t("grocery")}</p>
      <ul>
        {items.map((item) => (
          <li key={item}>
            <label className={cn("os-grocery-row", checked[item] && "is-done")}>
              <input
                type="checkbox"
                checked={Boolean(checked[item])}
                onChange={() => setChecked((prev) => ({ ...prev, [item]: !prev[item] }))}
              />
              {translateKitchen(lang, item)}
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function OtherMeals({ meals }: { meals: MealEntry[] }) {
  const rest = meals.filter((meal) => meal.slot !== "dinner");
  if (rest.length === 0) return null;
  return (
    <ul className="bb-other-meals">
      {rest.map((meal) => (
        <li key={meal.slot}>
          <span>{MEAL_SLOT_LABELS[meal.slot]}</span>
          {meal.name}
        </li>
      ))}
    </ul>
  );
}
