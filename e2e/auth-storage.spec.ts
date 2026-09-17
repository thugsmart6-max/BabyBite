import { expect, test, type APIRequestContext } from "@playwright/test";
import {
  TEST_MOTHER,
  collectPageErrors,
  expectLocalSession,
  expectLocalSessionCleared,
  loginWithCredentials,
  logoutFromMenu,
  readLocalUserStore,
  VIEWPORTS,
} from "./helpers";

async function ensureTestAccount(request: APIRequestContext) {
  const res = await request.post("/api/auth/signup", {
    data: {
      name: TEST_MOTHER.name,
      email: TEST_MOTHER.email,
      password: TEST_MOTHER.password,
      confirmPassword: TEST_MOTHER.password,
      acceptedTerms: true,
      termsVersion: "2026-08-20",
    },
  });
  // #region agent log
  fetch("http://127.0.0.1:7803/ingest/95f350a3-7db0-463e-a25d-1bd09a11d00d",{method:"POST",headers:{"Content-Type":"application/json","X-Debug-Session-Id":"422235"},body:JSON.stringify({sessionId:"422235",runId:"post-fix",hypothesisId:"A",location:"e2e/auth-storage.spec.ts:ensureTestAccount",message:"signup status",data:{status:res.status(),hasMongoUri:Boolean(process.env.MONGODB_URI)},timestamp:Date.now()})}).catch(()=>{});
  // #endregion
  expect([201, 409]).toContain(res.status());
}

test.describe.configure({ mode: "serial" });

test.describe("test account login and localStorage", () => {
  test.use({ viewport: VIEWPORTS.laptop });

  test.beforeAll(async ({ request }) => {
    await ensureTestAccount(request);
  });

  test("logs in the kitchen test account and stores one user", async ({ page }) => {
    const errors = collectPageErrors(page);
    await loginWithCredentials(page, TEST_MOTHER.email, TEST_MOTHER.password);
    await expectLocalSession(page, TEST_MOTHER.email);

    const store = await readLocalUserStore(page);
    expect(Object.keys(store.users).filter((email) => email === TEST_MOTHER.email)).toHaveLength(1);
    expect(page.url()).toMatch(/\/(onboarding|payment|results|success)/);
    expect(errors).toEqual([]);
  });

  test("clears the live session on logout and keeps the stored email", async ({ page }) => {
    const errors = collectPageErrors(page);
    await loginWithCredentials(page, TEST_MOTHER.email, TEST_MOTHER.password);
    await expectLocalSession(page, TEST_MOTHER.email);
    await logoutFromMenu(page);
    await expectLocalSessionCleared(page, TEST_MOTHER.email);
    expect(errors).toEqual([]);
  });

  test("re-login loads the same email instead of creating a duplicate", async ({ page }) => {
    const errors = collectPageErrors(page);
    await loginWithCredentials(page, TEST_MOTHER.email, TEST_MOTHER.password);
    await expectLocalSession(page, TEST_MOTHER.email);
    const afterFirst = await readLocalUserStore(page);
    const firstCount = Object.keys(afterFirst.users).filter((email) => email === TEST_MOTHER.email).length;

    await logoutFromMenu(page);
    await expectLocalSessionCleared(page, TEST_MOTHER.email);

    await loginWithCredentials(page, TEST_MOTHER.email, TEST_MOTHER.password);
    await expectLocalSession(page, TEST_MOTHER.email);
    const afterSecond = await readLocalUserStore(page);
    const secondCount = Object.keys(afterSecond.users).filter((email) => email === TEST_MOTHER.email).length;

    expect(firstCount).toBe(1);
    expect(secondCount).toBe(1);
    expect(errors).toEqual([]);
  });
});
