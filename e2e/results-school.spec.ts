import { expect, test } from "@playwright/test";
import {
  collectPageErrors,
  completeOnboarding,
  paySimulatedCheckout,
  signUpNewMother,
  VIEWPORTS,
  waitForResults,
} from "./helpers";

test.describe("results school and refuse-this", () => {
  test.use({ viewport: VIEWPORTS.laptop });
  test.describe.configure({ timeout: 120_000 });

  test("School tab works and refuse-this swaps are not copied onto every plate", async ({ page }) => {
    const errors = collectPageErrors(page);
    const email = `mother.dev.school.${Date.now()}@example.com`;
    await signUpNewMother(page, { name: "School Amma", email, password: "Kitchen159" });
    await completeOnboarding(page, "Meera", {
      schoolTiffin: true,
      riceRefuses: true,
      sports: true,
    });
    await paySimulatedCheckout(page);
    await waitForResults(page);

    await expect(page.getByText(/built from your checklist/i).first()).toBeVisible();
    await expect(page.getByRole("tab", { name: /^school$/i })).toBeVisible();

    await page.getByRole("tab", { name: /30 days/i }).click();
    await expect(page.locator(".os-month-row").first()).toBeVisible();
    const monthNames = (await page.locator(".os-month-row strong").allTextContents()).map((name) => name.trim());
    expect(monthNames.length).toBeGreaterThanOrEqual(14);
    expect(
      new Set(monthNames.map((name) => name.toLowerCase())).size,
      `30-day lunches repeated: ${monthNames.join(" | ")}`
    ).toBeGreaterThanOrEqual(8);
    expect(
      new Set(monthNames.slice(7).map((name) => name.toLowerCase())).size,
      `30-day lunches looped after week one: ${monthNames.slice(7).join(" | ")}`
    ).toBeGreaterThanOrEqual(8);
    for (let i = 2; i < monthNames.length; i += 1) {
      expect(
        monthNames[i] === monthNames[i - 1] && monthNames[i] === monthNames[i - 2],
        `same lunch three days in a row at ${i}: ${monthNames.slice(i - 2, i + 1).join(" / ")}`
      ).toBeFalsy();
    }

    await page.getByRole("tab", { name: /^school$/i }).click();
    await expect(page.getByText(/weekday lunch packed for school/i)).toBeVisible();

    const body = (await page.locator(".os-folder").innerText()).toLowerCase();
    expect(body).not.toContain("banana with peanut chutney");
    expect(body).not.toMatch(/peanut chutney/);

    const swapBlocks = page.locator(".os-swap-box");
    await expect(swapBlocks.first()).toBeVisible();
    const refuseCount = await page.getByText(/if they refuse this/i).count();
    expect(refuseCount).toBeGreaterThan(1);

    const pairs = await swapBlocks.evaluateAll((nodes) =>
      nodes.map((node) =>
        [...node.querySelectorAll("strong")]
          .map((el) => el.textContent?.trim() ?? "")
          .filter(Boolean)
          .join("|")
      )
    );
    const uniquePairs = new Set(pairs.filter(Boolean));
    expect(uniquePairs.size, `refuse-this repeated the same swaps: ${[...uniquePairs].join(" || ")}`).toBeGreaterThan(1);

    await page.getByRole("tab", { name: /today/i }).click();
    const todayLunch = page.locator(".os-meal-row").filter({
      has: page.locator(".os-band-kicker", { hasText: /^lunch$/i }),
    }).first();
    await expect(todayLunch).toBeVisible();
    const schoolFilter = page.getByRole("button", { name: /^school$/i });
    await expect(schoolFilter).toBeVisible();
    const before = (await todayLunch.locator("h3").innerText()).trim();
    await schoolFilter.click();
    await expect.poll(async () => (await todayLunch.locator("h3").innerText()).trim()).not.toBe(before);

    expect(errors).toEqual([]);
  });
});
