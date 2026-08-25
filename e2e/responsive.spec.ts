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
    const darkBox = await page.locator(".os-menu-full").getByRole("button", { name: /^dark$/i }).boundingBox();
    expect(darkBox).not.toBeNull();
    expect(darkBox!.y + darkBox!.height).toBeLessThanOrEqual(VIEWPORTS.phone.height + 1);
  });

  test("short phone can still reach language and theme in the menu", async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.phoneSm);
    await gotoReady(page, "/landing");
    await openMenu(page);
    const tamil = page.locator(".os-menu-full").getByRole("button", { name: "Tamil" });
    await tamil.scrollIntoViewIfNeeded();
    await expect(tamil).toBeVisible();
    await expect(page.locator(".os-menu-full").getByRole("button", { name: /^dark$/i })).toBeVisible();
  });

  test("laptop shows language and theme in the header", async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.laptop);
    await gotoReady(page, "/landing");
    await expect(page.locator(".os-nav-tools")).toBeVisible();
    await expect(page.getByRole("group", { name: /language/i })).toBeVisible();
    await expect(page.locator(".os-nav .theme-toggle.is-solo")).toBeVisible();
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

  test("phone hero stickers stay fully readable and off the tiffin", async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.phone);
    await gotoReady(page, "/landing");
    const hits = await page.evaluate(() => {
      const art = document.querySelector(".os-hero .os-site-art");
      if (!art) return ["missing tiffin"];
      const a = art.getBoundingClientRect();
      return [...document.querySelectorAll(".os-hero .os-sticker")].flatMap((el) => {
        const style = window.getComputedStyle(el);
        if (style.display === "none" || style.visibility === "hidden") return [];
        const r = el.getBoundingClientRect();
        const text = el.textContent?.trim() || "sticker";
        const overlap = !(r.right <= a.left + 4 || r.left >= a.right - 4 || r.bottom <= a.top + 4 || r.top >= a.bottom - 4);
        if (overlap) return [`${text} overlaps tiffin`];
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
    await expect(page.getByRole("button", { name: /decline/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /i agree/i })).toBeVisible();
  });
});
