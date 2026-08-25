"use client";

import { useState } from "react";
import type { DailyPlan, GeneratedMealPlan, MealEntry } from "@/types/kidfuel";
import { getMealFocus } from "@/lib/meal-goal-notes";
import { useMotherLocale } from "@/components/providers/locale-provider";
import { mealSlotCopy, type MotherCopyKey } from "@/lib/mother-copy";
import { translateKitchen } from "@/lib/kitchen-translate";
import { cn } from "@/lib/utils";

type Room = "today" | "weekly" | "monthly";

const ROOMS: { id: Room; key: MotherCopyKey }[] = [
  { id: "today", key: "roomToday" },
  { id: "weekly", key: "roomWeek" },
  { id: "monthly", key: "roomMonth" },
];

const FOCUS_KEY: Record<ReturnType<typeof getMealFocus>, MotherCopyKey> = {
  Iron: "focusIron",
  Calcium: "focusCalcium",
  Protein: "focusProtein",
  Fiber: "focusFiber",
  Energy: "focusEnergy",
};

const SLOT_ORDER = ["breakfast", "morningSnack", "lunch", "eveningSnack", "dinner"] as const;

export function ResultsFolder({
  plan,
  room,
  onRoom,
}: {
  plan: GeneratedMealPlan;
  room: Room;
  onRoom: (room: Room) => void;
}) {
  const { t } = useMotherLocale();

  return (
    <div className="os-folder">
      <div className="os-step-pills" role="tablist">
        {ROOMS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={room === item.id}
            className={cn("os-step-pill", room === item.id && "is-on")}
            onClick={() => onRoom(item.id)}
          >
            {t(item.key)}
          </button>
        ))}
      </div>

      {room === "today" ? <DayMeals day={plan.today} /> : null}
      {room === "weekly" ? <DaysBoard days={plan.weekly} /> : null}
      {room === "monthly" ? (
        <div className="os-month-top">
          <p className="os-onboard-lede">{t("monthHint")}</p>
          <MonthBoard days={plan.monthly} />
        </div>
      ) : null}
    </div>
  );
}

function MonthBoard({ days }: { days: DailyPlan[] }) {
  const { t, lang } = useMotherLocale();
  const [openDate, setOpenDate] = useState<string | null>(null);

  return (
    <div className="os-month-list is-rail">
      {days.map((day) => {
        const dinner = day.meals.find((meal) => meal.slot === "dinner") ?? day.meals[0];
        const focus = dinner ? getMealFocus(dinner) : "Energy";
        const open = openDate === day.date;

        return (
          <div key={day.date} className="os-month-item">
            <button
              type="button"
              className={cn("os-month-row", open && "is-open")}
              aria-expanded={open}
              onClick={() => setOpenDate(open ? null : day.date)}
            >
              <span className="os-month-day">{translateKitchen(lang, day.dayLabel)}</span>
              <strong>{translateKitchen(lang, dinner?.name ?? "—")}</strong>
              <span className={cn("os-focus-chip", `is-${focus.toLowerCase()}`)}>{t(FOCUS_KEY[focus])}</span>
            </button>
            {open ? (
              <div className="os-month-expand">
                <p className="os-band-kicker">
                  {day.date} · {mealSlotCopy(lang, "dinner")}
                </p>
                <DayMeals day={day} />
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function DaysBoard({ days }: { days: DailyPlan[] }) {
  const { lang } = useMotherLocale();
  return (
    <div className="os-days-board">
      {days.map((day) => (
        <section key={day.date} className="os-day-block">
          <p className="os-band-kicker">{translateKitchen(lang, day.dayLabel)}</p>
          <DayMeals day={day} />
        </section>
      ))}
    </div>
  );
}

function DayMeals({ day }: { day: DailyPlan }) {
  const { t, lang } = useMotherLocale();
  const meals = SLOT_ORDER.map((slot) => day.meals.find((meal) => meal.slot === slot)).filter(
    (meal): meal is MealEntry => Boolean(meal)
  );

  return (
    <div className="os-meal-list">
      {meals.map((meal) => {
        const focus = getMealFocus(meal);
        return (
          <article key={`${day.date}-${meal.slot}`} className="os-meal-row">
            <p className="os-band-kicker">{mealSlotCopy(lang, meal.slot)}</p>
            <h3>{translateKitchen(lang, meal.name)}</h3>
            <span className={cn("os-focus-chip", `is-${focus.toLowerCase()}`)}>{t(FOCUS_KEY[focus])}</span>
          </article>
        );
      })}
    </div>
  );
}
