"use client";

import Link from "next/link";
import Image from "next/image";
import { useMotherLocale } from "@/components/providers/locale-provider";

/** Bottom landing CTA — BabyBite visual language (reference: public/footer.png). */
export function LandingPlanFooter() {
  const { t } = useMotherLocale();

  return (
    <section className="os-plan-footer" aria-labelledby="os-plan-footer-title">
      <div className="os-plan-footer-inner">
        <div className="os-plan-footer-art">
          <div className="os-plan-footer-blob" aria-hidden />
          <Image
            src="/footer.png"
            alt={t("footerIllustrationAlt")}
            width={420}
            height={420}
            className="os-plan-footer-illustration"
            priority={false}
          />
        </div>
        <div className="os-plan-footer-copy">
          <p className="os-band-kicker">{t("tonight")}</p>
          <h2 id="os-plan-footer-title" className="os-plan-footer-title">
            {t("whatsDinner")}
          </h2>
          <p className="os-plan-footer-tagline">{t("heroNotQuestion")}</p>
          <p className="os-plan-footer-lede">{t("bandBody")}</p>
          <div className="os-plan-footer-actions">
            <Link href="/signup" className="bb-cta os-plan-footer-cta">
              {t("makePlan")}
            </Link>
            <a href="#how" className="os-text-link">
              {t("seeHow")}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
