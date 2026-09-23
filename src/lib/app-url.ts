/** Shared app origin resolution — never hardcode localhost in feature code. */

export function isLocalHostUrl(value: string): boolean {
  return /localhost|127\.0\.0\.1/i.test(value);
}

/**
 * Canonical public site URL for redirects (server / build time).
 * Prefer NEXT_PUBLIC_APP_URL or AUTH_URL when not localhost; then Vercel host.
 */
export function resolvePublicAppUrl(): string | undefined {
  const candidates = [
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.AUTH_URL,
    process.env.NEXTAUTH_URL,
  ].filter(Boolean) as string[];

  for (const raw of candidates) {
    const trimmed = raw.replace(/\/$/, "");
    if (trimmed && !isLocalHostUrl(trimmed)) return trimmed;
  }

  if (process.env.VERCEL_ENV === "production" && process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL.replace(/\/$/, "")}`;
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/\/$/, "")}`;
  }

  return undefined;
}

/** Browser-safe post-auth navigation — always same-origin relative paths. */
export function clientAuthCallbackPath(fallback = "/"): string {
  if (typeof window === "undefined") return fallback;
  try {
    const path = window.location.pathname + window.location.search;
    if (path.startsWith("/") && !path.startsWith("//")) return path || fallback;
  } catch {
    /* ignore */
  }
  return fallback;
}
