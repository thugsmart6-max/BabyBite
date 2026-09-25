export const COOKIE_CONSENT_KEY = "babybite-cookie-consent";

export function hasCookieConsentStored(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(COOKIE_CONSENT_KEY) === "accepted";
  } catch {
    return false;
  }
}
