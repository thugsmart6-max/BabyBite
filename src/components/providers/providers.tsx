"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { LocaleProvider } from "@/components/providers/locale-provider";
import { LocalUserSync } from "@/components/providers/local-user-sync";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { CookieConsentBanner } from "@/components/shared/cookie-consent-banner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider refetchOnWindowFocus={false} refetchInterval={0}>
      <LocalUserSync />
      <ThemeProvider>
        <LocaleProvider>
          <TooltipProvider>
            {children}
            <CookieConsentBanner />
            <Toaster position="top-center" richColors closeButton />
          </TooltipProvider>
        </LocaleProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
