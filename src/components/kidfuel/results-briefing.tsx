"use client";

import type { ChildGender, DailyPlan, GeneratedMealPlan } from "@/types/kidfuel";
import { GOAL_LABELS, MEAL_SLOT_LABELS } from "@/types/kidfuel";
import { childVoice } from "@/lib/child-voice";
import { foodStyleLabel } from "@/services/analysis-engine";
import { getMealFocus } from "@/lib/meal-goal-notes";
import { mealOf } from "@/components/kidfuel/results-meal-plan";

export function ResultsBriefing({
  plan,
  ageYears,
  gender,
  room,
}: {
  plan: GeneratedMealPlan;
  ageYears: number;
  gender: ChildGender;
  room: "today" | "weekly" | "monthly" | "goals";
}) {
  const voice = childVoice(gender);
  const headline =
    room === "today"
      ? `Tonight is already decided for ${plan.childName}.`
      : room === "weekly"
        ? `Seven evenings you do not have to invent.`
        : room === "monthly"
          ? `Thirty days of plates while ${voice.they} is still growing.`
          : `What this week is quietly building.`;

  return (
    <div className="bb-briefing">
      <p className="label-caps text-accent">For the mother at this table</p>
      <h2>{headline}</h2>
      <p>
        {plan.childName} is {ageYears}. These are {voice.their} growing years. Genes set the range.
        Food fills it — protein, iron, and calcium on {foodStyleLabel(plan.foodStyle).toLowerCase()}{" "}
        plates {voice.they} will finish. We do not sell extra centimetres. We write the kitchen plan
        you already wish you had at 7pm.
      </p>
      <p className="bb-briefing-goal">{GOAL_LABELS[plan.goal]} · ages 4–12 · educational guidance</p>
    </div>
  );
}

export function ResultsMonthStory({
  monthly,
  childName,
}: {
  monthly: DailyPlan[];
  childName: string;
}) {
  const weeks = [0, 1, 2, 3]
    .map((index) => monthly.slice(index * 7, index * 7 + 7))
    .filter((week) => week.length > 0);

  const weekLines = [
    `Settling ${childName} into a rhythm — familiar breakfasts, no guessing at tiffin.`,
    `More vegetables on the plate, still in food ${childName} already knows.`,
    `Protein-forward lunches and dinners for the years ${childName} is still growing.`,
    `Favourites return so the month feels like home, not a new diet every morning.`,
  ];

  return (
    <div className="space-y-3">
      {weeks.map((week, index) => {
        const dinners = [...new Set(week.map((day) => mealOf(day, "dinner")))];
        return (
          <article key={week[0].date} className="bb-week-story">
            <p className="label-caps text-accent">Week {index + 1}</p>
            <h3>
              {week[0].dayLabel} – {week[week.length - 1].dayLabel}
            </h3>
            <p>{weekLines[index] ?? weekLines[0]}</p>
            <p className="bb-week-story-meals">{dinners.slice(0, 3).join(" · ")}</p>
          </article>
        );
      })}
    </div>
  );
}

export function ResultsTodayInsight({
  day,
}: {
  day: DailyPlan;
}) {
  return (
    <div className="bb-table-wrap">
      <table className="feather-table min-w-[32rem]">
        <thead>
          <tr>
            <th>This plate</th>
            <th>Why it is here</th>
          </tr>
        </thead>
        <tbody>
          {day.meals.map((meal) => (
            <tr key={meal.slot}>
              <td>
                <span className="text-muted-foreground block text-[0.65rem] tracking-widest uppercase mb-1">
                  {MEAL_SLOT_LABELS[meal.slot]}
                </span>
                {meal.name}
              </td>
              <td>
                <span className="bb-focus-chip">{getMealFocus(meal)}</span>
                <span className="text-muted-foreground block mt-1.5 text-xs leading-relaxed">
                  {meal.portionNote}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
