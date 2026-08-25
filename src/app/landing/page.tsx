"use client";

import Link from "next/link";
import { BbCanvas } from "@/components/kidfuel/bb-canvas";
import {
  BondTable,
  BrandStickers,
  CompareTables,
  MealMarquee,
  SiteArt,
} from "@/components/kidfuel/oats-brand";
import { useMotherLocale } from "@/components/providers/locale-provider";

const STEPS = [
  { n: "01", tone: "yellow" as const, titleKey: "step1" as const, bodyKey: "step1Body" as const },
  { n: "02", tone: "sage" as const, titleKey: "step2" as const, bodyKey: "step2Body" as const },
  { n: "03", tone: "pink" as const, titleKey: "step3" as const, bodyKey: "step3Body" as const },
];

export default function LandingPage() {
  const { t } = useMotherLocale();

  return (
    <BbCanvas full>
      <section className="os-hero">
        <BrandStickers />
        <div className="os-hero-core">
          <p className="os-band-kicker">{t("tonight")}</p>
          <h1 className="os-hero-title">{t("whatsDinner")}</h1>
          <SiteArt src="/art-tiffin.png" alt={t("artTiffin")} variant="tiffin" priority />
          <div className="os-band-actions os-hero-actions">
            <Link href="/signup" className="bb-cta">
              {t("makePlan")}
            </Link>
            <Link href="/login" className="os-text-link">
              {t("haveAccount")}
            </Link>
          </div>
        </div>
      </section>

      <MealMarquee />

      <BondTable />

      <CompareTables />

      <section className="os-plates" id="plates">
        <p className="os-band-kicker">{t("ourPlates")}</p>
        <h2 className="os-section-title">{t("sampleCaption")}</h2>
        <SiteArt src="/art-tiffins.png" alt={t("artTiffins")} variant="wide" />
      </section>

      <section className="os-duo">
        <p className="os-band-kicker">{t("duoKicker")}</p>
        <h2 className="os-section-title">{t("energyPlate")}</h2>
        <p className="os-bond-copy os-duo-copy">{t("payNotes")}</p>
        <SiteArt src="/art-nutrients.png" alt={t("artNutrients")} variant="nutrients" />
      </section>

      <section className="os-steps" id="how">
        <p className="os-band-kicker">{t("howTitle")}</p>
        <h2 className="os-section-title">{t("noSeven")}</h2>
        <div className="os-steps-grid">
          {STEPS.map((step) => (
            <article key={step.n} className={`os-step is-${step.tone}`}>
              <p className="os-step-n">{step.n}</p>
              <h3>{t(step.titleKey)}</h3>
              <p>{t(step.bodyKey)}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="os-band">
        <div className="os-band-color is-blue" />
        <div className="os-band-color is-yellow">
          <p className="os-band-kicker">{t("tonight")}</p>
          <h2 className="os-band-title">{t("noSeven")}</h2>
          <p className="os-band-copy">{t("bandBody")}</p>
          <div className="os-band-actions">
            <Link href="/signup" className="bb-cta">
              {t("makePlan")}
            </Link>
            <a href="#how" className="os-text-link">
              {t("seeHow")}
            </a>
          </div>
        </div>
      </section>

      <footer className="os-foot">
        <p className="os-foot-mark">BabyBite</p>
        <p className="os-foot-tag">{t("footerTag")}</p>
      </footer>
    </BbCanvas>
  );
}
