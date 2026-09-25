"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useMotherLocale } from "@/components/providers/locale-provider";

const CONSENT_KEY = "babybite-cookie-consent";

export function CookieConsentBanner() {
  const { t } = useMotherLocale();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(CONSENT_KEY) === "accepted") return;
      setVisible(true);
    } catch {
      setVisible(true);
    }
  }, []);

  const accept = () => {
    try {
      localStorage.setItem(CONSENT_KEY, "accepted");
    } catch {
      /* private mode */
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="os-cookie-banner" role="dialog" aria-labelledby="cookie-banner-title">
      <div className="os-cookie-banner-inner">
        <p id="cookie-banner-title" className="os-cookie-banner-title">
          {t("cookieTitle")}
        </p>
        <p className="os-cookie-banner-body">{t("cookieBody")}</p>
        <div className="os-cookie-banner-actions">
          <button type="button" className="bb-cta is-compact" onClick={accept}>
            {t("cookieAccept")}
          </button>
          <Link href="/signup" className="os-text-link" onClick={accept}>
            {t("cookieLearn")}
          </Link>
        </div>
      </div>
    </div>
  );
}
