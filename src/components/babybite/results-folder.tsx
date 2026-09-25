"use client";

import { useEffect, useState } from "react";
import type {
  DailyPlan,
  GeneratedMealPlan,
  KitchenLists,
  MealEntry,
  MealSlot,
  TiffinNeed,
} from "@/types/babybite";
import { getMealFocus } from "@/lib/meal-goal-notes";
import { useMotherLocale } from "@/components/providers/locale-provider";
import { mealSlotCopy, type MotherCopyKey } from "@/lib/mother-copy";
import { translateKitchen } from "@/lib/kitchen-translate";
import { translatePantryList, translatePlanText } from "@/lib/translate-plan-text";
import { lunchLooksRepeated } from "@/lib/plan-variety";
import { cn } from "@/lib/utils";
import { CalendarDays, CalendarRange, ListFilter, Sun, UtensilsCrossed } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type ResultsRoom = "today" | "weekly" | "monthly" | "meals" | "problems";

const FOCUS_KEY: Record<ReturnType<typeof getMealFocus>, MotherCopyKey> = {
  Iron: "focusIron",
  Calcium: "focusCalcium",
  Protein: "focusProtein",
  Fiber: "focusFiber",
  Energy: "focusEnergy",
};

const SLOT_ORDER: MealSlot[] = ["breakfast", "morningSnack", "lunch", "eveningSnack", "dinner"];

function MealSlotWord({ slot, packable }: { slot: MealSlot; packable?: boolean }) {
  const { lang } = useMotherLocale();
  return (
    <span className={cn("os-meal-slot-word", `is-${slot}`)}>
      {mealSlotCopy(lang, slot, { packable })}
    </span>
  );
}

type KitchenBrowseTone = "sage" | "yellow" | "pink" | "sky" | "cocoa" | "forest" | "cream" | "saffron";

type KitchenBrowseOption = {
  id: keyof KitchenLists;
  key: MotherCopyKey;
  hintKey: MotherCopyKey;
  tone: KitchenBrowseTone;
  glyph: string;
};

const MEAL_LISTS: KitchenBrowseOption[] = [
  { id: "breakfast", key: "listBreakfast", hintKey: "hintListBreakfast", tone: "sage", glyph: "AM" },
  { id: "lunch", key: "listLunch", hintKey: "hintListLunch", tone: "yellow", glyph: "☀" },
  { id: "dinner", key: "listDinner", hintKey: "hintListDinner", tone: "cocoa", glyph: "PM" },
  { id: "snacks", key: "listSnacks", hintKey: "hintListSnacks", tone: "pink", glyph: "·" },
];

const PROBLEM_LISTS: KitchenBrowseOption[] = [
  { id: "tenMin", key: "listTenMin", hintKey: "hintListTenMin", tone: "saffron", glyph: "10" },
  { id: "budget", key: "listBudget", hintKey: "hintListBudget", tone: "forest", glyph: "₹" },
  { id: "schoolLunch", key: "listSchool", hintKey: "hintListSchool", tone: "sky", glyph: "▣" },
  { id: "kidsFavourite", key: "listFavourite", hintKey: "hintListFavourite", tone: "yellow", glyph: "★" },
  { id: "riceFree", key: "listNoRice", hintKey: "hintListNoRice", tone: "cream", glyph: "∅" },
  { id: "homemadeSnacks", key: "listHomemade", hintKey: "hintListHomemade", tone: "sage", glyph: "⌂" },
];

const ROOM_CAPTION: Record<ResultsRoom, MotherCopyKey> = {
  today: "roomCaptionToday",
  weekly: "roomCaptionWeek",
  monthly: "roomCaptionMonth",
  meals: "roomCaptionMeals",
  problems: "roomCaptionProblems",
};

