import { describe, expect, it } from "vitest";
import { verifyRazorpayPaymentSignature } from "@/lib/razorpay";
import crypto from "crypto";

describe("verifyRazorpayPaymentSignature", () => {
  it("accepts a valid HMAC signature", () => {
    const orderId = "order_test123";
    const paymentId = "pay_test456";
    const secret = "test_secret_key";

    process.env.RAZORPAY_KEY_SECRET = secret;
    const signature = crypto
      .createHmac("sha256", secret)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    expect(
      verifyRazorpayPaymentSignature({ orderId, paymentId, signature })
    ).toBe(true);

    delete process.env.RAZORPAY_KEY_SECRET;
  });
});
