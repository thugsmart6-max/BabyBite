import { describe, expect, it } from "vitest";
import { z } from "zod";
import { handleRouteError, isMongoObjectId, isUnauthorizedError, zodErrorResponse } from "@/lib/api-route";

describe("api-route helpers", () => {
  it("accepts 24-char hex ObjectIds only", () => {
    expect(isMongoObjectId("507f1f77bcf86cd799439011")).toBe(true);
    expect(isMongoObjectId("not-an-id")).toBe(false);
    expect(isMongoObjectId("")).toBe(false);
  });

  it("detects Unauthorized errors", () => {
    expect(isUnauthorizedError(new Error("Unauthorized"))).toBe(true);
    expect(isUnauthorizedError(new Error("nope"))).toBe(false);
  });

  it("maps Unauthorized to 401", async () => {
    const res = handleRouteError(new Error("Unauthorized"), "failed");
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Please sign in");
  });

  it("returns the first Zod issue message", async () => {
    const parsed = z.object({ name: z.string().min(1, "Name required") }).safeParse({ name: "" });
    expect(parsed.success).toBe(false);
    if (parsed.success) return;
    const res = zodErrorResponse(parsed.error);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Name required");
  });
});
