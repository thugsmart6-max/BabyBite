"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { BbCanvas } from "@/components/babybite/bb-canvas";
import { KitchenSkeleton } from "@/components/babybite/page-skeleton";
import { SiteArt } from "@/components/babybite/oats-brand";
import { fetchBabyBiteProfile } from "@/lib/babybite-client";
import { celebrateMilestone } from "@/lib/utils/confetti";
import { useMotherLocale } from "@/components/providers/locale-provider";

export default function SuccessPage() {
  const router = useRouter();
  const { t } = useMotherLocale();
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    celebrateMilestone();
  }, []);

  useEffect(() => {
    let cancelled = false;

    fetchBabyBiteProfile()
      .then(async (profile) => {
        if (cancelled) return;

        if (!profile.child?.id) {
          router.replace("/onboarding");
          return;
        }

        if (!profile.child.hasPaid) {
          toast.error(t("finishStep"));
          router.replace("/payment?reason=payment_required");
          return;
        }

        try {
          const res = await fetch("/api/babybite/plans", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ childProfileId: profile.child.id }),
          });
          const json = await res.json();

          if (cancelled) return;

          if (res.status === 402) {
            toast.error(t("finishStep"));
            router.replace("/payment?reason=payment_required");
            return;
          }

          if (!res.ok) {
            setError(json.error ?? t("failedPlan"));
            return;
          }

          setReady(true);
        } catch {
          if (!cancelled) setError(t("couldNotLoad"));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError(t("signInFirst"));
        }
      });

    return () => {
      cancelled = true;
    };
  }, [router, t]);

  useEffect(() => {
    if (!ready) return;
    const timer = window.setTimeout(() => router.push("/results"), 4200);
    return () => window.clearTimeout(timer);
  }, [ready, router]);

  if (error) {
    return (
      <BbCanvas full>
        <section className="os-results-hero os-results-empty">
          <p className="os-band-kicker">{t("tonight")}</p>
          <h1 className="os-hero-title">{t("couldNotLoad")}</h1>
          <p className="os-onboard-lede">{error}</p>
          <button type="button" className="bb-cta" onClick={() => router.push("/payment")}>
            {t("back")}
          </button>
        </section>
      </BbCanvas>
    );
  }

  if (!ready) {
    return (
      <BbCanvas full>
        <KitchenSkeleton note={t("successWriting")} />
      </BbCanvas>
    );
  }

  return (
    <BbCanvas full className="os-results">
      <section className="os-results-hero">
        <p className="os-band-kicker">{t("successKicker")}</p>
        <h1 className="os-hero-title">{t("successTitle")}</h1>
        <SiteArt src="/art-tiffin.png" alt={t("artTiffin")} variant="tiffin" priority />
        <p className="os-onboard-lede">{t("successBody")}</p>
        <button type="button" className="bb-cta" onClick={() => router.push("/results")}>
          {t("openTonight")}
        </button>
      </section>
    </BbCanvas>
  );
}
