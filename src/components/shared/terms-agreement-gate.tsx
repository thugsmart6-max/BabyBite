"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { TERMS_VERSION } from "@/lib/constants";
import { termsAgreementLabel, termsDisclaimer, termsSectionsFor } from "@/lib/terms-copy";
import { useMotherLocale } from "@/components/providers/locale-provider";
import { cn } from "@/lib/utils";

type TermsAgreementGateProps = {
  onAccept: () => void;
  onDecline: () => void;
  onGoogle?: () => void;
  className?: string;
  embedded?: boolean;
};

export function TermsAgreementGate({
  onAccept,
  onDecline,
  onGoogle,
  className,
  embedded = false,
}: TermsAgreementGateProps) {
  const { t, lang } = useMotherLocale();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [checked, setChecked] = useState(false);
  const sections = termsSectionsFor(lang);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = 0;
  }, [lang]);

  return (
    <div
      className={cn(embedded ? "os-terms" : "os-terms is-overlay", className)}
      role="dialog"
      aria-modal="true"
      aria-labelledby="terms-gate-title"
    >
      <div className="os-terms-panel">
        <div className="os-terms-head">
          <p className="os-band-kicker">{t("termsRequired")}</p>
          <h1 id="terms-gate-title" className="os-section-title">
            {t("termsTitle")}
          </h1>
          <p className="os-terms-lede">{termsDisclaimer(lang)}</p>
        </div>

        <div ref={scrollRef} className="os-terms-scroll" tabIndex={0}>
          <p className="os-band-kicker">
            {t("termsVersion")} {TERMS_VERSION}
          </p>
          <div className="os-terms-sections">
            {sections.map((section) => (
              <section key={section.title}>
                <h2>{section.title}</h2>
                <p>{section.body}</p>
              </section>
            ))}
          </div>
        </div>

        <div className="os-terms-foot">
          <label className="os-terms-check">
            <input
              type="checkbox"
              checked={checked}
              onChange={(event) => setChecked(event.target.checked)}
              aria-describedby="terms-checkbox-hint"
            />
            <span id="terms-checkbox-hint">{termsAgreementLabel(lang)}</span>
          </label>

          <div className="os-band-actions os-terms-actions">
            {onGoogle ? (
              <button type="button" className="bb-cta" disabled={!checked} onClick={onGoogle}>
                {t("continueGoogle")}
              </button>
            ) : null}
            <button
              type="button"
              className={onGoogle ? "os-text-link" : "bb-cta"}
              disabled={!checked}
              onClick={onAccept}
            >
              {t("termsAgree")}
            </button>
            <button type="button" className="os-text-link" onClick={onDecline}>
              {t("termsDecline")}
            </button>
          </div>

          <p className="os-terms-login">
            {t("haveAccountQ")}{" "}
            <Link href="/login" className="os-text-link">
              {t("signIn")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
