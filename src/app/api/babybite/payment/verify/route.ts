import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/permissions";
import { connectDB } from "@/lib/mongodb";
import { Payment } from "@/models/Payment";
import { handleRouteError, zodErrorResponse } from "@/lib/api-route";
import { verifyRazorpayPaymentSignature } from "@/lib/razorpay";
import { finalizeRazorpayPayment } from "@/lib/mark-checkout-paid";
import type { PlanTier } from "@/types/babybite";

const verifySchema = z.object({
  paymentId: z.string().min(1),
  razorpayOrderId: z.string().min(1),
  razorpayPaymentId: z.string().min(1),
  razorpaySignature: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const parsed = verifySchema.safeParse(body);
    if (!parsed.success) {
      return zodErrorResponse(parsed.error);
    }

    const valid = verifyRazorpayPaymentSignature({
      orderId: parsed.data.razorpayOrderId,
      paymentId: parsed.data.razorpayPaymentId,
      signature: parsed.data.razorpaySignature,
    });

    if (!valid) {
      return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 });
    }

    await connectDB();

    const pending = await Payment.findOne({
      _id: parsed.data.paymentId,
      userId: session.user.id,
      razorpayOrderId: parsed.data.razorpayOrderId,
    });

    if (!pending) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    if (pending.status === "paid" || pending.status === "demo_paid") {
      return NextResponse.json({ success: true, alreadyPaid: true });
    }

    const updated = await finalizeRazorpayPayment({
      paymentId: pending._id.toString(),
      userId: session.user.id,
      razorpayPaymentId: parsed.data.razorpayPaymentId,
      planTier: pending.planTier as PlanTier,
      childProfileId: pending.childProfileId,
    });

    if (!updated) {
      return NextResponse.json({ error: "Could not confirm payment" }, { status: 409 });
    }

    return NextResponse.json({
      success: true,
      paymentId: updated._id.toString(),
      finalPrice: updated.finalPrice,
    });
  } catch (error) {
    return handleRouteError(error, "Could not verify payment");
  }
}
