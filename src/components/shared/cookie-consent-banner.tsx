"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMotherLocale } from "@/components/providers/locale-provider";
import { COOKIE_CONSENT_KEY, hasCookieConsentStored } from "@/lib/cookie-consent";

export function CookieConsentBanner() {
  const { t } = useMotherLocale();
  const pathname = usePathname();
  const onTermsFlow = pathname === "/signup" || pathname === "/login";
  const mounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false
  );
  const [dismissed, setDismissed] = useState(false);

  const accept = () => {
    try {
      localStorage.setItem(COOKIE_CONSENT_KEY, "accepted");
    } catch {
      /* private mode */
    }
    setDismissed(true);
  };

  if (!mounted || onTermsFlow || dismissed || hasCookieConsentStored()) {
    return null;
  }

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
          <Link href="/landing#how" className="os-text-link" onClick={accept}>
            {t("cookieLearn")}
          </Link>
        </div>
      </div>
    </div>
  );
}
