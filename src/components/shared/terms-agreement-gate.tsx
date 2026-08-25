"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { TERMS_VERSION } from "@/lib/constants";
import { termsAgreementLabel, termsDisclaimer, termsSectionsFor } from "@/lib/terms-copy";
import { useMotherLocale } from "@/components/providers/locale-provider";
import { cn } from "@/lib/utils";

type TermsAgreementGateProps = {
  onAccept: () => void;
  onDecline: () => void;
  className?: string;
  embedded?: boolean;
};

export function TermsAgreementGate({
  onAccept,
  onDecline,
  className,
  embedded = false,
}: TermsAgreementGateProps) {
  const { t, lang } = useMotherLocale();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrolledToEnd, setScrolledToEnd] = useState(false);
  const [checked, setChecked] = useState(false);
  const sections = termsSectionsFor(lang);

  const markIfFits = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (el.scrollHeight <= el.clientHeight + 16) setScrolledToEnd(true);
  }, []);

  useEffect(() => {
    markIfFits();
    const el = scrollRef.current;
    if (!el) return;
    const observer = new ResizeObserver(markIfFits);
    observer.observe(el);
    return () => observer.disconnect();
  }, [markIfFits, lang]);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const atEnd = el.scrollTop + el.clientHeight >= el.scrollHeight - 16;
    if (atEnd) setScrolledToEnd(true);
  }, []);

  const canAccept = scrolledToEnd && checked;

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

        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="os-terms-scroll"
          tabIndex={0}
        >
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

        {!scrolledToEnd ? <p className="os-terms-hint">{t("termsScroll")}</p> : null}

        <div className="os-terms-foot">
          <label className="os-terms-check">
            <input
              type="checkbox"
              checked={checked}
              disabled={!scrolledToEnd}
              onChange={(event) => setChecked(event.target.checked)}
              aria-describedby="terms-checkbox-hint"
            />
            <span id="terms-checkbox-hint">{termsAgreementLabel(lang)}</span>
          </label>

          <div className="os-band-actions">
            <button type="button" className="os-text-link" onClick={onDecline}>
              {t("termsDecline")}
            </button>
            <button type="button" className="bb-cta" disabled={!canAccept} onClick={onAccept}>
              {t("termsAgree")}
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
