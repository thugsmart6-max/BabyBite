"use client";

import type { DailyPlan } from "@/types/kidfuel";
import type { ChildGender } from "@/types/kidfuel";
import { computeWeeklyGoalProgress } from "@/lib/meal-goal-notes";
import { GlassCard } from "@/components/kidfuel/ui";
import { cn } from "@/lib/utils";

function ProgressBar({ percent, label }: { percent: number; label: string }) {
  return (
    <div className="min-w-0">
      <div className="flex justify-between items-baseline gap-2 mb-1.5">
        <span className="text-xs text-muted-foreground truncate">{label}</span>
        <span className="text-xs font-medium tabular-nums shrink-0">{percent}%</span>
      </div>
      <div className="h-2 w-full bg-border overflow-hidden">
        <div
          className="h-full bg-accent transition-all duration-700 ease-out"
          style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={label}
        />
      </div>
    </div>
  );
}

export function ResultsGoalTracker({
  weekly,
  ageYears,
  gender,
  childName,
  className,
}: {
  weekly: DailyPlan[];
  ageYears: number;
  gender: ChildGender;
  childName: string;
  className?: string;
}) {
  const goals = computeWeeklyGoalProgress(weekly, ageYears, gender);

  return (
    <GlassCard className={cn("p-6 md:p-8 min-w-0", className)}>
      <p className="label-caps text-accent mb-1">This week at the table</p>
      <h2 className="font-serif text-xl md:text-2xl leading-tight mb-2 break-words">
        How this week holds {childName}
      </h2>
      <p className="text-sm text-muted-foreground mb-6 break-words">
        Not a medical grade. A quiet reading of protein, iron, and energy on plates for age{" "}
        {ageYears}.
      </p>

      <div className="space-y-5">
        {goals.map((goal) => (
          <div key={goal.id} className="border border-border p-4 bg-card/50 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-3 min-w-0">
              <div className="min-w-0">
                <p className="font-medium text-sm">{goal.label}</p>
                <p className="text-xs text-accent/90 mt-0.5 break-words">{goal.goalLabel}</p>
              </div>
              <div className="text-xs text-muted-foreground sm:text-right shrink-0">
                <p>{goal.currentLabel}</p>
                <p className="opacity-80">Target: {goal.targetLabel}</p>
              </div>
            </div>
            <ProgressBar percent={goal.percent} label={`${goal.label} weekly progress`} />
          </div>
        ))}
      </div>
    </GlassCard>
  );
}
