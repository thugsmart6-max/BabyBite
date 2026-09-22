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
    await expect(page.locator(MARQUEE_ROOT).locator(".os-marquee-3d-tilt")).toBeVisible();
    await expect(page.locator(MARQUEE_IMG).first()).toBeVisible();
    const tilesInStage = await page.evaluate(() => {
      const stage = document.querySelector(".os-marquee-3d-stage")?.getBoundingClientRect();
      if (!stage) return 0;
      return [...document.querySelectorAll(".os-marquee-3d img")].filter((img) => {
        const r = img.getBoundingClientRect();
        return (
          r.width > 2 &&
          r.height > 2 &&
          r.right > stage.left &&
          r.left < stage.right &&
          r.bottom > stage.top &&
          r.top < stage.bottom
        );
      }).length;
    });
    expect(tilesInStage, "most marquee tiles should appear inside the visible stage").toBeGreaterThan(6);
    await expect(page.getByText(/babybite/i).first()).toBeVisible();
    expect(await page.locator(MARQUEE_IMG).count()).toBeGreaterThanOrEqual(8);
    const src = await page.locator(MARQUEE_IMG).first().getAttribute("src");
    expect(src ?? "").toMatch(BRAND_SRC);
  });

  test("columns animate vertically over time", async ({ page }) => {
    await gotoReady(page, "/landing");
    await scrollToMarquee(page);

    const column = page.locator(".os-marquee-3d-column").first();
    await expect(column).toBeVisible();

    const readScreenY = () => column.evaluate((el) => el.getBoundingClientRect().top);

    const y0 = await readScreenY();
    await page.waitForTimeout(1200);
    const y1 = await readScreenY();
    await page.waitForTimeout(1200);
    const y2 = await readScreenY();

    const moved = Math.abs(y1 - y0) > 0.5 || Math.abs(y2 - y1) > 0.5;
    expect(moved, `expected column motion y0=${y0} y1=${y1} y2=${y2}`).toBe(true);
  });

  test("renders four marquee columns", async ({ page }) => {
    await gotoReady(page, "/landing");
    await scrollToMarquee(page);
    await expect(page.locator(".os-marquee-3d-tilt > .os-marquee-3d-column")).toHaveCount(4);
  });
});

test.describe("landing 3D marquee on phone", () => {
  test.use({ viewport: VIEWPORTS.phone });

  test("columns animate at phone width", async ({ page }) => {
    await gotoReady(page, "/landing");
    await scrollToMarquee(page);
    const column = page.locator(".os-marquee-3d-column").first();
    const y0 = await column.evaluate((el) => el.getBoundingClientRect().top);
    await page.waitForTimeout(1400);
    const y1 = await column.evaluate((el) => el.getBoundingClientRect().top);
    expect(Math.abs(y1 - y0)).toBeGreaterThan(0.5);
  });

  test("scaled canvas visible without horizontal overflow", async ({ page }) => {
    test.setTimeout(60_000);
    await gotoReady(page, "/landing");
    await scrollToMarquee(page);

    await expect(page.locator(MARQUEE_IMG).first()).toBeVisible();
    await assertNoHorizontalOverflow(page, "landing 3d marquee phone");
  });
});

test.describe("landing 3D marquee at 150% zoom (CSS viewport)", () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  test("animates and fits like a 150% zoomed FHD monitor", async ({ page }) => {
    await gotoReady(page, "/landing");
    await scrollToMarquee(page);
    await assertNoHorizontalOverflow(page, "marquee 150% zoom viewport");
    const column = page.locator(".os-marquee-3d-column").first();
    const y0 = await column.evaluate((el) => el.getBoundingClientRect().top);
    await page.waitForTimeout(1400);
    const y1 = await column.evaluate((el) => el.getBoundingClientRect().top);
    expect(Math.abs(y1 - y0)).toBeGreaterThan(0.5);
    await expect(page.locator(MARQUEE_IMG).first()).toBeVisible();
  });
});
