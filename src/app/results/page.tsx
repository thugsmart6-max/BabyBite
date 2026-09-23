"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { signOutToLanding } from "@/lib/client-sign-out";
import { BbCanvas } from "@/components/babybite/bb-canvas";
import { DinnerHero, GroceryTicks, MonthShelf, TodayShelf, WeekShelf } from "@/components/babybite/dinner-hero";
import { GrowthBoard, SiteArt } from "@/components/babybite/oats-brand";
import { FEEDING_IMAGE } from "@/lib/landing-art";
import { KitchenSkeleton } from "@/components/babybite/page-skeleton";
import { ResultsFolder, type ResultsRoom } from "@/components/babybite/results-folder";
import { ResultsPdfDownload } from "@/components/babybite/results-pdf-download";
import type { GeneratedMealPlan, MealEntry, TiffinNeed } from "@/types/babybite";
import { LunchSwapSheet } from "@/components/babybite/lunch-swap-sheet";
import { toast } from "sonner";
import { ageBandForYears } from "@/types/babybite";
import {
  fetchBabyBiteProfile,
  BabyBiteApiError,
  writeActiveChildId,
  type BabyBiteChildSummary,
} from "@/lib/babybite-client";
import { MEAL_ENGINE_VERSION, planLooksStuck } from "@/lib/plan-variety";
import { overlaySchoolPlan } from "@/lib/school-lunch-view";
import { applyLunchOverrides } from "@/lib/plan-lunch-overrides";
import { planForTodayWeekDisplay } from "@/lib/packable-lunch-plan";
import { useMotherLocale } from "@/components/providers/locale-provider";
import type { MotherCopyKey } from "@/lib/mother-copy";
import { endLocalSession } from "@/lib/local-user-store";

type Tab = ResultsRoom;

function plateAgeCopy(ageYears: number): MotherCopyKey {
  const band = ageBandForYears(ageYears);
  if (band === "4-5") return "plateAges45";
  if (band === "6-8") return "plateAges68";
  return "plateAges912";
}

