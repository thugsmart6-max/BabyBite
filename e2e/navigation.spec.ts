import { expect, test } from "@playwright/test";
import {
  assertPrimaryCopyVisible,
  closeMenu,
  collectPageErrors,
  expectLoginGate,
  gotoReady,
  openMenu,
  VIEWPORTS,
} from "./helpers";

test.describe("public funnel navigation", () => {
  test.use({ viewport: VIEWPORTS.laptop });

  test("sends a logged-out visitor from / to landing", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/landing$/);
    await assertPrimaryCopyVisible(page, /what.?s for dinner/i);
  });

  test("keeps landing, login, and signup public", async ({ page }) => {
    await gotoReady(page, "/landing");
    await expect(page.getByRole("link", { name: /make a plan for my child/i }).first()).toBeVisible();

    await page.goto("/login");
    await expect(page).toHaveURL(/\/login$/);
    await assertPrimaryCopyVisible(page, /welcome back/i);

    await page.goto("/signup");
    await expect(page).toHaveURL(/\/signup$/);
    await expect(page.getByRole("heading", { name: /terms & conditions/i })).toBeVisible();
  });

  test("gates child, kitchen, and meal pages behind login", async ({ page }) => {
    await expectLoginGate(page, "/onboarding");
    await expectLoginGate(page, "/payment");
    await expectLoginGate(page, "/results");
    await expectLoginGate(page, "/success");
    await expectLoginGate(page, "/settings");
  });

  test("sends leftover dashboard URLs to landing", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/landing$/);

    await page.goto("/preview");
    await expect(page).toHaveURL(/\/landing$/);

    await page.goto("/legacy/dashboard");
    await expect(page).toHaveURL(/\/landing$/);

    await page.goto("/analysis");
    await expect(page).toHaveURL(/\/landing$/);
  });

  test("hero CTAs open signup and login", async ({ page }) => {
    await gotoReady(page, "/landing");
    await page.locator(".os-hero").getByRole("link", { name: /make a plan for my child/i }).click();
    await expect(page).toHaveURL(/\/signup$/);
    await expect(page.getByRole("heading", { name: /terms & conditions/i })).toBeVisible();

    await gotoReady(page, "/landing");
    await page.getByRole("link", { name: /i already have an account/i }).click();
    await expect(page).toHaveURL(/\/login$/);
    await assertPrimaryCopyVisible(page, /welcome back/i);
  });

  test("menu links stay on the public funnel", async ({ page }) => {
    await gotoReady(page, "/landing");
    await openMenu(page);
    await page.locator(".os-menu-full").getByRole("link", { name: /make a plan for my child/i }).click();
    await expect(page).toHaveURL(/\/signup$/);

    await gotoReady(page, "/signup");
    await openMenu(page);
    await page.locator(".os-menu-full").getByRole("link", { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/login$/);

    await gotoReady(page, "/login");
    await openMenu(page);
    await page.locator(".os-menu-full").getByRole("link", { name: /see how it looks/i }).click();
    await expect(page).toHaveURL(/\/landing$/);
  });

  test("wordmark and settings icon go to the right place", async ({ page }) => {
    await gotoReady(page, "/login");
    await page.getByRole("link", { name: "BabyBite" }).click();
    await expect(page).toHaveURL(/\/landing$/);

    await page.locator("a.os-mascot").click();
    await expect(page).toHaveURL(/\/login$/);
  });

  test("login and signup cross-links work", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("link", { name: /create one/i }).click();
    await expect(page).toHaveURL(/\/signup$/);

    await page.getByRole("link", { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/login$/);
    await assertPrimaryCopyVisible(page, /welcome back/i);
  });

  test("declining terms returns to landing", async ({ page }) => {
    await page.goto("/signup");
    await page.getByRole("button", { name: /decline/i }).click();
    await expect(page).toHaveURL(/\/landing$/);
  });

  test("accepting terms reveals the signup form", async ({ page }) => {
    await page.goto("/signup");
    const terms = page.locator(".os-terms-scroll");
    await terms.evaluate((el) => {
      el.scrollTop = el.scrollHeight;
      el.dispatchEvent(new Event("scroll"));
    });
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: /i agree/i }).click();
    await assertPrimaryCopyVisible(page, /create your account/i);
    await expect(page.getByLabel(/full name/i)).toBeVisible();
  });

  test("login shows field errors instead of leaving the page", async ({ page }) => {
    await page.goto("/login");
    await page.locator("form").getByRole("button", { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByText(/please enter a valid email/i)).toBeVisible();
  });

  test("does not advertise demo or free checkout", async ({ page }) => {
    for (const path of ["/landing", "/login", "/signup"]) {
      await page.goto(path);
      const body = (await page.locator("body").innerText()).toLowerCase();
      expect(body, path).not.toMatch(/\bdemo\b/);
      expect(body, path).not.toMatch(/\bfree\b/);
    }
  });
});

test.describe("language and theme", () => {
  test.use({ viewport: VIEWPORTS.phone });

  test("menu language buttons switch the landing headline", async ({ page }) => {
    const errors = collectPageErrors(page);
    await gotoReady(page, "/landing");
    await openMenu(page);
    await page.locator(".os-menu-full").getByRole("button", { name: "Tamil" }).click();
    await closeMenu(page);
    await expect(page.getByRole("heading", { name: "இன்றிரவு என்ன?" })).toBeVisible();

    await openMenu(page);
    await page.locator(".os-menu-full").getByRole("button", { name: "Hindi" }).click();
    await closeMenu(page);
    await expect(page.getByRole("heading", { name: "आज रात क्या है?" })).toBeVisible();
    expect(errors.filter((text) => /hydrat/i.test(text))).toEqual([]);
  });

  test("dark theme keeps the menu and headline readable", async ({ page }) => {
    await gotoReady(page, "/landing");
    await openMenu(page);
    await page.locator(".os-menu-full").getByRole("button", { name: /^dark$/i }).click();
    await expect(page.locator("html")).toHaveClass(/dark/);
    await expect(page.locator(".os-menu-full").getByRole("button", { name: /^light$/i })).toBeVisible();
    await expect(page.locator(".os-menu-close")).toBeVisible();
    await closeMenu(page);
    await assertPrimaryCopyVisible(page, /what.?s for dinner/i);
  });
});
