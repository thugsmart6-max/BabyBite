"use client";

import { cn } from "@/lib/utils";
import { MealPack } from "@/components/kidfuel/oats-brand";
import { useMotherLocale } from "@/components/providers/locale-provider";

export function AppLoadingScreen({ className }: { className?: string }) {
  const { t } = useMotherLocale();
  return (
    <div className={cn("os-hero-pack w-full", className)}>
      <MealPack
        name={t("writingPlate")}
        slot={t("tonight")}
        tone="yellow"
        size="lg"
        note={t("writingDinner")}
        lift={false}
      />
    </div>
  );
}
