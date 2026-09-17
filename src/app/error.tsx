"use client";

import { BabyBiteShell } from "@/components/babybite/babybite-shell";
import { MealPack } from "@/components/babybite/oats-brand";
import { ErrorState } from "@/components/shared/error-state";
import { useMotherLocale } from "@/components/providers/locale-provider";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useMotherLocale();
  return (
    <BabyBiteShell
      dinnerFirst
      left={
        <div className="p-4">
          <ErrorState
            title={t("couldNotLoad")}
            message={error.message || t("couldNotLoad")}
            onRetry={reset}
          />
        </div>
      }
      right={
        <MealPack name={t("holdOn")} slot={t("childKitchen")} tone="pink" size="lg" note={t("dinnerThatWay")} />
      }
    />
  );
}
