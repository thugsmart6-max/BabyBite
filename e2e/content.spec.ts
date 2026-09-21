import { expect, test } from "@playwright/test";
import {
  acceptTerms,
  assertMinTap,
  assertNoHorizontalOverflow,
  assertPrimaryCopyVisible,
  closeMenu,
  gotoReady,
  openMenu,
  VIEWPORTS,
} from "./helpers";

test.describe("public content and friendly copy", () => {
  test.use({ viewport: VIEWPORTS.laptop });

  test("landing shows dinner-first sections and educational copy", async ({ page }) => {
    await gotoReady(page, "/landing");
    await assertPrimaryCopyVisible(page, /what.?s for dinner/i);
    await expect(page.getByRole("link", { name: /make a plan for my child/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /i already have an account/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /dinner is how you hold them/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /breakfast, then lunch/i })).toBeVisible();
    await expect(page.locator("#plates")).toBeVisible();
    await expect(page.locator("#how")).toBeVisible();
    await expect(page.getByRole("heading", { name: /other kids look taller/i })).toBeVisible();
    await expect(page.getByText(/educational guidance only/i).first()).toBeVisible();
    await expect(page.getByText(/we do not promise extra centimetres of height/i)).toBeVisible();

    const body = (await page.locator("body").innerText()).toLowerCase();
    expect(body).not.toMatch(/\bdemo\b/);
    expect(body).not.toMatch(/\bfree\b/);
    expect(body).not.toContain("egg dosa");
    expect(body).not.toContain("ragi idli");
    expect(body).not.toContain("rajma rice");
    await expect(page.getByRole("heading", { name: /help at the table/i })).toBeVisible();
  });

  test("see how it looks scrolls to the dinner steps", async ({ page }) => {
    await gotoReady(page, "/landing");
    await page.locator(".os-band").getByRole("link", { name: /see how it looks/i }).click();
    await expect(page.locator("#how")).toBeInViewport();
    await expect(page.getByRole("heading", { name: /no 7pm question/i }).first()).toBeVisible();
  });

  test("login copy and validation stay on the page", async ({ page }) => {
    await gotoReady(page, "/login");
    await assertPrimaryCopyVisible(page, /welcome back/i);
    await expect(page.getByText(/indian plates for mothers of kids 4–12/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /continue with google/i })).toBeVisible();
    await page.locator("form").getByRole("button", { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByText(/please enter a valid email/i)).toBeVisible();
  });

  test("terms stay closed until the mother ticks, then signup is usable", async ({ page }) => {
    await gotoReady(page, "/signup");
    await expect(page.getByRole("heading", { name: /terms & conditions/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /continue with google/i })).toBeDisabled();
    await expect(page.getByRole("button", { name: /i agree/i })).toBeDisabled();
    await page.getByRole("checkbox").check();
    await expect(page.getByRole("button", { name: /continue with google/i })).toBeEnabled();
    await expect(page.getByRole("button", { name: /i agree/i })).toBeEnabled();
    await page.getByRole("button", { name: /i agree/i }).click();
    await assertPrimaryCopyVisible(page, /create your account/i);
    await expect(page.getByText(/indian plates for mothers of kids 4–12/i)).toBeVisible();
    await expect(page.getByLabel(/full name/i)).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /continue with google/i })).toBeVisible();
    await page.getByRole("button", { name: /review terms/i }).click();
    await expect(page.getByRole("heading", { name: /terms & conditions/i })).toBeVisible();
  });

  test("signup form shows errors instead of leaving", async ({ page }) => {
    await gotoReady(page, "/signup");
    await acceptTerms(page);
    await page.getByRole("button", { name: /create account/i }).click();
    await expect(page).toHaveURL(/\/signup$/);
    await expect(page.getByText(/please enter/i).first()).toBeVisible();
  });
});

test.describe("mobile content and tap targets", () => {
  test("phone landing keeps hero, menu, and footer usable", async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.phone);
    await gotoReady(page, "/landing");
    await assertNoHorizontalOverflow(page, "phone landing content");
    const heroCta = page.locator(".os-hero").getByRole("link", { name: /make a plan for my child/i });
    await expect(heroCta).toBeVisible();
    await assertMinTap(await heroCta.boundingBox(), "hero plan CTA");
    await assertMinTap(await page.locator(".os-menu-btn").boundingBox(), "menu button");
    await expect(page.getByRole("heading", { name: /breakfast, then lunch/i })).toBeVisible();
    await expect(page.locator(".os-foot-tag")).toBeVisible();
  });

  test("phone terms keep Google and agree tappable without a scroll lock", async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.phoneSm);
    await gotoReady(page, "/signup");
    await assertNoHorizontalOverflow(page, "phone signup terms");
    const google = page.getByRole("button", { name: /continue with google/i });
    const agree = page.getByRole("button", { name: /i agree/i });
    await expect(google).toBeVisible();
    await expect(agree).toBeVisible();
    await assertMinTap(await google.boundingBox(), "terms Google CTA");
    const googleBox = await google.boundingBox();
    const agreeBox = await agree.boundingBox();
    expect(googleBox!.y + googleBox!.height).toBeLessThanOrEqual(VIEWPORTS.phoneSm.height + 1);
    expect(agreeBox!.y + agreeBox!.height).toBeLessThanOrEqual(VIEWPORTS.phoneSm.height + 1);
    await expect(google).toBeDisabled();
    await page.getByRole("checkbox").check();
    await expect(google).toBeEnabled();
  });

  test("phone login keeps email, sign in, and Google readable", async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.phone);
    await gotoReady(page, "/login");
    await assertNoHorizontalOverflow(page, "phone login");
    await expect(page.getByLabel(/email/i)).toBeVisible();
    const signIn = page.locator("form").getByRole("button", { name: /sign in/i });
    const google = page.getByRole("button", { name: /continue with google/i });
    await expect(signIn).toBeVisible();
    await expect(google).toBeVisible();
    await assertMinTap(await signIn.boundingBox(), "login sign in");
    await assertMinTap(await page.getByRole("button", { name: /show password/i }).boundingBox(), "show password");
  });

  test("open menu does not scroll the landing page behind it", async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.phone);
    await gotoReady(page, "/landing");
    await page.evaluate(() => window.scrollTo(0, 240));
    const before = await page.evaluate(() => window.scrollY);
    expect(before).toBeGreaterThan(100);
    await openMenu(page);
    await page.mouse.wheel(0, 500);
    await closeMenu(page);
    await expect.poll(async () => page.evaluate(() => window.scrollY)).toBeGreaterThanOrEqual(before - 2);
    const after = await page.evaluate(() => window.scrollY);
    expect(after).toBeLessThanOrEqual(before + 2);
  });
});
