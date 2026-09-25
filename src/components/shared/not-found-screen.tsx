"use client";

import Link from "next/link";
import { BbCanvas } from "@/components/babybite/bb-canvas";
import { useMotherLocale } from "@/components/providers/locale-provider";

export function NotFoundScreen() {
  const { t } = useMotherLocale();

  return (
    <BbCanvas full className="os-not-found">
      <section className="os-not-found-hero">
        <p className="os-band-kicker">{t("lostTitle")}</p>
        <h1 className="os-hero-title">{t("pageMissing")}</h1>
        <p className="os-onboard-lede">{t("notFoundLede")}</p>
        <div className="os-band-actions os-hero-actions os-not-found-actions">
          <Link href="/signup" className="bb-cta">
            {t("makePlan")}
          </Link>
          <Link href="/landing" className="os-text-link">
            {t("goHome")}
          </Link>
        </div>
        <p className="os-compare-note">
          <Link href="/login" className="os-text-link">
            {t("haveAccount")}
          </Link>
        </p>
      </section>
    </BbCanvas>
  );
}
