import crypto from "crypto";
import Razorpay from "razorpay";

/** Flip to `true` when Razorpay goes live (planned separately from this release). */
export function isRazorpayEnabled(): boolean {
  return process.env.RAZORPAY_ENABLED === "true";
}

export function isRazorpayConfigured(): boolean {
  if (!isRazorpayEnabled()) return false;
  return Boolean(process.env.RAZORPAY_KEY_ID?.trim() && process.env.RAZORPAY_KEY_SECRET?.trim());
}

export function razorpayPublicKeyId(): string | undefined {
  return process.env.RAZORPAY_KEY_ID?.trim() || undefined;
}

export function demoCheckoutAllowed(): boolean {
  if (!isRazorpayConfigured()) return true;
  return process.env.RAZORPAY_ALLOW_DEMO_CHECKOUT === "true";
}

function getRazorpayClient(): Razorpay {
  const keyId = process.env.RAZORPAY_KEY_ID?.trim();
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();
  if (!keyId || !keySecret) {
    throw new Error("Razorpay keys are not configured");
  }
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
}

export async function createRazorpayOrder(input: {
  amountInr: number;
  receipt: string;
  notes?: Record<string, string>;
}) {
  const amountPaise = Math.round(input.amountInr * 100);
  if (amountPaise < 100) {
    throw new Error("Order amount must be at least ₹1");
  }

  const client = getRazorpayClient();
  const order = await client.orders.create({
    amount: amountPaise,
    currency: "INR",
    receipt: input.receipt.slice(0, 40),
    notes: input.notes,
  });

  return {
    orderId: order.id,
    amountPaise: order.amount as number,
    currency: order.currency,
  };
}

export function verifyRazorpayPaymentSignature(input: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET?.trim();
  if (!secret) return false;

  const payload = `${input.orderId}|${input.paymentId}`;
  const expected = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(input.signature));
  } catch {
    return false;
  }
}

export function verifyRazorpayWebhookSignature(rawBody: string, signature: string | null): boolean {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET?.trim();
  if (!webhookSecret || !signature) return false;

  const expected = crypto.createHmac("sha256", webhookSecret).update(rawBody).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}
