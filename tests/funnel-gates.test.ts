import { describe, expect, it } from "vitest";
import { homePathForUser, loginRedirectPath, nextMotherAction, resolveFunnelGate, safeInternalPath } from "@/lib/funnel-gates";

describe("resolveFunnelGate", () => {
  it("sends logged-out users from / to landing", () => {
    expect(
      resolveFunnelGate({
        pathname: "/",
        isLoggedIn: false,
        onboardingComplete: false,
        hasPaid: false,
      })
    ).toEqual({ type: "redirect", path: "/landing" });
  });

  it("sends a paid mother from / to tonight’s meals", () => {
    expect(
      resolveFunnelGate({
        pathname: "/",
        isLoggedIn: true,
        onboardingComplete: true,
        hasPaid: true,
      })
    ).toEqual({ type: "redirect", path: "/results" });
  });

  it("sends a signed-in mother with no child details to onboarding", () => {
    expect(
      resolveFunnelGate({
        pathname: "/",
        isLoggedIn: true,
        onboardingComplete: false,
        hasPaid: false,
      })
    ).toEqual({ type: "redirect", path: "/onboarding" });
  });

  it("sends an unpaid mother after onboarding to payment", () => {
    expect(
      homePathForUser({
        isLoggedIn: true,
        onboardingComplete: true,
        hasPaid: false,
      })
    ).toBe("/payment");

    expect(
      resolveFunnelGate({
        pathname: "/",
        isLoggedIn: true,
        onboardingComplete: true,
        hasPaid: false,
      })
    ).toEqual({ type: "redirect", path: "/payment" });
  });

  it("sends a paid mother away from login to results", () => {
    expect(
      resolveFunnelGate({
        pathname: "/login",
        isLoggedIn: true,
        onboardingComplete: true,
        hasPaid: true,
      })
    ).toEqual({ type: "redirect", path: "/results" });
  });

  it("requires login for onboarding and payment", () => {
    expect(
      resolveFunnelGate({
        pathname: "/onboarding",
        isLoggedIn: false,
        onboardingComplete: false,
        hasPaid: false,
      })
    ).toEqual({ type: "redirect", path: loginRedirectPath("/onboarding") });

    expect(
      resolveFunnelGate({
        pathname: "/payment",
        isLoggedIn: false,
        onboardingComplete: false,
        hasPaid: false,
      })
    ).toEqual({ type: "redirect", path: loginRedirectPath("/payment") });
  });

  it("sends incomplete onboarding away from payment", () => {
    expect(
      resolveFunnelGate({
        pathname: "/payment",
        isLoggedIn: true,
        onboardingComplete: false,
        hasPaid: false,
      })
    ).toEqual({ type: "redirect", path: "/onboarding" });
  });

  it("blocks unpaid users from results", () => {
    expect(
      resolveFunnelGate({
        pathname: "/results",
        isLoggedIn: true,
        onboardingComplete: true,
        hasPaid: false,
      })
    ).toEqual({ type: "redirect", path: "/payment?reason=payment_required" });
  });

  it("sends leftover analysis URLs home", () => {
    expect(
      resolveFunnelGate({
        pathname: "/analysis",
        isLoggedIn: false,
        onboardingComplete: false,
        hasPaid: false,
      })
    ).toEqual({ type: "redirect", path: "/landing" });
  });

  it("allows settings after onboarding even if unpaid", () => {
    expect(
      resolveFunnelGate({
        pathname: "/settings",
        isLoggedIn: true,
        onboardingComplete: true,
        hasPaid: false,
      })
    ).toEqual({ type: "next" });
  });

  it("returns 401 for unauthenticated API calls", () => {
    expect(
      resolveFunnelGate({
        pathname: "/api/kidfuel/plans",
        isLoggedIn: false,
        onboardingComplete: false,
        hasPaid: false,
      })
    ).toEqual({ type: "unauthorized" });
  });

  it("lets auth API through without a session", () => {
    expect(
      resolveFunnelGate({
        pathname: "/api/auth/signin",
        isLoggedIn: false,
        onboardingComplete: false,
        hasPaid: false,
      })
    ).toEqual({ type: "next" });
  });
});

describe("safeInternalPath", () => {
  it("keeps checkout callbacks on this site", () => {
    expect(safeInternalPath("/payment")).toBe("/payment");
    expect(safeInternalPath("//evil.example")).toBe("/");
    expect(safeInternalPath("https://evil.example")).toBe("/");
  });
});

describe("nextMotherAction", () => {
  it("asks a new visitor to make a plan", () => {
    expect(
      nextMotherAction({
        pathname: "/landing",
        isLoggedIn: false,
        onboardingComplete: false,
        hasPaid: false,
      })
    ).toEqual({ href: "/signup", label: "Make a plan for my child" });
  });

  it("asks a paid mother to open tonight’s meals from analysis", () => {
    expect(
      nextMotherAction({
        pathname: "/analysis",
        isLoggedIn: true,
        onboardingComplete: true,
        hasPaid: true,
      })
    ).toEqual({ href: "/results", label: "Open tonight’s meals" });
  });

  it("stays quiet on results so the meals are the page", () => {
    expect(
      nextMotherAction({
        pathname: "/results",
        isLoggedIn: true,
        onboardingComplete: true,
        hasPaid: true,
      })
    ).toBeNull();
  });

  it("asks an unpaid mother to open the 30-day plates", () => {
    expect(
      nextMotherAction({
        pathname: "/analysis",
        isLoggedIn: true,
        onboardingComplete: true,
        hasPaid: false,
      })
    ).toEqual({ href: "/payment", label: "Show my 30 days" });
  });
});
