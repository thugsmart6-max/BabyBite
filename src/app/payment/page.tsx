"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { BbCanvas } from "@/components/babybite/bb-canvas";
import { SiteArt } from "@/components/babybite/oats-brand";
import { KitchenSkeleton } from "@/components/babybite/page-skeleton";
import { LoaderFive, LoaderOne } from "@/components/ui/loader";
import { useBabyBiteFunnel, useBabyBiteProfile } from "@/hooks/use-babybite-funnel";
import { COMPLETE_BUNDLE_CHECKOUT, formatRupee } from "@/lib/babybite-pricing";
import { patchCurrentLocalUser } from "@/lib/local-user-store";
import { toast } from "sonner";
import { ErrorState } from "@/components/shared/error-state";
import { useMotherLocale } from "@/components/providers/locale-provider";

const CHECKOUT = COMPLETE_BUNDLE_CHECKOUT;
const PROCESS_MS = 1800;
const DONE_MS = 900;

function pause(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export default function PaymentPage() {
  const { t } = useMotherLocale();
  const router = useRouter();
  const { update } = useSession();
  const [phase, setPhase] = useState<"idle" | "processing" | "done">("idle");
  const { childId, loading: profileLoading, error: profileError } = useBabyBiteProfile();

  useBabyBiteFunnel({ redirectIfPaid: true });

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
    setPhase("processing");
    const started = Date.now();
    try {
      const res = await fetch("/api/babybite/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          childProfileId: childId,
          planTier: "complete-bundle",
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? t("couldNotLoad"));
      const wait = PROCESS_MS - (Date.now() - started);
      if (wait > 0) await pause(wait);
      setPhase("done");
      await pause(DONE_MS);
      patchCurrentLocalUser({ hasPaid: true });
      await update({ hasPaid: true });
      window.location.assign("/success");
    } catch (e) {
      setPhase("idle");
      toast.error(e instanceof Error ? e.message : t("couldNotLoad"));
    }
  };

  if (profileLoading) {
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
          <article className="os-pay-deal">
            <p className="os-pay-now">{formatRupee(CHECKOUT.salePrice)}</p>
            <p className="os-pay-just">{t("payJust")}</p>
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
          {!childId ? (
            <Link href="/login?callbackUrl=/payment" className="bb-cta">
              {t("signIn")}
            </Link>
          ) : (
            <button
              type="button"
              className="bb-cta"
              data-testid="pay-now"
              onClick={buyPdfAccess}
              disabled={busy}
              aria-busy={busy}
            >
              {busy ? t("paying") : t("payNowBtn")}
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
