"use client";

import { KidFuelShell } from "@/components/kidfuel/kidfuel-shell";
import { MealPack } from "@/components/kidfuel/oats-brand";
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
    <KidFuelShell
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
