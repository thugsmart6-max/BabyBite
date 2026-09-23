"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import type { GeneratedMealPlan, MealEntry } from "@/types/babybite";
import { getMealFocus } from "@/lib/meal-goal-notes";
import { useMotherLocale } from "@/components/providers/locale-provider";
import { mealSlotCopy, type MotherCopyKey } from "@/lib/mother-copy";
import { translateKitchen } from "@/lib/kitchen-translate";
import { collectLunchAlternatives } from "@/lib/plan-lunch-overrides";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

const FOCUS_KEY: Record<ReturnType<typeof getMealFocus>, MotherCopyKey> = {
  Iron: "focusIron",
  Calcium: "focusCalcium",
  Protein: "focusProtein",
  Fiber: "focusFiber",
  Energy: "focusEnergy",
};

function currentLunchMeal(plan: GeneratedMealPlan, dayDate: string, currentName?: string): MealEntry | undefined {
  const day =
    plan.today.date === dayDate
      ? plan.today
      : [...(plan.weekly ?? []), ...(plan.monthly ?? [])].find((d) => d.date === dayDate);
  const lunch = day?.meals.find((m) => m.slot === "lunch");
  if (lunch) return lunch;
  if (!currentName) return undefined;
  return collectLunchAlternatives(plan, true).find((m) => m.name === currentName);
}

export function LunchSwapSheet({
  open,
  plan,
  dayDate,
  dayLabel,
  currentName,
  loading,
  onClose,
  onConfirm,
}: {
  open: boolean;
  plan: GeneratedMealPlan;
  dayDate: string;
  dayLabel: string;
  currentName?: string;
  loading?: boolean;
  onClose: () => void;
  onConfirm: (meal: MealEntry) => void;
}) {
  const { t, lang } = useMotherLocale();
  const [selected, setSelected] = useState<MealEntry | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);

  const options = collectLunchAlternatives(plan, true).filter((meal) => meal.name !== currentName);
  const current = currentLunchMeal(plan, dayDate, currentName);

  useEffect(() => {
    if (!open) {
      setSelected(null);
      return;
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) onClose();
    };
    window.addEventListener("keydown", onKey);
    dialogRef.current?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [open, loading, onClose]);

  const pick = useCallback((meal: MealEntry) => {
    setSelected(meal);
    requestAnimationFrame(() => confirmRef.current?.focus());
  }, []);

  if (!open) return null;

  return (
    <div className="os-lunch-swap-backdrop" role="presentation" onClick={loading ? undefined : onClose}>
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="os-box-lunch-swap"
        role="dialog"
        aria-modal="true"
        aria-labelledby="box-lunch-swap-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="os-box-lunch-swap-head">
          <p className="os-band-kicker">{dayLabel}</p>
          <h2 id="box-lunch-swap-title" className="os-box-lunch-swap-title">
            {t("boxLunchSwapTitle")}
          </h2>
          <p className="os-onboard-lede">{t("boxLunchSwapLead")}</p>
        </header>

        <section className="os-box-lunch-current" aria-labelledby="box-lunch-current-label">
          <h3 id="box-lunch-current-label" className="os-box-lunch-section-label">
            {t("todaysPackableLunch")}
          </h3>
          <div className="os-box-lunch-current-card">
            <div className="os-box-lunch-art" aria-hidden>
              <Image src="/art-tiffins.png" alt="" width={280} height={160} className="os-box-lunch-art-img" />
            </div>
            <div className="os-box-lunch-current-copy">
              <p className="os-packable-kicker">{t("packableBadge")}</p>
              <p className="os-band-kicker">{mealSlotCopy(lang, "lunch", { packable: true })}</p>
              <p className="os-box-lunch-meal-name">
                {current ? translateKitchen(lang, current.name) : "—"}
              </p>
              {current?.description ? (
                <p className="os-box-lunch-meal-desc">{translateKitchen(lang, current.description)}</p>
              ) : null}
            </div>
          </div>
        </section>

        <p className="os-box-lunch-swap-arrow" aria-hidden>
          ↓ {t("swapWithLabel")} ↓
        </p>

        {options.length === 0 ? (
          <p className="os-onboard-lede os-results-callout">{t("schoolFilterEmpty")}</p>
        ) : (
          <section className="os-box-lunch-options" aria-label={t("swapWithLabel")}>
            <div className="os-box-lunch-options-track" role="listbox" aria-label={t("swapWithLabel")}>
              {options.map((meal) => {
                const isSelected = selected?.name === meal.name;
                const focus = getMealFocus(meal);
                return (
                  <button
                    key={meal.name}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    disabled={loading}
                    data-testid={`lunch-swap-option-${meal.name}`}
                    className={cn("os-box-lunch-option", isSelected && "is-selected")}
                    onClick={() => pick(meal)}
                  >
                    <div className="os-box-lunch-option-art" aria-hidden>
                      <Image src="/art-tiffins.png" alt="" width={200} height={120} className="os-box-lunch-art-img" />
                    </div>
                    <span className="os-packable-kicker">{t("packableBadge")}</span>
                    <span className="os-box-lunch-option-name">{translateKitchen(lang, meal.name)}</span>
                    <span className="os-box-lunch-option-desc">{translateKitchen(lang, meal.description)}</span>
                    <span className={cn("os-focus-chip", `is-${focus.toLowerCase()}`)}>{t(FOCUS_KEY[focus])}</span>
                    <span className="os-box-lunch-option-action">
                      {isSelected ? (
                        <>
                          <Check className="os-box-lunch-check" aria-hidden strokeWidth={3} />
                          {t("selectedMeal")}
                        </>
                      ) : (
                        t("selectMeal")
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        <footer className="os-box-lunch-swap-foot">
          <button
            ref={confirmRef}
            type="button"
            className="bb-cta os-box-lunch-confirm"
            data-testid="confirm-lunch-swap"
            disabled={!selected || loading}
            onClick={() => selected && onConfirm(selected)}
          >
            {loading ? t("writingDinner") : t("confirmLunchSwap")}
          </button>
          <button type="button" className="bb-cta-ghost os-lunch-swap-close" disabled={loading} onClick={onClose}>
            {t("back")}
          </button>
        </footer>
      </div>
    </div>
  );
}
