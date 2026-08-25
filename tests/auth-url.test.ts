import { describe, expect, it } from "vitest";
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
  it("rewrites a localhost landing URL to the live site", () => {
    expect(rewriteAuthRedirect("http://localhost:3000/landing", "http://localhost:3000")).toBe(
      "https://baby-bite.vercel.app/landing"
    );
  });

  it("keeps a relative path on the live host", () => {
    expect(rewriteAuthRedirect("/onboarding", "https://baby-bite.vercel.app")).toBe(
      "https://baby-bite.vercel.app/onboarding"
    );
  });
});
