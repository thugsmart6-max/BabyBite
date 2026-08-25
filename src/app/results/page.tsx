"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BbCanvas } from "@/components/kidfuel/bb-canvas";
import { DinnerHero, GroceryTicks, TodayShelf, WeekShelf } from "@/components/kidfuel/dinner-hero";
import { OsBusy, SiteArt } from "@/components/kidfuel/oats-brand";
import { ResultsFolder } from "@/components/kidfuel/results-folder";
import { ResultsPdfDownload } from "@/components/kidfuel/results-pdf-download";
import type { GeneratedMealPlan } from "@/types/kidfuel";
import { fetchKidFuelProfile, KidFuelApiError } from "@/lib/kidfuel-client";
import { planLooksStuck } from "@/lib/plan-variety";
import { useMotherLocale } from "@/components/providers/locale-provider";

type Tab = "today" | "weekly" | "monthly";

export default function ResultsPage() {
  const { t } = useMotherLocale();
  const [plan, setPlan] = useState<GeneratedMealPlan | null>(null);
  const [tab, setTab] = useState<Tab>("today");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [childProfileId, setChildProfileId] = useState<string | undefined>();

  const applyData = (
    plansJson: { plan?: GeneratedMealPlan; error?: string },
    profile: Awaited<ReturnType<typeof fetchKidFuelProfile>>
  ) => {
    if (plansJson.error) {
      throw new Error(plansJson.error);
    }
    setPlan(plansJson.plan ?? null);
    if (profile.child?.id) setChildProfileId(profile.child.id);
  };

  const loadPlan = async () => {
    const profile = await fetchKidFuelProfile();
    const childId = profile.child?.id;
    const headers = { "Content-Type": "application/json" };

    let plansJson: { plan?: GeneratedMealPlan; error?: string } = {};

    const loaded = await fetch("/api/kidfuel/plans", { cache: "no-store" });
    plansJson = await loaded.json();

    const needsRebuild =
      Boolean(childId && profile.child?.hasPaid) &&
      (!plansJson.plan || planLooksStuck(plansJson.plan));

    if (needsRebuild) {
      const rebuilt = await fetch("/api/kidfuel/plans", {
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
  };

  useEffect(() => {
    let cancelled = false;
    const frame = window.requestAnimationFrame(() => {
      loadPlan()
        .catch((err) => {
          if (!cancelled) {
            setError(err instanceof KidFuelApiError || err instanceof Error ? err.message : t("failedPlan"));
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
  }, []);

  const retry = () => {
    setLoading(true);
    setError(null);
    loadPlan()
      .catch((err) => {
        setError(err instanceof KidFuelApiError || err instanceof Error ? err.message : t("failedPlan"));
      })
      .finally(() => setLoading(false));
  };

  if (loading) {
    return (
      <BbCanvas full className="os-results">
        <OsBusy />
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
        <h1 className="os-hero-title">{t("whatsDinner")}</h1>
        <DinnerHero plan={plan} />
        <ResultsPdfDownload childProfileId={childProfileId} />
      </section>

      <section className="os-plates os-results-plates">
        <p className="os-band-kicker">{t("ourPlates")}</p>
        <h2 className="os-section-title">{tab === "weekly" ? t("roomWeek") : t("planReady")}</h2>
        <SiteArt src="/art-tiffins.png" alt={t("artTiffins")} variant="wide" />
        {tab === "weekly" ? <WeekShelf plan={plan} /> : <TodayShelf plan={plan} />}
      </section>

      <section className="os-results-board" id="table">
        <p className="os-band-kicker">{t("table")}</p>
        <h2 className="os-section-title">
          {tab === "monthly" ? t("roomMonth") : tab === "weekly" ? t("roomWeek") : t("roomToday")}
        </h2>
        <SiteArt src="/art-nutrients.png" alt={t("artNutrients")} variant="nutrients" />
        <ResultsFolder plan={plan} room={tab} onRoom={setTab} />
        <GroceryTicks plan={plan} />
      </section>
    </BbCanvas>
  );
}
