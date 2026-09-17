import { afterEach, describe, expect, it, vi } from "vitest";
import { productionAuthUrl, rewriteAuthRedirect } from "@/lib/auth-url";

describe("productionAuthUrl", () => {
  it("keeps a real production AUTH_URL", () => {
    expect(
      productionAuthUrl({
        authUrl: "https://baby-bite.vercel.app",
        vercel: true,
        vercelEnv: "production",
        productionHost: "baby-bite.vercel.app",
      })
    ).toBe("https://baby-bite.vercel.app");
  });

  it("replaces localhost AUTH_URL on Vercel so Google does not bounce to local", () => {
    expect(
      productionAuthUrl({
        authUrl: "http://localhost:3000",
        vercel: true,
        vercelEnv: "production",
        productionHost: "baby-bite.vercel.app",
      })
    ).toBe("https://baby-bite.vercel.app");
  });

  it("leaves localhost AUTH_URL alone off Vercel", () => {
    expect(
      productionAuthUrl({
        authUrl: "http://localhost:3000",
        vercel: false,
      })
    ).toBe("http://localhost:3000");
  });
});

describe("rewriteAuthRedirect", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("keeps localhost while developing with npm run dev", () => {
    expect(rewriteAuthRedirect("http://localhost:3000/landing", "http://localhost:3000")).toBe(
      "http://localhost:3000/landing"
    );
    expect(rewriteAuthRedirect("/onboarding", "http://localhost:3000")).toBe(
      "http://localhost:3000/onboarding"
    );
  });

  it("does not send a local session to the live Vercel site", () => {
    expect(rewriteAuthRedirect("https://baby-bite.vercel.app/landing", "http://localhost:3000")).toBe(
      "http://localhost:3000/landing"
    );
    expect(rewriteAuthRedirect("/landing", "https://baby-bite.vercel.app")).toBe(
      "http://localhost:3000/landing"
    );
  });

  it("on Vercel, rewrites a leaked localhost URL to the live site", () => {
    vi.stubEnv("VERCEL", "1");
    expect(rewriteAuthRedirect("http://localhost:3000/landing", "http://localhost:3000")).toBe(
      "https://baby-bite.vercel.app/landing"
    );
    expect(rewriteAuthRedirect("/onboarding", "https://baby-bite.vercel.app")).toBe(
      "https://baby-bite.vercel.app/onboarding"
    );
    vi.unstubAllEnvs();
  });
});
