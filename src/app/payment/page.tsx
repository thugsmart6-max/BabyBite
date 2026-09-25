"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { fetchJson, clearClientFetchCache } from "@/lib/client-fetch";
import { translateApiError } from "@/lib/api-error-i18n";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { BbCanvas } from "@/components/babybite/bb-canvas";
import { SiteArt } from "@/components/babybite/oats-brand";
import { KitchenSkeleton } from "@/components/babybite/page-skeleton";
import { LoaderFive, LoaderOne } from "@/components/ui/loader";
import { useBabyBiteProfile } from "@/hooks/use-babybite-funnel";
import { formatRupee } from "@/lib/babybite-pricing";
import {
  formatOfferTimeRemaining,
  PAYMENT_LIST_PRICE_INR,
  resolvePaymentOffer,
} from "@/lib/payment-offer";
import { patchCurrentLocalUser } from "@/lib/local-user-store";
import { toast } from "sonner";
import { ErrorState } from "@/components/shared/error-state";
import { useMotherLocale } from "@/components/providers/locale-provider";

export default function PaymentPage() {
  const { t, lang } = useMotherLocale();
  const router = useRouter();
  const { update } = useSession();
  const [phase, setPhase] = useState<"idle" | "processing" | "done">("idle");
  const [tick, setTick] = useState(0);
  const payLock = useRef(false);
  const {
    childId,
    loading: profileLoading,
    error: profileError,
    paymentOffer,
    sessionStatus,
  } = useBabyBiteProfile({
    redirectIfPaid: true,
    redirectIfUnauthed: "/login?callbackUrl=/payment",
    redirectIfNoChild: "/onboarding",
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("reason") === "payment_required") {
      toast.error(t("finishStep"));
    }
  }, [t]);

  useEffect(() => {
    const id = window.setInterval(() => setTick((n) => n + 1), 1000);
    return () => window.clearInterval(id);
  }, []);

  const offer = useMemo(() => {
    if (paymentOffer) {
      if (!paymentOffer.endsAt || paymentOffer.tier === "list") return paymentOffer;
      const ends = new Date(paymentOffer.endsAt).getTime();
      // eslint-disable-next-line react-hooks/purity -- countdown uses wall clock via tick
      const msRemaining = Math.max(0, ends - Date.now());
      return { ...paymentOffer, msRemaining };
    }
    return resolvePaymentOffer(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- tick refreshes countdown every second
  }, [paymentOffer, tick]);

  const offerLabel =
    offer.offerBadge === "50" ? t("payOff50") : offer.offerBadge === "80" ? t("payOff") : null;

  const buyPdfAccess = async () => {
    if (!childId) {
      toast.error(t("finishStep"));
      router.replace("/onboarding");
      return;
    }
    if (payLock.current || phase !== "idle") return;
    payLock.current = true;
    setPhase("processing");
    try {
      const { res, json } = await fetchJson<{ error?: string; alreadyPaid?: boolean; plan?: unknown }>(
        "/api/babybite/payment",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            childProfileId: childId,
            planTier: "complete-bundle",
          }),
        }
      );
      if (!res.ok) {
        throw new Error(translateApiError(lang, json.error) || t("couldNotLoad"));
      }
      if (json.alreadyPaid) {
        toast.info(t("paymentAlreadyDone"));
      }

      patchCurrentLocalUser({ hasPaid: true });
      await update({ hasPaid: true });
      clearClientFetchCache();

      const { res: planRes, json: planJson } = await fetchJson<{ plan?: unknown; error?: string }>(
        "/api/babybite/plans",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ childProfileId: childId, regenerate: true }),
        }
      );
      if (!planRes.ok || !planJson.plan) {
        throw new Error(translateApiError(lang, planJson.error) || t("failedPlan"));
      }

      toast.success(t("paySuccessShort"));
      setPhase("done");
      window.location.assign("/results");
    } catch (e) {
      setPhase("idle");
      if (e instanceof Error && e.message === "REQUEST_TIMEOUT") {
        toast.error(t("requestTimeout"));
      } else {
        toast.error(e instanceof Error ? e.message : t("couldNotLoad"));
      }
    } finally {
      payLock.current = false;
    }
  };

  if (profileLoading || sessionStatus === "loading") {
    return (
      <BbCanvas full>
        <KitchenSkeleton />
      </BbCanvas>
    );
  }

  const busy = phase !== "idle";

  return (
    <BbCanvas full className="os-onboard">
      {busy ? (
        <div className="os-pay-wait" data-testid="pay-loader" role="status" aria-live="polite">
          {phase === "processing" ? (
            <>
              <LoaderOne />
              <LoaderFive text={t("processing")} />
            </>
          ) : (
            <p className="os-pay-done">{t("done")}</p>
          )}
        </div>
      ) : null}
      <section className="os-auth-grid">
        <div className="os-onboard-form">
          <p className="os-band-kicker">{t("payKicker")}</p>
          <h1 className="os-auth-title">{t("payTitle")}</h1>
          <article className="os-pay-deal" data-testid="pay-offer" data-offer-tier={offer.tier}>
            {offer.showStrike ? (
              <>
                <p className="os-pay-was">{formatRupee(PAYMENT_LIST_PRICE_INR)}</p>
                {offerLabel ? <p className="os-pay-off">{offerLabel}</p> : null}
              </>
            ) : offer.tier === "list" ? (
              <p className="os-pay-off">{t("payListPrice")}</p>
            ) : null}
            <p className="os-pay-now">{formatRupee(offer.finalPrice)}</p>
            <p className="os-pay-just">
              {formatRupee(offer.finalPrice)} {t("payJustBundle")}
            </p>
            {offer.msRemaining > 0 && offer.tier !== "list" ? (
              <p className="os-compare-note" data-testid="pay-offer-countdown" aria-live="polite">
                {t("payOfferEnds")}{" "}
                <span className="os-pay-countdown">{formatOfferTimeRemaining(offer.msRemaining)}</span>
              </p>
            ) : null}
          </article>

          <p className="os-onboard-lede">{t("paySecure")}</p>

          <ul className="os-pay-points">
            <li>{t("payGrowth")}</li>
            <li>{t("payCalendar")}</li>
            <li>{t("payRhythm")}</li>
            <li>{t("payFridge")}</li>
            <li>{t("payNotes")}</li>
          </ul>
          <p className="os-pdf-copy">{t("eduOnly")}</p>
          <p className="os-compare-note">{t("trustLine")}</p>

          {profileError ? <ErrorState message={profileError} /> : null}
          {sessionStatus === "unauthenticated" ? (
            <Link href="/login?callbackUrl=/payment" className="bb-cta" data-testid="pay-sign-in">
              {t("signIn")}
            </Link>
          ) : (
            <button
              type="button"
              className="bb-cta"
              data-testid="pay-now"
              onClick={buyPdfAccess}
              disabled={busy || !childId}
              aria-busy={busy}
            >
              {busy ? t("paying") : `${formatRupee(offer.finalPrice)} · ${t("payNowShort")}`}
            </button>
          )}
        </div>

        <div className="os-auth-pack">
          <SiteArt src="/art-tiffin.png" alt={t("artTiffin")} variant="tiffin" priority />
        </div>
      </section>
    </BbCanvas>
  );
}
