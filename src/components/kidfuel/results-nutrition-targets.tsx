"use client";

import { getNutritionTargets, type NutritionTargets } from "@/lib/nutrition-targets";
import type { ChildGender } from "@/types/kidfuel";
import { GlassCard } from "@/components/kidfuel/ui";
import { cn } from "@/lib/utils";

export function NutritionTargetsCard({
  ageYears,
  gender,
  childName,
  className,
}: {
  ageYears: number;
  gender: ChildGender;
  childName: string;
  className?: string;
}) {
  const targets: NutritionTargets = getNutritionTargets(ageYears, gender);

  return (
    <GlassCard className={cn("p-6 md:p-8 min-w-0", className)}>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-6">
        <div className="min-w-0">
          <p className="label-caps text-accent mb-1">What {childName} needs each day</p>
          <h2 className="font-serif text-xl md:text-2xl leading-tight break-words">
            Not a chart. A kitchen target for age {ageYears}.
          </h2>
        </div>
        <span className="label-caps shrink-0 border border-accent/30 bg-accent/10 px-3 py-1.5 text-accent">
          {targets.ageGroupLabel}
        </span>
      </div>

      <div className="grid sm:grid-cols-2 gap-px bg-border border border-border rounded-[0.75rem] overflow-hidden">
        {targets.items.map((item) => (
          <div
            key={item.id}
            className={cn(
              "bg-card p-4 md:p-5 hover:bg-accent/5 transition-colors min-w-0",
              item.id === "fiber" && "bg-secondary"
            )}
          >
            <p className="label-caps text-muted-foreground mb-1">{item.label}</p>
            <p className="font-serif text-base md:text-lg leading-snug break-words">
              {item.value}
            </p>
            {item.note && (
              <p className="text-xs text-muted-foreground mt-1.5 break-words">{item.note}</p>
            )}
          </div>
        ))}
      </div>
      <p className="text-[0.65rem] text-muted-foreground mt-4 leading-relaxed">
        Reference ranges for Indian children {targets.ageGroupLabel.toLowerCase()}. Educational
        guidance only — consult your pediatrician for medical advice.
      </p>
    </GlassCard>
  );
}
