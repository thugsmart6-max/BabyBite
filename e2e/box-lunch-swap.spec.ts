import { expect, test } from "@playwright/test";
import {
  assertNoHorizontalOverflow,
  completeOnboarding,
  paySimulatedCheckout,
  signUpNewMother,
  VIEWPORTS,
  waitForResults,
} from "./helpers";

test.describe("Box Lunch Swap", () => {
  test.use({ viewport: VIEWPORTS.laptop });
  test.describe.configure({ timeout: 120_000 });

  test("opens swap modal, selects meal, confirms, persists after reload", async ({ page }) => {
    const email = `mother.swap.${Date.now()}@example.com`;
    await signUpNewMother(page, { name: "Swap Amma", email, password: "Kitchen159" });
    await completeOnboarding(page, "Riya", { schoolTiffin: true });
    await paySimulatedCheckout(page);
    await waitForResults(page);

    await expect(page.getByText(/packable lunch/i).first()).toBeVisible();

    await page.getByTestId("box-lunch-swap-open").click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByTestId("confirm-lunch-swap")).toBeDisabled();

    const option = page.locator("[data-testid^='lunch-swap-option-']").first();
    await expect(option).toBeVisible();
    const optionName = await option.locator(".os-box-lunch-option-name").innerText();
    await option.click();
    await expect(page.getByTestId("confirm-lunch-swap")).toBeEnabled();

    await page.getByTestId("confirm-lunch-swap").click();
    await expect(page.getByText(/packable lunch updated/i)).toBeVisible({ timeout: 15_000 });

    await page.reload();
    await waitForResults(page);
    await expect(page.getByText(optionName.trim()).first()).toBeVisible();
  });

  test("375px swap modal stays inside viewport", async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.phone);
    const email = `mother.resp.phone.${Date.now()}@example.com`;
    await signUpNewMother(page, { name: "Resp Amma", email, password: "Kitchen159" });
      await completeOnboarding(page, "Anu", { schoolTiffin: true });
      await paySimulatedCheckout(page);
      await waitForResults(page);
    await assertNoHorizontalOverflow(page, "box lunch phone");
    await page.getByTestId("box-lunch-swap-open").click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    const box = await dialog.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeLessThanOrEqual(VIEWPORTS.phone.width + 2);
  });

  test("1920px swap modal uses centered rail", async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.tv);
    const email = `mother.resp.tv.${Date.now()}@example.com`;
    await signUpNewMother(page, { name: "TV Amma", email, password: "Kitchen159" });
    await completeOnboarding(page, "TV Kid", { schoolTiffin: true });
    await paySimulatedCheckout(page);
    await waitForResults(page);
    await page.getByTestId("box-lunch-swap-open").click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    const box = await dialog.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeLessThanOrEqual(VIEWPORTS.tv.width * 0.65);
  });
});
