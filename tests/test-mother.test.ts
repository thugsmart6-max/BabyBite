import { describe, expect, it } from "vitest";
import { TEST_MOTHER } from "@/lib/test-mother";

describe("kitchen test login", () => {
  it("keeps the production test account email and password", () => {
    expect(TEST_MOTHER.email).toBe("mother.dev@example.com");
    expect(TEST_MOTHER.password).toBe("Kitchen159");
    expect(TEST_MOTHER.name).toBe("Dev Mother");
  });
});
