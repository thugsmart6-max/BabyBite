/** Live Vercel site. Google Auth must never bounce to localhost. */
export const LIVE_SITE = "https://baby-bite.vercel.app";

/**
 * Auth.js uses AUTH_URL for Google’s callback.
 * If Vercel still has AUTH_URL=http://localhost:3000, Google sends mothers to localhost.
 */
export function productionAuthUrl(input: {
  authUrl?: string;
  nextAuthUrl?: string;
  vercel?: boolean;
  vercelEnv?: string;
  vercelUrl?: string;
  productionHost?: string;
}): string | undefined {
  if (input.vercel && input.vercelEnv === "production") {
    return LIVE_SITE;
  }

  const configured = (input.authUrl || input.nextAuthUrl || "").replace(/\/$/, "");
  const isLocal = /localhost|127\.0\.0\.1/i.test(configured);

  if (!input.vercel) {
    return configured || undefined;
  }

  if (configured && !isLocal) {
    return configured;
  }

  const host = input.vercelUrl || input.productionHost;
  if (!host) return LIVE_SITE;
  return host.startsWith("http") ? host.replace(/\/$/, "") : `https://${host}`;
}

export function applyProductionAuthUrl() {
  const next = productionAuthUrl({
    authUrl: process.env.AUTH_URL,
    nextAuthUrl: process.env.NEXTAUTH_URL,
    vercel: Boolean(process.env.VERCEL),
    vercelEnv: process.env.VERCEL_ENV,
    vercelUrl: process.env.VERCEL_URL,
    productionHost: process.env.VERCEL_PROJECT_PRODUCTION_URL,
  });

  if (!process.env.VERCEL) return;

  if (next) {
    process.env.AUTH_URL = next;
    if (process.env.NEXTAUTH_URL && /localhost|127\.0\.0\.1/i.test(process.env.NEXTAUTH_URL)) {
      process.env.NEXTAUTH_URL = next;
    }
  }
}

export function rewriteAuthRedirect(url: string, baseUrl: string): string {
  const origin = /localhost|127\.0\.0\.1/i.test(baseUrl) ? LIVE_SITE : baseUrl.replace(/\/$/, "");

  if (url.startsWith("/")) return `${origin}${url}`;

  try {
    const next = new URL(url);
    if (/localhost|127\.0\.0\.1/i.test(next.origin)) {
      return `${origin}${next.pathname}${next.search}`;
    }
    if (next.origin === origin || next.origin === LIVE_SITE) return url;
  } catch {
    /* ignore bad urls */
  }

  return `${origin}/landing`;
}