export default function ResultsPage() {
  const { t } = useMotherLocale();
  const [plan, setPlan] = useState<GeneratedMealPlan | null>(null);
  const [tab, setTab] = useState<Tab>("today");
  const [tiffinNeed, setTiffinNeed] = useState<TiffinNeed>("home-only");
  const [schoolFilter, setSchoolFilter] = useState(false);
  const [tableHeadline, setTableHeadline] = useState<MotherCopyKey | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lunchSwap, setLunchSwap] = useState<{ dayDate: string; dayLabel: string; currentName?: string } | null>(
    null
  );
  const [swapLoading, setSwapLoading] = useState(false);
  const [schoolSaving, setSchoolSaving] = useState(false);
  const [lunchOverrides, setLunchOverrides] = useState<Record<string, string>>({});
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
    plansJson: {
      plan?: GeneratedMealPlan;
      error?: string;
      schoolLunchView?: boolean;
      lunchOverrides?: Record<string, string>;
    },
    profile: Awaited<ReturnType<typeof fetchBabyBiteProfile>>
  ) => {
    if (plansJson.error) {
      throw new Error(plansJson.error);
    }
    setPlan(plansJson.plan ?? null);
    setLunchOverrides(plansJson.lunchOverrides ?? {});
    if (profile.child?.id) setChildProfileId(profile.child.id);
    const nextTiffin = profile.child?.tiffinNeed ?? "home-only";
    setTiffinNeed(nextTiffin);
    setSchoolFilter(
      typeof plansJson.schoolLunchView === "boolean"
        ? plansJson.schoolLunchView
        : true
    );
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

  const loadPlanData = useCallback(async () => {
    const profile = await fetchBabyBiteProfile();
    const childId = profile.child?.id;
    const headers = { "Content-Type": "application/json" };
    const plansUrl = childId
      ? `/api/babybite/plans?childProfileId=${encodeURIComponent(childId)}`
      : "/api/babybite/plans";

    const loaded = await fetch(plansUrl, { cache: "no-store" });
    let plansJson: { plan?: GeneratedMealPlan; error?: string; engineVersion?: number } = await loaded.json();

    const paid = Boolean(childId && profile.child?.hasPaid);
    if (paid && !plansJson.plan) {
      const rebuilt = await fetch("/api/babybite/plans", {
        method: "POST",
        headers,
        cache: "no-store",
        body: JSON.stringify({ childProfileId: childId, regenerate: true }),
      });
      const rebuiltJson = await rebuilt.json();
      if (rebuilt.ok && rebuiltJson.plan) {
        plansJson = rebuiltJson;
      } else {
        throw new Error(rebuiltJson.error ?? plansJson.error ?? t("failedPlan"));
      }
    }

    const savedPlan = plansJson.plan;
    const schoolOn = (profile.child?.tiffinNeed ?? "home-only") === "school-lunch";
    const visibleStuck = savedPlan ? planLooksStuck(overlaySchoolPlan(savedPlan, schoolOn)) : false;
    if (
      paid &&
      savedPlan &&
      ((plansJson.engineVersion ?? 0) < MEAL_ENGINE_VERSION || planLooksStuck(savedPlan) || visibleStuck)
    ) {
      const rebuilt = await fetch("/api/babybite/plans", {
        method: "POST",
        headers,
        cache: "no-store",
        body: JSON.stringify({ childProfileId: childId, regenerate: true }),
      });
      const rebuiltJson = await rebuilt.json();
      if (rebuilt.ok && rebuiltJson.plan) {
        plansJson = rebuiltJson;
      }
    }

    return { plansJson, profile };
  }, [t]);

  useEffect(() => {
    let ignore = false;
    loadPlanData()
      .then((payload) => {
        if (ignore) return;
        applyData(payload.plansJson, payload.profile);
      })
      .catch((err) => {
        if (!ignore) {
          setError(err instanceof BabyBiteApiError || err instanceof Error ? err.message : t("failedPlan"));
        }
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [loadPlanData, t]);

  const retry = () => {
    setLoading(true);
    setError(null);
    loadPlanData()
      .then((payload) => applyData(payload.plansJson, payload.profile))
      .catch((err) => {
        setError(err instanceof BabyBiteApiError || err instanceof Error ? err.message : t("failedPlan"));
      })
      .finally(() => setLoading(false));
  };

  const leaveAccount = async () => {
    endLocalSession();
    await signOutToLanding();
  };

  const viewPlan = useMemo(() => {
    if (!plan) return null;
    const overlaid = overlaySchoolPlan(plan, schoolFilter);
    return applyLunchOverrides(overlaid, lunchOverrides);
  }, [plan, schoolFilter, lunchOverrides]);

  const platesPlan = useMemo(() => {
    if (!plan) return null;
    return planForTodayWeekDisplay(plan, lunchOverrides);
  }, [plan, lunchOverrides]);

  const persistSchoolView = async (on: boolean) => {
    setSchoolFilter(on);
    if (!childProfileId) return;
    setSchoolSaving(true);
    try {
      const res = await fetch("/api/babybite/plans/school-view", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ childProfileId, schoolLunchView: on }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json.message ?? json.error ?? t("failedPlan"));
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("failedPlan"));
    } finally {
      setSchoolSaving(false);
    }
  };

  const openLunchSwap = (day: { date: string; dayLabel: string; meals: MealEntry[] }) => {
    const lunch = day.meals.find((meal) => meal.slot === "lunch");
    setLunchSwap({
      dayDate: day.date,
      dayLabel: day.dayLabel,
      currentName: lunch?.name,
    });
  };

  const confirmLunchSwap = async (meal: MealEntry) => {
    if (!lunchSwap || !childProfileId || !plan) return;
    setSwapLoading(true);
    try {
      const res = await fetch("/api/babybite/plans/lunch-swap", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          childProfileId,
          dayDate: lunchSwap.dayDate,
          mealName: meal.name,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json.message ?? json.error ?? t("failedPlan"));
      }
      if (json.plan) {
        setPlan(json.plan);
      }
      if (json.lunchOverrides) {
        setLunchOverrides(json.lunchOverrides);
      }
      setLunchSwap(null);
      toast.success(t("lunchSwapUpdated"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("lunchSwapFailed"));
    } finally {
      setSwapLoading(false);
    }
  };

  if (loading) {
    return (
      <BbCanvas full className="os-results">
        <section className="os-results-empty">
          <KitchenSkeleton />
          <button type="button" className="bb-cta" data-testid="results-logout" onClick={leaveAccount}>
            {t("logOut")}
          </button>
        </section>
      </BbCanvas>
    );
  }

  if (error) {
    return (
      <BbCanvas full className="os-results">
        <section className="os-results-hero os-results-empty">
          <p className="os-band-kicker">{t("tonight")}</p>
          <h1 className="os-hero-title">{t("whatsDinner")}</h1>
          <SiteArt src={FEEDING_IMAGE} alt={t("artHeroDinner")} variant="photo" />
          <p className="os-onboard-lede">{error}</p>
          <button type="button" className="bb-cta" onClick={retry}>
            {t("tryAgain")}
          </button>
          <button type="button" className="bb-cta" data-testid="results-logout" onClick={leaveAccount}>
            {t("logOut")}
          </button>
        </section>
      </BbCanvas>
    );
  }

  if (!plan || !viewPlan) {
    return (
      <BbCanvas full className="os-results">
        <section className="os-results-hero os-results-empty">
          <p className="os-band-kicker">{t("tonight")}</p>
          <h1 className="os-hero-title">{t("whatsDinner")}</h1>
          <SiteArt src={FEEDING_IMAGE} alt={t("artHeroDinner")} variant="photo" />
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
          {plan.ageYears ? ` · ${t(plateAgeCopy(plan.ageYears))}` : ""}
        </p>
        <p className="os-onboard-lede">
          {t("checklistBuilt")}
          {plan.checklistSummary ? `: ${plan.checklistSummary}` : ""}
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
                  loadPlanData()
                    .then((payload) => applyData(payload.plansJson, payload.profile))
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
        <SiteArt src={FEEDING_IMAGE} alt={t("artHeroDinner")} variant="photo" />
        <DinnerHero plan={plan} />
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
        <h2 className="os-section-title">
          {tab === "weekly" ? t("roomWeek") : tab === "monthly" ? t("roomMonth") : t("planReady")}
        </h2>
        <SiteArt src="/art-tiffins.png" alt={t("artTiffins")} variant="wide" />
        {tab === "weekly" ? (
          <WeekShelf plan={platesPlan ?? viewPlan!} />
        ) : tab === "monthly" ? (
          <MonthShelf plan={viewPlan} />
        ) : (
          <TodayShelf plan={platesPlan ?? viewPlan!} />
        )}
      </section>

      <section className="os-results-board" id="table">
        <p className="os-band-kicker">{t("table")}</p>
        <h2 className="os-section-title">
          {tableHeadline && (tab === "meals" || tab === "problems")
            ? t(tableHeadline)
            : tab === "monthly"
              ? t("roomMonth")
              : tab === "weekly"
                ? t("roomWeek")
                : tab === "tiffin"
                  ? t("roomTiffin")
                  : tab === "meals"
                    ? t("roomByMeal")
                    : tab === "problems"
                      ? t("roomByProblem")
                      : t("roomToday")}
        </h2>
        <SiteArt src="/art-nutrients.png" alt={t("artNutrients")} variant="nutrients" />
        <ResultsFolder
          plan={tab === "tiffin" ? plan : viewPlan}
          room={tab}
          onRoom={setTab}
          tiffinNeed={tiffinNeed}
          schoolFilter={schoolFilter}
          onSchoolFilter={persistSchoolView}
          onOpenLunchSwap={openLunchSwap}
          lunchSwapBusy={swapLoading || schoolSaving}
          onBrowseHeadline={setTableHeadline}
        />
        {plan ? (
          <LunchSwapSheet
            open={Boolean(lunchSwap)}
            plan={platesPlan ?? plan}
            dayDate={lunchSwap?.dayDate ?? plan.today.date}
            dayLabel={lunchSwap?.dayLabel ?? ""}
            currentName={lunchSwap?.currentName}
            loading={swapLoading}
            onClose={() => setLunchSwap(null)}
            onConfirm={(meal) => void confirmLunchSwap(meal)}
          />
        ) : null}
        <GroceryTicks plan={viewPlan} />
      </section>

      <section className="os-results-pdf" id="pdf">
        <ResultsPdfDownload childProfileId={childProfileId} />
      </section>
    </BbCanvas>
  );
}
