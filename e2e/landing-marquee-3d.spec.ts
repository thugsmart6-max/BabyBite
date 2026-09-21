import { expect, test } from "@playwright/test";
import { assertNoHorizontalOverflow, gotoReady, VIEWPORTS } from "./helpers";

const MARQUEE_ROOT = ".os-marquee-3d";
const MARQUEE_IMG = ".os-marquee-3d img";
const BRAND_SRC = /art-tiffin|art-tiffins|art-mark|art-compare|site images food|proterin,iron,calcium,energy/;

async function scrollToMarquee(page: import("@playwright/test").Page) {
  const block = page.locator(MARQUEE_ROOT);
  await block.scrollIntoViewIfNeeded();
  await expect(block).toBeVisible();
}

test.describe("landing Aceternity 3D marquee", () => {
  test.use({ viewport: VIEWPORTS.laptop });

  test("shows benefit section and 3D image grid", async ({ page }) => {
    await gotoReady(page, "/landing");
    await scrollToMarquee(page);

    await expect(page.getByRole("heading", { name: /help at the table/i })).toBeVisible();
    await expect(page.locator(MARQUEE_ROOT).locator(".grid-cols-4")).toBeVisible();
    await expect(page.locator(MARQUEE_IMG).first()).toBeVisible();
    await expect(page.getByText(/babybite/i).first()).toBeVisible();
    expect(await page.locator(MARQUEE_IMG).count()).toBeGreaterThanOrEqual(8);
    const src = await page.locator(MARQUEE_IMG).first().getAttribute("src");
    expect(src ?? "").toMatch(BRAND_SRC);
  });

  test("columns animate vertically over time", async ({ page }) => {
    await gotoReady(page, "/landing");
    await scrollToMarquee(page);

    const column = page.locator(".os-marquee-3d .flex.flex-col.items-start.gap-8").first();
    await expect(column).toBeVisible();

    const readY = () =>
      column.evaluate((el) => {
        const style = window.getComputedStyle(el);
        const matrix = style.transform;
        if (!matrix || matrix === "none") return el.getBoundingClientRect().top;
        const match = matrix.match(/matrix.*,\s*([-\d.]+)\)/);
        return match ? Number.parseFloat(match[1]) : el.getBoundingClientRect().top;
      });

    const y0 = await readY();
    await page.waitForTimeout(1200);
    const y1 = await readY();
    await page.waitForTimeout(1200);
    const y2 = await readY();

    const moved = Math.abs(y1 - y0) > 0.5 || Math.abs(y2 - y1) > 0.5;
    expect(moved, `expected column motion y0=${y0} y1=${y1} y2=${y2}`).toBe(true);
  });

  test("renders four marquee columns", async ({ page }) => {
    await gotoReady(page, "/landing");
    await scrollToMarquee(page);
    await expect(page.locator(".os-marquee-3d .grid-cols-4 > .flex.flex-col")).toHaveCount(4);
  });
});

test.describe("landing 3D marquee on phone", () => {
  test.use({ viewport: VIEWPORTS.phone });

  test("scaled canvas visible without horizontal overflow", async ({ page }) => {
    await gotoReady(page, "/landing");
    await scrollToMarquee(page);

    await expect(page.locator(MARQUEE_IMG).first()).toBeVisible();
    await assertNoHorizontalOverflow(page, "landing 3d marquee phone");
  });
});
