"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  endLocalSession,
  finishLocalLogout,
  isLocalLogoutInProgress,
  rememberLocalUser,
} from "@/lib/local-user-store";

/** Keeps one localStorage record per email in sync with the signed-in session. */
export function LocalUserSync() {
  const { data, status } = useSession();

  useEffect(() => {
    if (status === "loading") return;

    if (status === "authenticated" && data?.user?.email) {
      if (isLocalLogoutInProgress()) return;

      rememberLocalUser({
        email: data.user.email,
        name: data.user.name ?? undefined,
        userId: data.user.id,
        onboardingComplete: data.user.onboardingComplete,
        hasPaid: data.user.hasPaid,
      });
      return;
    }

    if (status === "unauthenticated") {
      finishLocalLogout();
      endLocalSession();
    }
  }, [status, data]);

  return null;
}