const PLAN_ROOMS: { id: ResultsRoom; key: MotherCopyKey; Icon: LucideIcon }[] = [
  { id: "today", key: "roomToday", Icon: Sun },
  { id: "weekly", key: "roomWeek", Icon: CalendarDays },
  { id: "monthly", key: "roomMonth", Icon: CalendarRange },
  { id: "meals", key: "roomByMeal", Icon: UtensilsCrossed },
  { id: "problems", key: "roomByProblem", Icon: ListFilter },
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
  tiffinNeed = "home-only",
  schoolFilter = false,
  onBrowseHeadline,
}: {
  plan: GeneratedMealPlan;
  room: ResultsRoom;
  onRoom: (room: ResultsRoom) => void;
  tiffinNeed?: TiffinNeed;
  schoolFilter?: boolean;
  onBrowseHeadline?: (key: MotherCopyKey | null) => void;
}) {
  const { t } = useMotherLocale();
  const lists = plan.kitchenLists ?? emptyLists();
  const [mealList, setMealList] = useState<keyof KitchenLists>("breakfast");
  const [problemList, setProblemList] = useState<keyof KitchenLists>(() => {
    if (tiffinNeed === "school-lunch") return "schoolLunch";
    if (plan.challenges?.includes("picky-eater") || plan.challenges?.includes("poor-appetite")) return "kidsFavourite";
    if (plan.cookTime === "ten-min") return "tenMin";
    if (plan.kitchenBudget === "tight") return "budget";
    if (plan.riceHabit === "refuses-rice") return "riceFree";
    return "tenMin";
  });
  const lunchRepeat = lunchLooksRepeated(plan.weekly);
  const dateView = room === "today" || room === "weekly" || room === "monthly";
  const browseView = room === "meals" || room === "problems";
  const schoolPoolEmpty = (lists.schoolLunch ?? []).length === 0;
  const activeListOption =
    room === "meals"
      ? MEAL_LISTS.find((item) => item.id === mealList)
      : room === "problems"
        ? PROBLEM_LISTS.find((item) => item.id === problemList)
        : null;

  useEffect(() => {
    if (!onBrowseHeadline) return;
    const key =
      room === "meals"
        ? (MEAL_LISTS.find((item) => item.id === mealList)?.key ?? null)
        : room === "problems"
          ? (PROBLEM_LISTS.find((item) => item.id === problemList)?.key ?? null)
          : null;
    onBrowseHeadline(key);
  }, [room, mealList, problemList, onBrowseHeadline]);

  useEffect(() => {
    if (room !== "meals" && room !== "problems") return;
    requestAnimationFrame(() => {
      document.getElementById("kitchen-browse-panel")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [room, mealList, problemList]);

  return (
    <div className="os-folder">
      <nav className="os-results-nav" aria-label={t("table")}>
        <div className="os-results-nav-block">
          <p className="os-results-nav-title">{t("roomPlanLabel")}</p>
          <div className="os-plan-grid" role="tablist">
            {PLAN_ROOMS.map((item) => {
              const selected = room === item.id;
              const Icon = item.Icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  className={cn("os-plan-tab", selected && "is-on")}
                  data-testid={`results-room-${item.id}`}
                  onClick={() => onRoom(item.id)}
                >
                  <Icon className="os-plan-tab-icon" aria-hidden strokeWidth={2.4} />
                  <span className="os-plan-tab-label">{t(item.key)}</span>
                </button>
              );
            })}
          </div>

          {browseView ? (
            <p className="os-results-nav-note">{t(room === "meals" ? "roomBrowseMealHint" : "roomBrowseProblemHint")}</p>
          ) : null}
        </div>

        <div className="os-view-strip" aria-live="polite">
          {activeListOption ? (
            <p className="os-view-strip-caption is-sub">
              {t(activeListOption.hintKey)} · {(lists[activeListOption.id] ?? []).length}{" "}
              {t("kitchenIdeasCount")}
            </p>
          ) : (
            <p className="os-view-strip-caption">{t(ROOM_CAPTION[room])}</p>
          )}
        </div>
      </nav>

      {dateView && schoolFilter && schoolPoolEmpty ? (
        <p className="os-onboard-lede os-results-callout">{t("schoolFilterEmpty")}</p>
      ) : null}

      <div className="os-results-panel">
      {room === "today" ? <DayMeals day={plan.today} detailed packableLunchLabels /> : null}
      {room === "weekly" ? (
        <>
          {lunchRepeat ? <p className="os-onboard-lede">{t("sameLunchNote")}</p> : null}
          <DaysBoard days={plan.weekly} packableLunchLabels />
        </>
      ) : null}
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
          pickerKind="meal"
        />
      ) : null}
      {room === "problems" ? (
        <KitchenBrowse
          lists={lists}
          options={PROBLEM_LISTS}
          active={problemList}
          onActive={setProblemList}
          pickerKind="problem"
        />
      ) : null}
      </div>
    </div>
  );
}

