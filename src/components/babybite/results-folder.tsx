"use client";

import { useState } from "react";
import type { DailyPlan, GeneratedMealPlan, KitchenLists, MealEntry } from "@/types/babybite";
import { getMealFocus } from "@/lib/meal-goal-notes";
import { useMotherLocale } from "@/components/providers/locale-provider";
import { mealSlotCopy, type MotherCopyKey } from "@/lib/mother-copy";
import { translateKitchen } from "@/lib/kitchen-translate";
import { cn } from "@/lib/utils";

export type ResultsRoom = "today" | "weekly" | "monthly" | "meals" | "problems";

const ROOMS: { id: ResultsRoom; key: MotherCopyKey }[] = [
  { id: "today", key: "roomToday" },
  { id: "weekly", key: "roomWeek" },
  { id: "monthly", key: "roomMonth" },
  { id: "meals", key: "roomByMeal" },
  { id: "problems", key: "roomByProblem" },
];

const FOCUS_KEY: Record<ReturnType<typeof getMealFocus>, MotherCopyKey> = {
  Iron: "focusIron",
  Calcium: "focusCalcium",
  Protein: "focusProtein",
  Fiber: "focusFiber",
  Energy: "focusEnergy",
};

const SLOT_ORDER = ["breakfast", "morningSnack", "lunch", "eveningSnack", "dinner"] as const;

const MEAL_LISTS: { id: keyof KitchenLists; key: MotherCopyKey }[] = [
  { id: "breakfast", key: "listBreakfast" },
  { id: "lunch", key: "listLunch" },
  { id: "dinner", key: "listDinner" },
  { id: "snacks", key: "listSnacks" },
];

const PROBLEM_LISTS: { id: keyof KitchenLists; key: MotherCopyKey }[] = [
  { id: "tenMin", key: "listTenMin" },
  { id: "budget", key: "listBudget" },
  { id: "schoolLunch", key: "listSchool" },
  { id: "kidsFavourite", key: "listFavourite" },
  { id: "riceFree", key: "listNoRice" },
  { id: "homemadeSnacks", key: "listHomemade" },
];

function emptyLists(): KitchenLists {
  return {
    breakfast: [],
    lunch: [],
    dinner: [],
    snacks: [],
    tenMin: [],
    budget: [],
    schoolLunch: [],
    kidsFavourite: [],
    riceFree: [],
    homemadeSnacks: [],
  };
}

export function ResultsFolder({
  plan,
  room,
  onRoom,
}: {
  plan: GeneratedMealPlan;
  room: ResultsRoom;
  onRoom: (room: ResultsRoom) => void;
}) {
  const { t } = useMotherLocale();
  const lists = plan.kitchenLists ?? emptyLists();
  const [mealList, setMealList] = useState<keyof KitchenLists>("breakfast");
  const [problemList, setProblemList] = useState<keyof KitchenLists>("tenMin");

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

      {room === "today" ? <DayMeals day={plan.today} detailed /> : null}
      {room === "weekly" ? <DaysBoard days={plan.weekly} /> : null}
      {room === "monthly" ? (
        <div className="os-month-top">
          <p className="os-onboard-lede">{t("monthHint")}</p>
          <MonthBoard days={plan.monthly} />
        </div>
      ) : null}
      {room === "meals" ? (
        <KitchenBrowse
          lists={lists}
          options={MEAL_LISTS}
          active={mealList}
          onActive={setMealList}
        />
      ) : null}
      {room === "problems" ? (
        <KitchenBrowse
          lists={lists}
          options={PROBLEM_LISTS}
          active={problemList}
          onActive={setProblemList}
        />
      ) : null}
    </div>
  );
}

function KitchenBrowse({
  lists,
  options,
  active,
  onActive,
}: {
  lists: KitchenLists;
  options: { id: keyof KitchenLists; key: MotherCopyKey }[];
  active: keyof KitchenLists;
  onActive: (id: keyof KitchenLists) => void;
}) {
  const { t, lang } = useMotherLocale();
  const meals = lists[active] ?? [];

  return (
    <div className="os-kitchen-browse">
      <div className="os-step-pills" role="tablist">
        {options.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={active === item.id}
            className={cn("os-step-pill", active === item.id && "is-on")}
            onClick={() => onActive(item.id)}
          >
            {t(item.key)}
          </button>
        ))}
      </div>
      {meals.length === 0 ? (
        <p className="os-onboard-lede">{t("emptyKitchenList")}</p>
      ) : (
        <div className="os-kitchen-grid">
          {meals.map((meal) => (
            <article key={`${active}-${meal.name}`} className="os-kitchen-card">
              <p className="os-band-kicker">{mealSlotCopy(lang, meal.slot)}</p>
              <h3>{translateKitchen(lang, meal.name)}</h3>
              <p>{translateKitchen(lang, meal.description)}</p>
              <MealMeta meal={meal} />
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function MealMeta({ meal }: { meal: MealEntry }) {
  const { t, lang } = useMotherLocale();
  const pantry = (meal.pantry ?? []).map((item) => translateKitchen(lang, item)).join(" · ");
  return (
    <div className="os-meal-meta">
      {meal.minutes ? (
        <p>
          {meal.minutes} {t("minutesWord")}
        </p>
      ) : null}
      {pantry ? (
        <p>
          {t("pantryLine")}: {pantry}
        </p>
      ) : null}
      {meal.tags?.includes("family-pot") ? <p>{t("familyPotNote")}</p> : null}
    </div>
  );
}

function MealSwaps({ meal }: { meal: MealEntry }) {
  const { t, lang } = useMotherLocale();
  if (!meal.swaps?.length) return null;
  return (
    <div className="os-swap-box">
      <p className="os-band-kicker">{t("ifTheyRefuse")}</p>
      {meal.swaps.map((swap) => (
        <p key={swap.name}>
          <strong>{translateKitchen(lang, swap.name)}</strong>
          {" — "}
          {translateKitchen(lang, swap.description)}
          <span className="os-swap-why"> {translateKitchen(lang, swap.why)}</span>
        </p>
      ))}
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
                <DayMeals day={day} detailed />
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
          <DayMeals day={day} detailed />
        </section>
      ))}
    </div>
  );
}

function DayMeals({ day, detailed }: { day: DailyPlan; detailed?: boolean }) {
  const { t, lang } = useMotherLocale();
  const meals = SLOT_ORDER.map((slot) => day.meals.find((meal) => meal.slot === slot)).filter(
    (meal): meal is MealEntry => Boolean(meal)
  );

  return (
    <div className="os-meal-list">
      {meals.map((meal) => {
        const focus = getMealFocus(meal);
        return (
          <article key={`${day.date}-${meal.slot}`} className={cn("os-meal-row", detailed && "is-open")}>
            <p className="os-band-kicker">{mealSlotCopy(lang, meal.slot)}</p>
            <h3>{translateKitchen(lang, meal.name)}</h3>
            <span className={cn("os-focus-chip", `is-${focus.toLowerCase()}`)}>{t(FOCUS_KEY[focus])}</span>
            {detailed ? (
              <>
                <p className="os-meal-desc">{translateKitchen(lang, meal.description)}</p>
                <MealMeta meal={meal} />
                <MealSwaps meal={meal} />
              </>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}
