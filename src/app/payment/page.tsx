"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { BbCanvas } from "@/components/kidfuel/bb-canvas";
import { SiteArt, OsBusy } from "@/components/kidfuel/oats-brand";
import { useKidFuelFunnel, useKidFuelProfile } from "@/hooks/use-kidfuel-funnel";
import { COMPLETE_BUNDLE_CHECKOUT, formatRupee } from "@/lib/kidfuel-pricing";
import { toast } from "sonner";
import { ErrorState } from "@/components/shared/error-state";
import { useMotherLocale } from "@/components/providers/locale-provider";

const CHECKOUT = COMPLETE_BUNDLE_CHECKOUT;

export default function PaymentPage() {
  const { t } = useMotherLocale();
  const router = useRouter();
  const { update } = useSession();
  const [loading, setLoading] = useState(false);
  const { childId, loading: profileLoading, error: profileError } = useKidFuelProfile();

  useKidFuelFunnel({ redirectIfPaid: true });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("reason") === "payment_required") {
      toast.error(t("finishStep"));
    }
  }, [t]);

  const buyPdfAccess = async () => {
    if (!childId) {
      toast.error(t("signInFirst"));
      router.push("/login?callbackUrl=/payment");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/kidfuel/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          childProfileId: childId,
          planTier: "complete-bundle",
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? t("couldNotLoad"));
      await update({ hasPaid: true });
      router.push("/success");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("couldNotLoad"));
    } finally {
      setLoading(false);
    }
  };

  if (profileLoading) {
    return (
      <BbCanvas full>
        <OsBusy />
      </BbCanvas>
    );
  }

  return (
    <BbCanvas full className="os-onboard">
      <section className="os-auth-grid">
        <div className="os-onboard-form">
          <p className="os-band-kicker">{t("payKicker")}</p>
          <h1 className="os-auth-title">{t("payTitle")}</h1>
          <article className="os-pay-deal">
            <p className="os-pay-off">{t("payOff")}</p>
            <p className="os-pay-was">{formatRupee(CHECKOUT.originalPrice)}</p>
            <p className="os-pay-now">{formatRupee(CHECKOUT.salePrice)}</p>
            <p className="os-pay-just">{t("payJust")}</p>
          </article>

          <p className="os-onboard-lede">{t("paySecure")}</p>

          <ul className="os-pay-points">
            <li>{t("payCalendar")}</li>
            <li>{t("payRhythm")}</li>
            <li>{t("payFridge")}</li>
            <li>{t("payNotes")}</li>
          </ul>
          <p className="os-pdf-copy">{t("eduOnly")}</p>

          {profileError ? <ErrorState message={profileError} /> : null}
          {!childId ? (
            <Link href="/login?callbackUrl=/payment" className="bb-cta">
              {t("signIn")}
            </Link>
          ) : (
            <button type="button" className="bb-cta" onClick={buyPdfAccess} disabled={loading}>
              {loading ? t("paying") : t("payNowBtn")}
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
