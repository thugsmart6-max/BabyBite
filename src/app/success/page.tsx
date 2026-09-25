"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { ensureSessionReflectsPaid } from "@/lib/client-sync-paid-session";
import { BbCanvas } from "@/components/babybite/bb-canvas";
import { KitchenSkeleton } from "@/components/babybite/page-skeleton";
import { fetchBabyBiteProfile } from "@/lib/babybite-client";
import { readCurrentLocalUser } from "@/lib/local-user-store";
import { useMotherLocale } from "@/components/providers/locale-provider";

export default function SuccessPage() {
  const router = useRouter();
  const { data: session, update } = useSession();
  const { t } = useMotherLocale();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetchBabyBiteProfile()
      .then(async (profile) => {
        if (cancelled) return;

        if (!profile.child?.id) {
          router.replace("/onboarding");
          return;
        }

        const paid =
          Boolean(profile.child.hasPaid) || Boolean(readCurrentLocalUser()?.hasPaid);

        if (!paid) {
          toast.error(t("finishStep"));
          router.replace("/payment?reason=payment_required");
          return;
        }

        await ensureSessionReflectsPaid(
          update,
          true,
          Boolean(session?.user?.hasPaid)
        );

        const res = await fetch("/api/babybite/plans", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ childProfileId: profile.child.id }),
        });
        const json = await res.json();

        if (cancelled) return;

        if (res.status === 402) {
          router.replace("/payment?reason=payment_required");
          return;
        }

        if (!res.ok) {
          setError(json.error ?? t("failedPlan"));
          return;
        }

        router.replace("/results");
      })
      .catch(() => {
        if (!cancelled) setError(t("signInFirst"));
      });

    return () => {
      cancelled = true;
    };
  }, [router, session?.user?.hasPaid, t, update]);

  if (error) {
    return (
      <BbCanvas full>
        <section className="os-results-hero os-results-empty">
          <p className="os-onboard-lede">{error}</p>
          <button type="button" className="bb-cta" onClick={() => router.push("/payment")}>
            {t("back")}
          </button>
        </section>
      </BbCanvas>
    );
  }

  return (
    <BbCanvas full>
      <KitchenSkeleton note={t("successWriting")} />
    </BbCanvas>
  );
}
