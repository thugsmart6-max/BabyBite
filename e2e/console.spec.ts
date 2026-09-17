import { expect, test } from "@playwright/test";
import { collectPageErrors, gotoReady, VIEWPORTS } from "./helpers";

const PUBLIC_PATHS = ["/landing", "/login", "/signup"] as const;

test.describe("console and broken UI checks", () => {
  test.use({ viewport: VIEWPORTS.laptop });

  test("public pages load without page errors or missing primary UI", async ({ page }) => {
    const errors = collectPageErrors(page);

    await gotoReady(page, "/landing");
    await expect(page.getByRole("heading", { name: /what.?s for dinner/i })).toBeVisible();
    await expect(page.locator(".os-hero .bb-cta, .os-hero a.bb-cta, .os-hero a").first()).toBeVisible();

    await gotoReady(page, "/login");
    await expect(page.getByTestId("login-email")).toBeVisible();
    await expect(page.getByTestId("login-submit")).toBeVisible();

    await gotoReady(page, "/signup");
    await expect(page.getByRole("heading", { name: /terms & conditions/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /i agree/i })).toBeVisible();

    for (const path of PUBLIC_PATHS) {
      const res = await page.goto(path);
      expect(res?.ok(), `${path} HTTP ${res?.status()}`).toBeTruthy();
    }

    expect(errors).toEqual([]);
  });

  test("unknown routes show a friendly missing page", async ({ page }) => {
    const errors = collectPageErrors(page);
    await page.goto("/this-page-does-not-exist");
    await expect(page.getByRole("heading", { name: /on the table/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /^home$/i })).toBeVisible();
    expect(errors).toEqual([]);
  });
});
