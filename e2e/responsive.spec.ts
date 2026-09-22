import { expect, test } from "@playwright/test";
import {
  assertNavDoesNotCollide,
  assertNoHorizontalOverflow,
  gotoReady,
  openMenu,
  VIEWPORTS,
} from "./helpers";

const PUBLIC_PATHS = ["/landing", "/login", "/signup"] as const;

test.describe("responsive public UI", () => {
  for (const [name, viewport] of Object.entries(VIEWPORTS)) {
    test(`${name} ${viewport.width}px keeps public pages inside the viewport`, async ({ page }) => {
      await page.setViewportSize(viewport);
      for (const path of PUBLIC_PATHS) {
        await gotoReady(page, path);
        await assertNoHorizontalOverflow(page, `${name} ${path}`);
        await assertNavDoesNotCollide(page);
      }
    });
  }

  test("phone hides desktop tools and still opens the full menu", async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.phone);
    await gotoReady(page, "/landing");
    await expect(page.locator(".os-nav-tools")).toBeHidden();
    await expect(page.locator(".os-nav-left .bb-cta")).toBeHidden();
    await expect(page.locator(".os-menu-btn")).toBeVisible();
    await expect(page.locator("a.os-mascot")).toBeVisible();

    await openMenu(page);
    await expect(page.locator(".os-menu-full a").first()).toBeVisible();
    const closeBtn = page.locator(".os-menu-close");
    await expect(closeBtn).toBeVisible();
    const closeBox = await closeBtn.boundingBox();
    expect(closeBox).not.toBeNull();
    expect(closeBox!.y).toBeGreaterThanOrEqual(0);
    expect(closeBox!.x + closeBox!.width).toBeLessThanOrEqual(VIEWPORTS.phone.width + 1);
    await expect(page.locator(".os-menu-full").getByRole("button", { name: "Tamil" })).toBeVisible();
  });

  test("short phone can still reach language in the menu", async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.phoneSm);
    await gotoReady(page, "/landing");
    await openMenu(page);
    const tamil = page.locator(".os-menu-full").getByRole("button", { name: "Tamil" });
    await tamil.scrollIntoViewIfNeeded();
    await expect(tamil).toBeVisible();
  });

  test("tv landing keeps content centered without horizontal scroll", async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.tv);
    await gotoReady(page, "/landing");
    await assertNoHorizontalOverflow(page, "tv /landing");
    const hero = page.locator(".os-hero-core");
    await expect(hero).toBeVisible();
    const box = await hero.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x + box!.width).toBeLessThanOrEqual(VIEWPORTS.tv.width);
    const rail = await page.evaluate(() => {
      const heroSection = document.querySelector(".os-hero");
      if (!heroSection) return null;
      const r = heroSection.getBoundingClientRect();
      return { left: r.left, width: r.width, viewport: window.innerWidth };
    });
    expect(rail).not.toBeNull();
    expect(rail!.width).toBeLessThanOrEqual(VIEWPORTS.tv.width - 32);
    expect(rail!.left).toBeGreaterThanOrEqual(8);
    expect(rail!.left + rail!.width).toBeLessThanOrEqual(VIEWPORTS.tv.width - 8);
  });

  test("1900×1080 (55″) landing uses a readable content rail", async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.tv55);
    await gotoReady(page, "/landing");
    await assertNoHorizontalOverflow(page, "tv55 /landing");
    const metrics = await page.evaluate(() => {
      const section = document.querySelector(".os-plates");
      const cta = document.querySelector(".os-hero-actions .bb-cta");
      if (!section || !cta) return null;
      const s = section.getBoundingClientRect();
      const c = cta.getBoundingClientRect();
      return {
        sectionWidth: s.width,
        viewport: window.innerWidth,
        ctaHeight: c.height,
      };
    });
    expect(metrics).not.toBeNull();
    expect(metrics!.sectionWidth).toBeLessThan(metrics!.viewport * 0.92);
    expect(metrics!.ctaHeight).toBeGreaterThanOrEqual(44);
  });

  test("tablet landing 3d marquee section fits viewport", async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.tablet);
    await gotoReady(page, "/landing");
    await assertNoHorizontalOverflow(page, "tablet /landing");
    await expect(page.locator(".os-marquee-3d")).toBeVisible();
  });

  test("tv landing 3d marquee and auth stay inside the viewport", async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.tv);
    await gotoReady(page, "/landing");
    await assertNoHorizontalOverflow(page, "tv landing marquee");
    const marquee = page.locator(".os-marquee-3d");
    await expect(marquee).toBeVisible();
    const box = await marquee.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x + box!.width).toBeLessThanOrEqual(VIEWPORTS.tv.width + 1);

    await gotoReady(page, "/login");
    await assertNoHorizontalOverflow(page, "tv login");
    const grid = page.locator(".os-auth-grid");
    await expect(grid).toBeVisible();
    const gridBox = await grid.boundingBox();
    expect(gridBox).not.toBeNull();
    expect(gridBox!.width).toBeLessThan(VIEWPORTS.tv.width * 0.92);
  });

  test("laptop shows language in the header", async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.laptop);
    await gotoReady(page, "/landing");
    await expect(page.locator(".os-nav-tools")).toBeVisible();
    await expect(page.getByRole("group", { name: /language/i })).toBeVisible();
    await expect(page.locator(".os-nav-tools")).toContainText("EN");
  });

  test("desktop auth art appears without pushing the form off-screen", async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);
    await gotoReady(page, "/login");
    await expect(page.locator(".os-auth-pack")).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    const formBox = await page.locator(".os-auth-form").boundingBox();
    expect(formBox).not.toBeNull();
    expect(formBox!.x).toBeGreaterThanOrEqual(0);
    expect(formBox!.width).toBeGreaterThan(280);
  });

  test("phone auth hides the side pack and keeps the form readable", async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.phone);
    await gotoReady(page, "/login");
    await expect(page.locator(".os-auth-pack")).toBeHidden();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.locator("form").getByRole("button", { name: /sign in/i })).toBeVisible();
  });

  test("phone hero stickers stay fully readable and off the hero image", async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.phone);
    await gotoReady(page, "/landing");
    await expect(page.locator(".os-hero .os-site-art")).toBeVisible();
    const hits = await page.evaluate(() => {
      const art = document.querySelector(".os-hero .os-site-art");
      if (!art) return ["missing hero art"];
      const a = art.getBoundingClientRect();
      return [...document.querySelectorAll(".os-hero .os-sticker")].flatMap((el) => {
        const style = window.getComputedStyle(el);
        if (style.display === "none" || style.visibility === "hidden") return [];
        const r = el.getBoundingClientRect();
        const text = el.textContent?.trim() || "sticker";
        const overlap = !(r.right <= a.left + 4 || r.left >= a.right - 4 || r.bottom <= a.top + 4 || r.top >= a.bottom - 4);
        if (overlap) return [`${text} overlaps hero image`];
        if (r.width < 24 || r.height < 16) return [`${text} is clipped`];
        return [];
      });
    });
    expect(hits).toEqual([]);
    await expect(page.locator(".os-hero .os-sticker", { hasText: "Keep it simple" })).toBeVisible();
    await expect(page.locator(".os-hero .os-sticker", { hasText: "7pm, sorted" })).toBeVisible();
    await expect(page.locator(".os-hero .os-sticker", { hasText: "South · North · Mixed" })).toBeVisible();
  });

  test("landing hero CTAs stay tappable on a small phone", async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.phoneSm);
    await gotoReady(page, "/landing");
    const cta = page.locator(".os-hero").getByRole("link", { name: /make a plan for my child/i });
    await expect(cta).toBeVisible();
    const box = await cta.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.height).toBeGreaterThanOrEqual(36);
    expect(box!.width).toBeLessThanOrEqual(VIEWPORTS.phoneSm.width - 16);
  });

  test("terms panel fits a phone and keeps decline/agree on screen", async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.phone);
    await gotoReady(page, "/signup");
    const panel = page.locator(".os-terms-panel");
    await expect(panel).toBeVisible();
    const box = await panel.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.width).toBeLessThanOrEqual(VIEWPORTS.phone.width);
    await expect(page.getByRole("button", { name: /continue with google/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /decline/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /i agree/i })).toBeVisible();
  });

  test("short phone keeps Google accept on screen without scrolling the lock", async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.phoneSm);
    await gotoReady(page, "/signup");
    const google = page.getByRole("button", { name: /continue with google/i });
    const agree = page.getByRole("button", { name: /i agree/i });
    await expect(google).toBeVisible();
    await expect(agree).toBeVisible();
    const googleBox = await google.boundingBox();
    const agreeBox = await agree.boundingBox();
    expect(googleBox).not.toBeNull();
    expect(agreeBox).not.toBeNull();
    expect(googleBox!.y).toBeGreaterThanOrEqual(0);
    expect(googleBox!.y + googleBox!.height).toBeLessThanOrEqual(VIEWPORTS.phoneSm.height + 1);
    expect(agreeBox!.y + agreeBox!.height).toBeLessThanOrEqual(VIEWPORTS.phoneSm.height + 1);
  });
});
