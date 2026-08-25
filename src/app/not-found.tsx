"use client";

import Link from "next/link";
import { BbCanvas } from "@/components/kidfuel/bb-canvas";
import { MealPack } from "@/components/kidfuel/oats-brand";
import { useMotherLocale } from "@/components/providers/locale-provider";

export default function NotFound() {
  const { t } = useMotherLocale();
  return (
    <BbCanvas full>
      <section className="os-results-hero os-results-empty">
        <p className="os-band-kicker">{t("lostTitle")}</p>
        <h1 className="os-hero-title">{t("pageMissing")}</h1>
        <MealPack name={t("lostTitle")} slot="404" tone="yellow" size="lg" note={t("dinnerThatWay")} lift={false} />
        <div className="os-band-actions os-hero-actions">
          <Link href="/landing" className="bb-cta">
            {t("goHome")}
          </Link>
          <Link href="/results" className="os-text-link">
            {t("myPlan")}
          </Link>
        </div>
      </section>
    </BbCanvas>
  );
}
