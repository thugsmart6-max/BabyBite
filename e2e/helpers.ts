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
  const btn = page.locator(".os-menu-btn");
  await expect(btn).toBeVisible();
  await btn.evaluate((el) => (el as HTMLButtonElement).click());
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

export async function acceptTerms(page: Page) {
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: /i agree/i }).click();
}

export async function assertMinTap(box: { width: number; height: number } | null, label: string, min = 36) {
  expect(box, `${label} missing`).not.toBeNull();
  expect(box!.height, `${label} too short`).toBeGreaterThanOrEqual(min);
  expect(box!.width, `${label} too narrow`).toBeGreaterThanOrEqual(min);
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
    if (text.includes("net::ERR_")) return;
    errors.push(text);
  });
  return errors;
}

export const TEST_MOTHER = {
  email: "mother.dev@example.com",
  password: "Kitchen159",
  name: "Dev Mother",
} as const;

export type LocalUserStoreSnapshot = {
  users: Record<string, { email?: string; name?: string; password?: string }>;
  session: string | null;
  current: { email?: string; password?: string } | null;
  child: string | null;
};

export async function readLocalUserStore(page: Page): Promise<LocalUserStoreSnapshot> {
  return page.evaluate(() => {
    const usersRaw = window.localStorage.getItem("bb-users");
    const currentRaw = window.localStorage.getItem("bb-user");
    return {
      users: usersRaw ? JSON.parse(usersRaw) : {},
      session: window.localStorage.getItem("bb-session"),
      current: currentRaw ? JSON.parse(currentRaw) : null,
      child: window.localStorage.getItem("bb-child"),
    };
  });
}

export async function expectLocalSession(page: Page, email: string) {
  const key = email.trim().toLowerCase();
  await expect.poll(async () => {
    const store = await readLocalUserStore(page);
    return store.session;
  }).toBe(key);
  const store = await readLocalUserStore(page);
  expect(store.users[key], `missing stored user for ${key}`).toBeTruthy();
  expect(store.current?.email).toBe(key);
  expect(JSON.stringify(store).toLowerCase()).not.toContain("password");
  expect(JSON.stringify(store)).not.toContain(TEST_MOTHER.password);
}

export async function expectLocalSessionCleared(page: Page, email: string) {
  const key = email.trim().toLowerCase();
  await expect
    .poll(async () => {
      const store = await readLocalUserStore(page);
      return {
        session: store.session,
        current: store.current,
        child: store.child,
      };
    })
    .toEqual({ session: null, current: null, child: null });
  const store = await readLocalUserStore(page);
  expect(store.users[key], "registry should keep the email after logout").toBeTruthy();
}

export async function loginWithCredentials(page: Page, email: string, password: string) {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: /welcome back/i })).toBeVisible();
  await page.getByTestId("login-email").fill(email);
  await page.getByTestId("login-password").fill(password);
  await page.getByTestId("login-submit").click();
  await page.waitForURL((url) => !url.pathname.startsWith("/login"), { timeout: 20_000 });
  await expect(page.locator("a.os-mascot")).toHaveAttribute("aria-label", /child & kitchen/i, { timeout: 15_000 });
}

export async function logoutFromMenu(page: Page) {
  await openMenu(page);
  await page.getByTestId("menu-logout").click();
  await page.waitForURL(/\/landing/, { timeout: 20_000 });
  await expect(page.getByRole("heading", { name: /what.?s for dinner/i })).toBeVisible();
}

export async function acceptTermsAndOpenSignup(page: Page) {
  await page.goto("/signup");
  await acceptTerms(page);
  await expect(page.getByRole("heading", { name: /create your account/i })).toBeVisible();
}

export async function signUpNewMother(
  page: Page,
  input: { name: string; email: string; password: string }
) {
  await acceptTermsAndOpenSignup(page);
  await page.getByTestId("signup-name").fill(input.name);
  await page.getByTestId("signup-email").fill(input.email);
  await page.getByTestId("signup-password").fill(input.password);
  await page.getByTestId("signup-confirm").fill(input.password);
  await page.getByTestId("signup-submit").click();
  await page.waitForURL(/\/onboarding/, { timeout: 25_000 });
}

export async function completeOnboarding(page: Page, childName: string) {
  await expect(page).toHaveURL(/\/onboarding/);
  await expect(page.getByTestId("child-name")).toBeVisible();
  await page.getByTestId("child-name").fill(childName);
  const nextTitles = [
    /how you cook at home/i,
    /what is true in the kitchen tonight/i,
    /what feels hard at the table/i,
    /what you want this month/i,
    /we.?ll build from this/i,
  ];
  for (const title of nextTitles) {
    await page.getByTestId("onboarding-next").click();
    await expect(page.getByRole("heading", { name: title })).toBeVisible();
  }
  await page.getByTestId("onboarding-next").click();
  await page.waitForURL(/\/payment/, { timeout: 25_000 });
}

export async function paySimulatedCheckout(page: Page) {
  await expect(page).toHaveURL(/\/payment/);
  await page.getByTestId("pay-now").click();
  await expect(page.getByTestId("pay-loader")).toBeVisible();
  await page.waitForURL(/\/(success|results)/, { timeout: 40_000 });
}

export async function waitForResults(page: Page) {
  await page.waitForURL(/\/results/, { timeout: 40_000 });
  await expect(page.getByTestId("page-skeleton")).toHaveCount(0, { timeout: 40_000 });
  await expect(page.getByRole("heading", { name: /what.?s for dinner/i })).toBeVisible();
}