function KitchenBrowse({
  lists,
  options,
  active,
  onActive,
  pickerKind,
}: {
  lists: KitchenLists;
  options: KitchenBrowseOption[];
  active: keyof KitchenLists;
  onActive: (id: keyof KitchenLists) => void;
  pickerKind: "meal" | "problem";
}) {
  const { t, lang } = useMotherLocale();
  const meals = lists[active] ?? [];
  const activeOption = options.find((item) => item.id === active) ?? options[0];
  const byProblem = pickerKind === "problem";
  const pickLabel = byProblem ? t("kitchenPickProblem") : t("kitchenPickMeal");

  return (
    <div className="os-kitchen-browse" id="kitchen-browse-panel">
      <div className="os-kitchen-picker">
        <div className="os-kitchen-picker-head">
          <p className="os-kitchen-picker-label">{pickLabel}</p>
          <p className="os-kitchen-picker-count">
            <strong>{meals.length}</strong> {t("kitchenIdeasCount")}
          </p>
        </div>
        <div className="os-kitchen-tiles" role="listbox" aria-label={pickLabel}>
          {options.map((item) => {
            const count = lists[item.id]?.length ?? 0;
            const selected = active === item.id;
            return (
              <button
                key={item.id}
                type="button"
                role="option"
                aria-selected={selected}
                className={cn("os-kitchen-tile", `is-${item.tone}`, selected && "is-on")}
                data-testid={`kitchen-option-${item.id}`}
                onClick={() => onActive(item.id)}
              >
                <span className="os-kitchen-tile-glyph" aria-hidden>
                  {item.glyph}
                </span>
                <span className="os-kitchen-tile-body">
                  <span className="os-kitchen-tile-title">{t(item.key)}</span>
                  <span className="os-kitchen-tile-hint">{t(item.hintKey)}</span>
                </span>
                <span className="os-kitchen-tile-count">{count}</span>
              </button>
            );
          })}
        </div>
        {activeOption ? (
          <p className="os-kitchen-active-lede">
            <span className={cn("os-kitchen-active-chip", `is-${activeOption.tone}`)}>{t(activeOption.key)}</span>
            {t(activeOption.hintKey)}
          </p>
        ) : null}
      </div>

      {meals.length === 0 ? (
        <p className="os-onboard-lede">{t("emptyKitchenList")}</p>
      ) : (
        <section key={active} className="os-kitchen-list-section">
          <h3 className="os-kitchen-slot-title" data-testid="kitchen-list-title">
            {t(activeOption.key)}
          </h3>
          <div className="os-kitchen-grid">
            {meals.map((meal) => (
              <article key={`${active}-${meal.name}-${meal.slot}`} className="os-kitchen-card">
                {!byProblem ? (
                  <p className="os-meal-slot-line">
                    <MealSlotWord slot={meal.slot} />
                  </p>
                ) : null}
                <h4 className="os-kitchen-card-title">{translateKitchen(lang, meal.name)}</h4>
                <p>{translateKitchen(lang, meal.description)}</p>
                {meal.whyThisPlate ? (
                  <p className="os-meal-why">{translatePlanText(lang, meal.whyThisPlate)}</p>
                ) : null}
                <MealMeta meal={meal} />
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function MealMeta({ meal }: { meal: MealEntry }) {
  const { t, lang } = useMotherLocale();
  const pantry = translatePantryList(lang, meal.pantry ?? []);
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
          <span className="os-swap-why"> {translatePlanText(lang, swap.why)}</span>
        </p>
      ))}
    </div>
  );
}

function MonthBoard({
  days,
  packableLunchLabels = false,
}: {
  days: DailyPlan[];
  packableLunchLabels?: boolean;
}) {
  const { t, lang } = useMotherLocale();
  const [openDate, setOpenDate] = useState<string | null>(null);

  return (
    <div className="os-month-list is-rail">
      {days.map((day) => {
        const lunch = day.meals.find((meal) => meal.slot === "lunch") ?? day.meals[0];
        const focus = lunch ? getMealFocus(lunch) : "Energy";
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
              <strong>{translateKitchen(lang, lunch?.name ?? "—")}</strong>
              <span className={cn("os-focus-chip", `is-${focus.toLowerCase()}`)}>{t(FOCUS_KEY[focus])}</span>
            </button>
            {open ? (
              <div className="os-month-expand">
                <p className="os-meal-slot-line">
                  {day.date} · <MealSlotWord slot="lunch" packable={packableLunchLabels} />
                </p>
                <DayMeals day={day} detailed packableLunchLabels={packableLunchLabels} />
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function DaysBoard({
  days,
  packableLunchLabels = false,
}: {
  days: DailyPlan[];
  packableLunchLabels?: boolean;
}) {
  const { lang } = useMotherLocale();
  return (
    <div className="os-days-board">
      {days.map((day) => (
        <section key={day.date} className="os-day-block">
          <p className="os-band-kicker">{translateKitchen(lang, day.dayLabel)}</p>
          <DayMeals day={day} detailed packableLunchLabels={packableLunchLabels} />
        </section>
      ))}
    </div>
  );
}

function DayMeals({
  day,
  detailed,
  packableLunchLabels = false,
}: {
  day: DailyPlan;
  detailed?: boolean;
  packableLunchLabels?: boolean;
}) {
  const { t, lang } = useMotherLocale();
  const meals = SLOT_ORDER.map((slot) => day.meals.find((meal) => meal.slot === slot)).filter(
    (meal): meal is MealEntry => Boolean(meal)
  );

  return (
    <div className="os-meal-list">
      {meals.map((meal) => {
        const focus = getMealFocus(meal);
        return (
          <article
            key={`${day.date}-${meal.slot}`}
            className={cn(
              "os-meal-row",
              detailed && "is-open",
              meal.slot === "lunch" && packableLunchLabels && "is-packable-lunch-row",
            )}
          >
            <p className="os-meal-slot-line">
              <MealSlotWord
                slot={meal.slot}
                packable={packableLunchLabels && meal.slot === "lunch"}
              />
            </p>
            <h3>{translateKitchen(lang, meal.name)}</h3>
            <span className={cn("os-focus-chip", `is-${focus.toLowerCase()}`)}>{t(FOCUS_KEY[focus])}</span>
            {detailed ? (
              <>
                <p className="os-meal-desc">{translateKitchen(lang, meal.description)}</p>
                {meal.whyThisPlate ? (
                  <p className="os-meal-why">
                    {t("whyThisPlate")}: {translatePlanText(lang, meal.whyThisPlate)}
                  </p>
                ) : null}
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
