import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/models/User", () => ({
  User: {
    findOne: vi.fn(),
  },
}));

import { User } from "@/models/User";
import { assertPdfEmailAvailable } from "@/lib/pdf-email-validation";

describe("assertPdfEmailAvailable", () => {
  beforeEach(() => {
    vi.mocked(User.findOne).mockReset();
  });

  it("allows an email that is not registered to another user", async () => {
    vi.mocked(User.findOne).mockReturnValue({
      select: vi.fn().mockResolvedValue(null),
    } as never);

    const result = await assertPdfEmailAvailable("parent@example.com", "507f1f77bcf86cd799439011");
    expect(result.ok).toBe(true);
  });

  it("rejects an email owned by a different account", async () => {
    vi.mocked(User.findOne).mockReturnValue({
      select: vi.fn().mockResolvedValue({ _id: "someone-else" }),
    } as never);

    const result = await assertPdfEmailAvailable("taken@example.com", "507f1f77bcf86cd799439011");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(409);
    }
  });
});
