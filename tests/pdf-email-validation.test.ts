import { describe, expect, it } from "vitest";
import { parsePdfDeliveryEmail } from "@/lib/pdf-email-validation";
import { pdfDeliveryEmailSchema } from "@/schemas/kidfuel";

describe("pdfDeliveryEmailSchema", () => {
  it("accepts valid email and lowercases", () => {
    const parsed = pdfDeliveryEmailSchema.safeParse({ email: "Parent@Example.com" });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.email).toBe("parent@example.com");
    }
  });

  it("rejects invalid email format", () => {
    const parsed = pdfDeliveryEmailSchema.safeParse({ email: "not-an-email" });
    expect(parsed.success).toBe(false);
  });

  it("rejects empty email", () => {
    const parsed = pdfDeliveryEmailSchema.safeParse({ email: "   " });
    expect(parsed.success).toBe(false);
  });
});

describe("parsePdfDeliveryEmail", () => {
  it("returns normalized email for valid input", () => {
    const result = parsePdfDeliveryEmail({ email: "  Kid@Mail.Com  " });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.email).toBe("kid@mail.com");
    }
  });

  it("returns 400 for malformed email", () => {
    const result = parsePdfDeliveryEmail({ email: "bad@" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(400);
    }
  });
});
