/* eslint-disable react-hooks/rules-of-hooks -- Playwright fixture `use` is not React */
import { test as base, expect } from "@playwright/test";

const COOKIE_CONSENT_KEY = "babybite-cookie-consent";

export const test = base.extend({
  context: async ({ context }, use) => {
    await context.addInitScript((key) => {
      try {
        localStorage.setItem(key, "accepted");
      } catch {
        /* private mode */
      }
    }, COOKIE_CONSENT_KEY);
    await use(context);
  },
});

export { expect };
