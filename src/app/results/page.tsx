"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { BbCanvas } from "@/components/babybite/bb-canvas";
import { DinnerHero, GroceryTicks, TodayShelf, WeekShelf } from "@/components/babybite/dinner-hero";
import { GrowthBoard, SiteArt } from "@/components/babybite/oats-brand";
import { KitchenSkeleton } from "@/components/babybite/page-skeleton";
import { ResultsFolder, type ResultsRoom } from "@/components/babybite/results-folder";
import { ResultsPdfDownload } from "@/components/babybite/results-pdf-download";
import type { GeneratedMealPlan } from "@/types/babybite";
import {
  fetchBabyBiteProfile,
  BabyBiteApiError,
  writeActiveChildId,
  type BabyBiteChildSummary,
} from "@/lib/babybite-client";
import { planLooksStuck } from "@/lib/plan-variety";
import { useMotherLocale } from "@/components/providers/locale-provider";

type Tab = ResultsRoom;

export default function ResultsPage() {
  const { t } = useMotherLocale();
  const [plan, setPlan] = useState<GeneratedMealPlan | null>(null);
  const [tab, setTab] = useState<Tab>("today");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [childProfileId, setChildProfileId] = useState<string | undefined>();
  const [children, setChildren] = useState<BabyBiteChildSummary[]>([]);
  const [childGrowth, setChildGrowth] = useState<{
    ageYears: number;
    heightCm?: number;
    weightKg?: number;
    firstHeightCm?: number;
    firstWeightKg?: number;
  } | null>(null);

  const applyData = (
    plansJson: { plan?: GeneratedMealPlan; error?: string },
    profile: Awaited<ReturnType<typeof fetchBabyBiteProfile>>
  ) => {
    if (plansJson.error) {
      throw new Error(plansJson.error);
    }
    setPlan(plansJson.plan ?? null);
    if (profile.child?.id) setChildProfileId(profile.child.id);
    setChildren(profile.children ?? (profile.child ? [profile.child] : []));
    if (profile.child) {
      setChildGrowth({
        ageYears: profile.child.ageYears,
        heightCm: profile.child.heightCm,
        weightKg: profile.child.weightKg,
        firstHeightCm: profile.child.baselineHeightCm,
        firstWeightKg: profile.child.baselineWeightKg,
      });
    }
  };

  const loadPlan = useCallback(async () => {
    const profile = await fetchBabyBiteProfile();
    const childId = profile.child?.id;
    const headers = { "Content-Type": "application/json" };

    let plansJson: { plan?: GeneratedMealPlan; error?: string } = {};

    const loaded = await fetch(
      childId ? `/api/babybite/plans?childProfileId=${encodeURIComponent(childId)}` : "/api/babybite/plans",
      { cache: "no-store" }
    );
    plansJson = await loaded.json();

    const needsRebuild =
      Boolean(childId && profile.child?.hasPaid) &&
      (!plansJson.plan || planLooksStuck(plansJson.plan));

    if (needsRebuild) {
      const rebuilt = await fetch("/api/babybite/plans", {
        method: "POST",
        headers,
        cache: "no-store",
        body: JSON.stringify({ childProfileId: childId, regenerate: true }),
      });
      const rebuiltJson = await rebuilt.json();
      if (rebuilt.ok && rebuiltJson.plan) {
        plansJson = rebuiltJson;
      } else if (!plansJson.plan) {
        throw new Error(rebuiltJson.error ?? plansJson.error ?? t("failedPlan"));
      }
    }

    applyData(plansJson, profile);
  }, [t]);

  useEffect(() => {
    let cancelled = false;
    const frame = window.requestAnimationFrame(() => {
      loadPlan()
        .catch((err) => {
          if (!cancelled) {
            setError(err instanceof BabyBiteApiError || err instanceof Error ? err.message : t("failedPlan"));
          }
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    });
    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frame);
    };
  }, [loadPlan, t]);

  const retry = () => {
    setLoading(true);
    setError(null);
    loadPlan()
      .catch((err) => {
        setError(err instanceof BabyBiteApiError || err instanceof Error ? err.message : t("failedPlan"));
      })
      .finally(() => setLoading(false));
  };

  if (loading) {
    return (
      <BbCanvas full className="os-results">
        <KitchenSkeleton />
      </BbCanvas>
    );
  }

  if (error) {
    return (
      <BbCanvas full className="os-results">
        <section className="os-results-hero os-results-empty">
          <p className="os-band-kicker">{t("tonight")}</p>
          <h1 className="os-hero-title">{t("whatsDinner")}</h1>
          <SiteArt src="/art-tiffin.png" alt={t("artTiffin")} variant="tiffin" />
          <p className="os-onboard-lede">{error}</p>
          <button type="button" className="bb-cta" onClick={retry}>
            {t("tryAgain")}
          </button>
        </section>
      </BbCanvas>
    );
  }

  if (!plan) {
    return (
      <BbCanvas full className="os-results">
        <section className="os-results-hero os-results-empty">
          <p className="os-band-kicker">{t("tonight")}</p>
          <h1 className="os-hero-title">{t("whatsDinner")}</h1>
          <SiteArt src="/art-tiffin.png" alt={t("artTiffin")} variant="tiffin" />
          <p className="os-onboard-lede">{t("bandBody")}</p>
          <Link href="/payment" className="bb-cta">
            {t("showThirty")}
          </Link>
        </section>
      </BbCanvas>
    );
  }

  return (
    <BbCanvas full className="os-results">
      <section className="os-results-hero">
        <p className="os-band-kicker">
          {plan.childName} · {t("showcaseKicker")}
        </p>
        {children.length > 1 ? (
          <div className="os-step-pills" role="tablist" aria-label={t("switchChild")}>
            {children.map((kid) => (
              <button
                key={kid.id}
                type="button"
                role="tab"
                aria-selected={kid.id === childProfileId}
                className={`os-step-pill${kid.id === childProfileId ? " is-on" : ""}`}
                onClick={() => {
                  if (kid.id === childProfileId) return;
                  writeActiveChildId(kid.id);
                  setLoading(true);
                  setError(null);
                  loadPlan()
                    .catch((err) => {
                      setError(err instanceof BabyBiteApiError || err instanceof Error ? err.message : t("failedPlan"));
                    })
                    .finally(() => setLoading(false));
                }}
              >
                {kid.name}
              </button>
            ))}
          </div>
        ) : null}
        <h1 className="os-hero-title">{t("whatsDinner")}</h1>
        <DinnerHero plan={plan} />
        <ResultsPdfDownload childProfileId={childProfileId} />
      </section>

      {childGrowth ? (
        <GrowthBoard
          ageYears={childGrowth.ageYears}
          heightCm={childGrowth.heightCm}
          weightKg={childGrowth.weightKg}
          firstHeightCm={childGrowth.firstHeightCm}
          firstWeightKg={childGrowth.firstWeightKg}
        />
      ) : null}

      <section className="os-plates os-results-plates">
        <p className="os-band-kicker">{t("ourPlates")}</p>
        <h2 className="os-section-title">{tab === "weekly" ? t("roomWeek") : t("planReady")}</h2>
        <SiteArt src="/art-tiffins.png" alt={t("artTiffins")} variant="wide" />
        {tab === "weekly" ? <WeekShelf plan={plan} /> : <TodayShelf plan={plan} />}
      </section>

      <section className="os-results-board" id="table">
        <p className="os-band-kicker">{t("table")}</p>
        <h2 className="os-section-title">
          {tab === "monthly"
            ? t("roomMonth")
            : tab === "weekly"
              ? t("roomWeek")
              : tab === "meals"
                ? t("roomByMeal")
                : tab === "problems"
                  ? t("roomByProblem")
                  : t("roomToday")}
        </h2>
        <SiteArt src="/art-nutrients.png" alt={t("artNutrients")} variant="nutrients" />
        <ResultsFolder plan={plan} room={tab} onRoom={setTab} />
        <GroceryTicks plan={plan} />
      </section>
    </BbCanvas>
  );
}
