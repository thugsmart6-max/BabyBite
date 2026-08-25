import { describe, expect, it } from "vitest";
import { loadUserHasPaid } from "@/lib/auth-has-paid";

describe("loadUserHasPaid", () => {
  it("returns false for OAuth UUID ids without querying MongoDB", async () => {
    const hasPaid = await loadUserHasPaid("182c8a0d-761c-4cd8-ab74-d3b9c912892e");
    expect(hasPaid).toBe(false);
  });

  it("returns false for empty id", async () => {
    expect(await loadUserHasPaid("")).toBe(false);
  });
});
