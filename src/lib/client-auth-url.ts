import { isLocalHostUrl } from "@/lib/app-url";

/** If Auth.js returns an absolute localhost URL in production, stay on the live host. */
export function followAuthRedirect(url: string | null | undefined, fallbackPath = "/"): void {
  if (!url) {
    window.location.assign(fallbackPath);
    return;
  }
  if (url.startsWith("/")) {
    window.location.assign(url);
    return;
  }
  try {
    const next = new URL(url, window.location.origin);
    if (isLocalHostUrl(next.origin) && !isLocalHostUrl(window.location.origin)) {
      window.location.assign(`${next.pathname}${next.search}`);
      return;
    }
    if (next.origin === window.location.origin) {
      window.location.assign(`${next.pathname}${next.search}`);
      return;
    }
    window.location.assign(url);
  } catch {
    window.location.assign(fallbackPath);
  }
}
