"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  fetchKidFuelProfile,
  KidFuelApiError,
  type KidFuelProfileResponse,
} from "@/lib/kidfuel-client";

type FunnelOptions = {
  redirectIfPaid?: boolean;
};

export function useKidFuelProfile() {
  const [data, setData] = useState<KidFuelProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchKidFuelProfile()
      .then((profile) => {
        setData(profile);
        setError(null);
      })
      .catch((err) => {
        setError(err instanceof KidFuelApiError ? err.message : "Failed to load profile");
      })
      .finally(() => setLoading(false));
  }, []);

  return { data, loading, error, childId: data?.child?.id ?? null };
}

export function useKidFuelFunnel(options: FunnelOptions = {}) {
  const router = useRouter();
  const { redirectIfPaid = false } = options;

  useEffect(() => {
    fetchKidFuelProfile()
      .then((json) => {
        if (redirectIfPaid && json.child?.hasPaid) {
          router.replace("/results");
        }
      })
      .catch(() => {
        /* proxy + page-level error UI handle auth failures */
      });
  }, [router, redirectIfPaid]);
}
