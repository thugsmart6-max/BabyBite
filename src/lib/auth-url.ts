import { isLocalHostUrl, resolvePublicAppUrl } from "./app-url";

/** Last-resort production host when env is misconfigured on Vercel. */
export const LIVE_SITE = resolvePublicAppUrl() ?? "https://baby-bite.vercel.app";

const LOCAL_ORIGIN = "http://localhost:3000";

function isLocalHost(value: string): boolean {
  return isLocalHostUrl(value);
}

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
  const resolved = resolvePublicAppUrl();
  if (input.vercel && input.vercelEnv === "production") {
    return resolved ?? LIVE_SITE;
  }

  const configured = (input.authUrl || input.nextAuthUrl || "").replace(/\/$/, "");
  const isLocal = isLocalHost(configured);

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
  if (!process.env.VERCEL) return;

  const next = productionAuthUrl({
    authUrl: process.env.AUTH_URL,
    nextAuthUrl: process.env.NEXTAUTH_URL,
    vercel: true,
    vercelEnv: process.env.VERCEL_ENV,
    vercelUrl: process.env.VERCEL_URL,
    productionHost: process.env.VERCEL_PROJECT_PRODUCTION_URL,
  });

  if (!next) return;

  // Auth.js OAuth uses AUTH_URL / NEXTAUTH_URL for callback URLs — never leave localhost on Vercel.
  process.env.AUTH_URL = next;
  process.env.NEXTAUTH_URL = next;
  if (
    !process.env.NEXT_PUBLIC_APP_URL ||
    isLocalHost(process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, ""))
  ) {
    process.env.NEXT_PUBLIC_APP_URL = next;
  }
}

/** Auth.js `baseUrl` must not stay on localhost when the app runs on Vercel. */
export function sanitizeAuthBaseUrl(baseUrl: string): string {
  const trimmed = baseUrl.replace(/\/$/, "");
  if (!process.env.VERCEL) return trimmed;
  if (!isLocalHost(trimmed)) return trimmed;
  return (
    productionAuthUrl({
      authUrl: process.env.AUTH_URL,
      nextAuthUrl: process.env.NEXTAUTH_URL,
      vercel: true,
      vercelEnv: process.env.VERCEL_ENV,
      vercelUrl: process.env.VERCEL_URL,
      productionHost: process.env.VERCEL_PROJECT_PRODUCTION_URL,
    }) ?? LIVE_SITE
  );
}

/**
 * After Google / sign-in, Auth.js asks where to send the browser.
 * Local `npm run dev` must stay on localhost. Vercel must not bounce to localhost.
 */
export function rewriteAuthRedirect(url: string, baseUrl: string): string {
  const onVercel = Boolean(process.env.VERCEL);
  const rawBase = sanitizeAuthBaseUrl(baseUrl).replace(/\/$/, "");

  const origin = onVercel
    ? isLocalHost(rawBase)
      ? LIVE_SITE
      : rawBase
    : isLocalHost(rawBase)
      ? rawBase
      : LOCAL_ORIGIN;

  if (url.startsWith("/") && !url.startsWith("//")) {
    return url;
  }

  try {
    const next = new URL(url);
    if (isLocalHost(next.origin)) {
      return onVercel ? `${next.pathname}${next.search}` : url;
    }
    if (!onVercel && next.origin === LIVE_SITE.replace(/\/$/, "")) {
      return `${next.pathname}${next.search}`;
    }
    const live = LIVE_SITE.replace(/\/$/, "");
    if (onVercel && next.origin === live) {
      return `${next.pathname}${next.search}`;
    }
    if (next.origin === origin) {
      return `${next.pathname}${next.search}`;
    }
  } catch {
    /* ignore bad urls */
  }

  return onVercel ? "/landing" : `${origin}/landing`;
}
