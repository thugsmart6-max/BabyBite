import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Payment } from "@/models/Payment";
import { verifyRazorpayWebhookSignature } from "@/lib/razorpay";
import { finalizeRazorpayPayment } from "@/lib/mark-checkout-paid";
import type { PlanTier } from "@/types/babybite";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature");

  if (!verifyRazorpayWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
  }

  let payload: {
    event?: string;
    payload?: {
      payment?: {
        entity?: {
          id?: string;
          order_id?: string;
          status?: string;
        };
      };
    };
  };

  try {
    payload = JSON.parse(rawBody) as typeof payload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (payload.event !== "payment.captured") {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const entity = payload.payload?.payment?.entity;
  const orderId = entity?.order_id;
  const paymentId = entity?.id;

  if (!orderId || !paymentId || entity?.status !== "captured") {
    return NextResponse.json({ ok: true, skipped: true });
  }

  await connectDB();

  const pending = await Payment.findOne({ razorpayOrderId: orderId, status: "pending" });
  if (!pending) {
    return NextResponse.json({ ok: true, missing: true });
  }

  await finalizeRazorpayPayment({
    paymentId: pending._id.toString(),
    userId: pending.userId.toString(),
    razorpayPaymentId: paymentId,
    planTier: pending.planTier as PlanTier,
    childProfileId: pending.childProfileId,
  });

  return NextResponse.json({ ok: true });
}
