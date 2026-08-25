"use client";

import type { DailyPlan, GeneratedMealPlan, MealSlot, NutritionGoal } from "@/types/kidfuel";
import { GlassCard } from "@/components/kidfuel/ui";
import { MEAL_SLOT_LABELS } from "@/types/kidfuel";
import { getEmotionalMealNote, getMealFocus, getWeeklyDisplayMeals } from "@/lib/meal-goal-notes";
import { cn } from "@/lib/utils";

export function mealOf(day: DailyPlan, slot: MealSlot): string {
  return day.meals.find((meal) => meal.slot === slot)?.name ?? "—";
}

export function ResultsDaysTable({
  days,
  mode,
}: {
  days: DailyPlan[];
  mode: "weekly" | "monthly";
}) {
  return (
    <div className="bb-table-wrap">
      <table className="feather-table min-w-[40rem]">
        <thead>
          <tr>
            {mode === "monthly" && <th>Date</th>}
            <th>Day</th>
            <th>Breakfast</th>
            <th>Lunch</th>
            <th>Dinner</th>
          </tr>
        </thead>
        <tbody>
          {days.map((day) => (
            <tr key={day.date}>
              {mode === "monthly" && (
                <td className="text-muted-foreground whitespace-nowrap">{day.date}</td>
              )}
              <td className="whitespace-nowrap">{day.dayLabel}</td>
              <td>{mealOf(day, "breakfast")}</td>
              <td>{mealOf(day, "lunch")}</td>
              <td>{mealOf(day, "dinner")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ResultsTodayTable({ day }: { day: DailyPlan }) {
  return (
    <div className="bb-table-wrap">
      <table className="feather-table min-w-[32rem]">
        <thead>
          <tr>
              <th>Slot</th>
              <th>Meal</th>
              <th>For</th>
              <th>kcal</th>
          </tr>
        </thead>
        <tbody>
          {day.meals.map((meal) => (
            <tr key={meal.slot}>
              <td className="text-muted-foreground whitespace-nowrap">
                {MEAL_SLOT_LABELS[meal.slot]}
              </td>
              <td>{meal.name}</td>
              <td>
                <span className="bb-focus-chip">{getMealFocus(meal)}</span>
              </td>
              <td className="text-muted-foreground">~{meal.caloriesApprox}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TodayMeals({
  day,
  goal,
  childName,
}: {
  day: DailyPlan;
  goal: NutritionGoal;
  childName: string;
}) {
  return (
    <section className="space-y-0 border border-border min-w-0 rounded-xl overflow-hidden">
      {day.meals.map((meal, i) => (
        <div
          key={meal.slot}
          className="grid grid-cols-[3.5rem_minmax(0,1fr)] gap-4 p-5 border-b border-border last:border-0 hover:bg-accent/5 transition-colors"
        >
          <span className="font-label text-xs tabular-nums text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
          <div className="min-w-0">
            <p className="label-caps text-accent mb-1">{MEAL_SLOT_LABELS[meal.slot]}</p>
            <p className="font-serif text-lg leading-tight mb-1 break-words">
              {meal.name}
            </p>
            <p className="text-sm text-muted-foreground break-words mb-2">{meal.description}</p>
            <p className="text-xs border-l-2 border-accent/40 pl-2 text-muted-foreground break-words">
              {getEmotionalMealNote(meal, childName, goal)}
            </p>
            <p className="text-xs text-muted-foreground mt-2">~{meal.caloriesApprox} kcal</p>
            {meal.portionNote && (
              <p className="text-xs text-accent/80 mt-1">{meal.portionNote}</p>
            )}
          </div>
        </div>
      ))}
    </section>
  );
}

function WeeklyDayCard({
  day,
  index,
  goal,
  childName,
}: {
  day: DailyPlan;
  index: number;
  goal: NutritionGoal;
  childName: string;
}) {
  const rows = getWeeklyDisplayMeals(day);

  return (
    <GlassCard className="p-5 md:p-6 min-w-0">
      <div className="flex items-baseline gap-3 mb-4 min-w-0">
        <span className="font-label text-xs tabular-nums text-muted-foreground shrink-0">{String(index + 1).padStart(2, "0")}</span>
        <div className="min-w-0">
          <p className="font-serif text-lg leading-tight break-words">{day.dayLabel}</p>
          <p className="text-xs text-muted-foreground">{day.date}</p>
        </div>
      </div>

      <div className="space-y-4">
        {rows.map((row) => (
          <div key={row.slot} className="border-t border-border pt-4 first:border-0 first:pt-0 min-w-0">
            <p className="label-caps text-accent mb-2">{row.label}</p>
            {row.meals.map((meal) => (
              <div key={meal.slot + meal.name} className="mb-3 last:mb-0 min-w-0">
                <p className="font-medium text-sm break-words">{meal.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5 break-words">{meal.description}</p>
                <p className="text-xs text-accent/80 mt-1.5 break-words">
                  {getEmotionalMealNote(meal, childName, goal)}
                </p>
              </div>
            ))}
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

export function ResultsMealPlan({
  plan,
  layout,
  className,
}: {
  plan: GeneratedMealPlan;
  layout: "today" | "weekly" | "monthly";
  className?: string;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      {layout === "today" ? (
        <TodayMeals day={plan.today} goal={plan.goal} childName={plan.childName} />
      ) : layout === "weekly" ? (
        <section className="space-y-3">
          {plan.weekly.map((day, i) => (
            <WeeklyDayCard
              key={day.date}
              day={day}
              index={i}
              goal={plan.goal}
              childName={plan.childName}
            />
          ))}
        </section>
      ) : (
        <section className="grid gap-3 sm:grid-cols-2">
          {plan.monthly.map((day, i) => (
            <WeeklyDayCard
              key={day.date}
              day={day}
              index={i}
              goal={plan.goal}
              childName={plan.childName}
            />
          ))}
        </section>
      )}
    </div>
  );
}
