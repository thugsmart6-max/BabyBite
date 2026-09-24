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

type FunnelOptions = {
  redirectIfPaid?: boolean;
};

export function useBabyBiteProfile() {
  const { lang } = useMotherLocale();
  const [data, setData] = useState<BabyBiteProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBabyBiteProfile()
      .then((profile) => {
        setData(profile);
        setError(null);
      })
      .catch((err) => {
        setError(
          translateApiError(
            lang,
            err instanceof BabyBiteApiError ? err.message : undefined
          )
        );
      })
      .finally(() => setLoading(false));
  }, [lang]);

  return {
    data,
    loading,
    error,
    childId: data?.child?.id ?? null,
    paymentOffer: data?.paymentOffer ?? null,
  };
}

export function useBabyBiteFunnel(options: FunnelOptions = {}) {
  const router = useRouter();
  const { data: session, update } = useSession();
  const { redirectIfPaid = false } = options;

  useEffect(() => {
    fetchBabyBiteProfile()
      .then(async (json) => {
        if (!redirectIfPaid || !json.child?.hasPaid) return;
        await ensureSessionReflectsPaid(
          update,
          true,
          Boolean(session?.user?.hasPaid)
        );
        router.replace("/results");
      })
      .catch(() => {
        /* proxy + page-level error UI handle auth failures */
      });
  }, [router, redirectIfPaid, session?.user?.hasPaid, update]);
}
