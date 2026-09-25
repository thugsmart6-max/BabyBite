"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  fetchBabyBiteProfile,
  BabyBiteApiError,
  type BabyBiteProfileResponse,
} from "@/lib/babybite-client";
import { translateApiError } from "@/lib/api-error-i18n";
import { useMotherLocale } from "@/components/providers/locale-provider";
import { ensureSessionReflectsPaid } from "@/lib/client-sync-paid-session";
import { readCurrentLocalUser } from "@/lib/local-user-store";

type FunnelOptions = {
  redirectIfPaid?: boolean;
  redirectIfUnauthed?: string;
  redirectIfNoChild?: string;
};

export function useBabyBiteProfile(options: FunnelOptions = {}) {
  const { lang } = useMotherLocale();
  const router = useRouter();
  const { data: session, status, update } = useSession();
  const [data, setData] = useState<BabyBiteProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    redirectIfPaid = false,
    redirectIfUnauthed,
    redirectIfNoChild,
  } = options;

  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      setLoading(false);
      if (redirectIfUnauthed) {
        router.replace(redirectIfUnauthed);
      }
      return;
    }

    let cancelled = false;
    setLoading(true);

    fetchBabyBiteProfile()
      .then(async (profile) => {
        if (cancelled) return;

        const childPaid =
          Boolean(profile.child?.hasPaid) || Boolean(readCurrentLocalUser()?.hasPaid);

        if (childPaid) {
          await ensureSessionReflectsPaid(
            update,
            true,
            Boolean(session?.user?.hasPaid)
          );
        }

        if (redirectIfPaid && childPaid) {
          router.replace("/results");
          return;
        }

        if (redirectIfNoChild && !profile.child?.id) {
          router.replace(redirectIfNoChild);
          return;
        }

        setData(profile);
        setError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(
          translateApiError(
            lang,
            err instanceof BabyBiteApiError ? err.message : undefined
          )
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [
    lang,
    redirectIfNoChild,
    redirectIfPaid,
    redirectIfUnauthed,
    router,
    session?.user?.hasPaid,
    status,
    update,
  ]);

  const childPaid =
    Boolean(data?.child?.hasPaid) || Boolean(readCurrentLocalUser()?.hasPaid);

  return {
    data,
    loading: loading || status === "loading",
    error,
    sessionStatus: status,
    childId: data?.child?.id ?? null,
    childHasPaid: childPaid,
    paymentOffer: data?.paymentOffer ?? null,
  };
}

/** @deprecated Use useBabyBiteProfile({ redirectIfPaid: true }) */
export function useBabyBiteFunnel(options: FunnelOptions = {}) {
  useBabyBiteProfile({ redirectIfPaid: options.redirectIfPaid ?? false });
}
