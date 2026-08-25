export const PUBLIC_PAGE_PREFIXES = ["/landing"] as const;
export const AUTH_PAGE_PREFIXES = ["/login", "/signup"] as const;
export const PAID_PAGE_PREFIXES = ["/success", "/results"] as const;
export const LEGACY_PAGE_PREFIXES = ["/dashboard", "/legacy", "/preview", "/analysis"] as const;

export type FunnelGateInput = {
  pathname: string;
  isLoggedIn: boolean;
  onboardingComplete: boolean;
  hasPaid: boolean;
};

export type FunnelGateResult =
  | { type: "next" }
  | { type: "redirect"; path: string }
  | { type: "unauthorized" };

export function pathStartsWith(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function isAuthApi(pathname: string): boolean {
  return pathStartsWith(pathname, "/api/auth");
}

export function isApiRoute(pathname: string): boolean {
  return pathname.startsWith("/api/");
}

export function loginRedirectPath(pathname: string): string {
  const loginUrl = new URL("http://babybite.local/login");
  loginUrl.searchParams.set("callbackUrl", safeInternalPath(pathname));
  return `${loginUrl.pathname}?${loginUrl.searchParams.toString()}`;
}

/** Only same-origin paths. Stops `//evil` and other callback tricks. */
export function safeInternalPath(value: string | null | undefined, fallback = "/"): string {
  if (!value) return fallback;
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) {
    return fallback;
  }
  try {
    const url = new URL(value, "http://babybite.local");
    if (url.origin !== "http://babybite.local") return fallback;
    return `${url.pathname}${url.search}`;
  } catch {
    return fallback;
  }
}

/** Where a mother should land, based on how far she has got. */
export function homePathForUser(input: Omit<FunnelGateInput, "pathname">): string {
  if (!input.isLoggedIn) return "/landing";
  if (!input.onboardingComplete) return "/onboarding";
  if (!input.hasPaid) return "/payment";
  return "/results";
}

/** One next action, in kitchen language. Null when she is already doing it. */
export function nextMotherAction(input: FunnelGateInput): { href: string; label: string } | null {
  const { pathname } = input;

  if (!input.isLoggedIn) {
    if (pathStartsWith(pathname, "/signup")) return null;
    if (pathStartsWith(pathname, "/login")) {
      return { href: "/signup", label: "Make a plan for my child" };
    }
    return { href: "/signup", label: "Make a plan for my child" };
  }

  if (!input.onboardingComplete) {
    if (pathStartsWith(pathname, "/onboarding")) return null;
    return { href: "/onboarding", label: "Continue your child’s details" };
  }

  if (!input.hasPaid) {
    if (pathStartsWith(pathname, "/payment")) return null;
    return { href: "/payment", label: "Show my 30 days" };
  }

  if (pathStartsWith(pathname, "/results")) return null;
  return { href: "/results", label: "Open tonight’s meals" };
}

export function resolveFunnelGate(input: FunnelGateInput): FunnelGateResult {
  const { pathname, isLoggedIn, onboardingComplete, hasPaid } = input;

  if (isAuthApi(pathname)) {
    return { type: "next" };
  }

  if (isApiRoute(pathname)) {
    return isLoggedIn ? { type: "next" } : { type: "unauthorized" };
  }

  if (pathname === "/") {
    return { type: "redirect", path: homePathForUser(input) };
  }

  if (LEGACY_PAGE_PREFIXES.some((prefix) => pathStartsWith(pathname, prefix))) {
    return { type: "redirect", path: homePathForUser(input) };
  }

  const isAuthPage = AUTH_PAGE_PREFIXES.some((prefix) => pathStartsWith(pathname, prefix));
  if (isAuthPage) {
    if (isLoggedIn) {
      const destination = homePathForUser(input);
      if (!pathStartsWith(pathname, destination)) {
        return { type: "redirect", path: destination };
      }
    }
    return { type: "next" };
  }

  const isPublicPage = PUBLIC_PAGE_PREFIXES.some((prefix) => pathStartsWith(pathname, prefix));
  if (!isLoggedIn) {
    if (isPublicPage) return { type: "next" };
    return { type: "redirect", path: loginRedirectPath(pathname) };
  }

  if (!onboardingComplete && !pathStartsWith(pathname, "/onboarding")) {
    return { type: "redirect", path: "/onboarding" };
  }

  if (
    PAID_PAGE_PREFIXES.some((prefix) => pathStartsWith(pathname, prefix)) &&
    !hasPaid
  ) {
    return { type: "redirect", path: "/payment?reason=payment_required" };
  }

  return { type: "next" };
}
