import { expect, test } from "@playwright/test";
import {
  assertNoHorizontalOverflow,
  collectPageErrors,
  completeOnboarding,
  expectLocalSession,
  expectLocalSessionCleared,
  loginWithCredentials,
  logoutFromMenu,
  paySimulatedCheckout,
  readLocalUserStore,
  signUpNewMother,
  VIEWPORTS,
  waitForResults,
} from "./helpers";

test.describe("new email funnel", () => {
  test.use({ viewport: VIEWPORTS.laptop });
  test.describe.configure({ timeout: 90_000 });

  test("creates a user on signup, pays, then reuses the same email on re-login", async ({ page }) => {
    const errors = collectPageErrors(page);
    const stamp = Date.now();
    const email = `mother.dev.${stamp}@example.com`;
    const password = "Kitchen159";

    await signUpNewMother(page, { name: "Kitchen Amma", email, password });
    await expectLocalSession(page, email);
    expect((await readLocalUserStore(page)).users[email.toLowerCase()]).toMatchObject({
      email: email.toLowerCase(),
      onboardingComplete: false,
    });

    await completeOnboarding(page, "Anika");
    await expect(page.getByRole("heading", { name: /tonight, written/i })).toBeVisible();
    await expect(page.getByTestId("pay-now")).toBeVisible();

    await paySimulatedCheckout(page);
    await waitForResults(page);
    await expect(page.locator("#table")).toBeVisible();
    await expect(page.locator("#table").getByRole("tab", { name: /today/i })).toBeVisible();

    const afterPay = await readLocalUserStore(page);
    expect(Object.keys(afterPay.users).filter((key) => key === email.toLowerCase())).toHaveLength(1);

    await logoutFromMenu(page);
    await expectLocalSessionCleared(page, email);

    await loginWithCredentials(page, email, password);
    await expectLocalSession(page, email);
    await waitForResults(page);

    const afterRelogin = await readLocalUserStore(page);
    expect(Object.keys(afterRelogin.users).filter((key) => key === email.toLowerCase())).toHaveLength(1);
    expect(JSON.stringify(afterRelogin).toLowerCase()).not.toContain("password");
    expect(errors).toEqual([]);
  });
});

test.describe("authenticated screens stay usable", () => {
  test.describe.configure({ timeout: 90_000 });

  test("phone, tablet, and desktop keep the kitchen screens inside the viewport", async ({ page }) => {
    const errors = collectPageErrors(page);
    const email = `mother.dev.ui.${Date.now()}@example.com`;
    await signUpNewMother(page, { name: "Tablet Amma", email, password: "Kitchen159" });
    await completeOnboarding(page, "Kabir");

    for (const [name, viewport] of Object.entries({
      phone: VIEWPORTS.phone,
      tablet: VIEWPORTS.tablet,
      desktop: VIEWPORTS.desktop,
    })) {
      await page.setViewportSize(viewport);
      await page.goto("/payment");
      await expect(page.getByTestId("pay-now")).toBeVisible();
      await assertNoHorizontalOverflow(page, `${name} payment`);

      if (name === "phone") {
        await expect(page.locator(".os-auth-pack")).toBeHidden();
      }
    }

    await page.setViewportSize(VIEWPORTS.laptop);
    await paySimulatedCheckout(page);
    await waitForResults(page);

    for (const [name, viewport] of Object.entries({
      phoneSm: VIEWPORTS.phoneSm,
      phone: VIEWPORTS.phone,
      tablet: VIEWPORTS.tablet,
      laptop: VIEWPORTS.laptop,
      desktop: VIEWPORTS.desktop,
      tv: VIEWPORTS.tv,
      tv55: VIEWPORTS.tv55,
    })) {
      await page.setViewportSize(viewport);
      await page.goto("/results");
      await waitForResults(page);
      await assertNoHorizontalOverflow(page, `${name} results`);
      await page.getByTestId("results-room-problems").click();
      await page.getByTestId("kitchen-option-tenMin").click();
      await assertNoHorizontalOverflow(page, `${name} results by-problem`);
      await page.goto("/settings");
      await expect(page.getByTestId("logout-button").first()).toBeVisible();
      await assertNoHorizontalOverflow(page, `${name} settings`);
    }

    expect(errors).toEqual([]);
  });
});
