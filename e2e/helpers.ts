import { expect, type Page } from "@playwright/test";

export const VIEWPORTS = {
  phone: { width: 375, height: 812 },
  phoneSm: { width: 360, height: 640 },
  tablet: { width: 768, height: 1024 },
  laptop: { width: 1280, height: 800 },
  desktop: { width: 1440, height: 900 },
} as const;

export async function gotoReady(page: Page, path: string) {
  await page.goto(path);
  await page.waitForLoadState("domcontentloaded");
  await expect(page.locator(".os-nav")).toBeVisible();
}

export async function openMenu(page: Page) {
  await page.locator(".os-menu-btn").click();
  await expect(page.locator(".os-menu-full")).toBeVisible();
}

export async function closeMenu(page: Page) {
  await page.locator(".os-menu-close").click();
  await expect(page.locator(".os-menu-full")).toHaveCount(0);
}

export async function expectLoginGate(page: Page, path: string) {
  await page.goto(path);
  await expect(page).toHaveURL(/\/login\?/);
  const callbackUrl = new URL(page.url()).searchParams.get("callbackUrl");
  expect(callbackUrl).toBe(path);
  await expect(page.getByRole("heading", { name: /welcome back/i })).toBeVisible();
}

type OverflowReport = {
  scrollWidth: number;
  clientWidth: number;
  innerWidth: number;
  delta: number;
};

export async function assertNoHorizontalOverflow(page: Page, label: string) {
  const report = await page.evaluate((): OverflowReport => {
    const root = document.documentElement;
    const body = document.body;
    const scrollWidth = Math.max(root.scrollWidth, body?.scrollWidth ?? 0);
    const clientWidth = root.clientWidth;
    return {
      scrollWidth,
      clientWidth,
      innerWidth: window.innerWidth,
      delta: scrollWidth - clientWidth,
    };
  });

  expect(report.delta, `${label} horizontal overflow ${JSON.stringify(report)}`).toBeLessThanOrEqual(2);
}

type Box = { name: string; left: number; right: number; top: number; bottom: number };

export async function assertNavDoesNotCollide(page: Page) {
  const collisions = await page.evaluate(() => {
    const pick = (selector: string, name: string): Box | null => {
      const el = document.querySelector(selector);
      if (!el) return null;
      const style = window.getComputedStyle(el);
      if (style.display === "none" || style.visibility === "hidden") return null;
      const r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) return null;
      return { name, left: r.left, right: r.right, top: r.top, bottom: r.bottom };
    };

    const boxes = [
      pick(".os-menu-btn", "menu"),
      pick(".os-nav-left .bb-cta", "cta"),
      pick(".os-wordmark", "wordmark"),
      pick(".os-nav-tools", "tools"),
      pick(".os-mascot", "settings"),
    ].filter((box): box is Box => Boolean(box));

    const overlap = (a: Box, b: Box) =>
      !(a.right <= b.left + 2 || b.right <= a.left + 2 || a.bottom <= b.top + 2 || b.bottom <= a.top + 2);

    const hits: string[] = [];
    for (let i = 0; i < boxes.length; i += 1) {
      for (let j = i + 1; j < boxes.length; j += 1) {
        if (overlap(boxes[i], boxes[j])) hits.push(`${boxes[i].name} overlaps ${boxes[j].name}`);
      }
    }

    const viewport = window.innerWidth;
    for (const box of boxes) {
      if (box.left < -1 || box.right > viewport + 1) {
        hits.push(`${box.name} overflows viewport (${Math.round(box.left)}–${Math.round(box.right)} / ${viewport})`);
      }
    }

    return hits;
  });

  expect(collisions).toEqual([]);
}

export async function assertPrimaryCopyVisible(page: Page, name: string | RegExp) {
  const target = page.getByRole("heading", { name }).first();
  await expect(target).toBeVisible();
  await expect(target).toHaveCSS("opacity", "1");
}

export function collectPageErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (msg) => {
    if (msg.type() !== "error") return;
    const text = msg.text();
    if (text.includes("Failed to load resource")) return;
    errors.push(text);
  });
  return errors;
}
