import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/permissions";
import { connectDB } from "@/lib/mongodb";
import { ChildProfile } from "@/models/ChildProfile";
import { Payment } from "@/models/Payment";
import { paymentSchema } from "@/schemas/babybite";
import { PLAN_TIERS, type PlanTier } from "@/types/babybite";
import { handleRouteError, zodErrorResponse } from "@/lib/api-route";
import { markCheckoutPaid } from "@/lib/mark-checkout-paid";
import { ensurePaymentOfferClock } from "@/lib/ensure-payment-offer-start";
import { User } from "@/models/User";
import {
  createRazorpayOrder,
  demoCheckoutAllowed,
  isRazorpayConfigured,
  razorpayPublicKeyId,
} from "@/lib/razorpay";

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const parsed = paymentSchema.safeParse(body);

    if (!parsed.success) {
      return zodErrorResponse(parsed.error);
    }

    await connectDB();

    const child = await ChildProfile.findOne({
      _id: parsed.data.childProfileId,
      userId: session.user.id,
    });

    if (!child) {
      return NextResponse.json({ error: "Child profile not found" }, { status: 404 });
    }

    const tier = parsed.data.planTier as PlanTier;
    const plan = PLAN_TIERS[tier];

    let originalPrice = plan.price;
    let finalPrice = plan.price;
    let discountPercent = 0;

    if (tier === "complete-bundle") {
      const dbUser = await User.findById(session.user.id).select("onboardingComplete");
      const familyPaid = await ChildProfile.exists({ userId: session.user.id, hasPaid: true });
      const offer = await ensurePaymentOfferClock(session.user.id, {
        onboardingComplete: Boolean(dbUser?.onboardingComplete),
        familyHasPaid: Boolean(familyPaid),
      });
      originalPrice = offer.listPrice;
      finalPrice = offer.finalPrice;
      discountPercent = offer.discountPercent;
    }

    const useRazorpay = isRazorpayConfigured() && !demoCheckoutAllowed();

    if (useRazorpay) {
      const payment = await Payment.create({
        userId: session.user.id,
        childProfileId: child._id,
        planTier: tier,
        planName: plan.name,
        originalPrice,
        discountPercent,
        finalPrice,
        spinResult: discountPercent,
        status: "pending",
      });

      const receipt = `bb_${payment._id.toString()}`;
      const order = await createRazorpayOrder({
        amountInr: finalPrice,
        receipt,
        notes: {
          userId: session.user.id,
          childProfileId: child._id.toString(),
          paymentId: payment._id.toString(),
          planTier: tier,
        },
      });

      payment.razorpayOrderId = order.orderId;
      await payment.save();

      const keyId = razorpayPublicKeyId();
      if (!keyId) {
        return NextResponse.json({ error: "Razorpay is not configured" }, { status: 503 });
      }

      return NextResponse.json({
        mode: "razorpay",
        paymentId: payment._id.toString(),
        orderId: order.orderId,
        amount: order.amountPaise,
        currency: order.currency,
        keyId,
        planName: plan.name,
        finalPrice,
      });
    }

    const payment = await Payment.create({
      userId: session.user.id,
      childProfileId: child._id,
      planTier: tier,
      planName: plan.name,
      originalPrice,
      discountPercent,
      finalPrice,
      spinResult: discountPercent,
      status: "demo_paid",
    });

    await markCheckoutPaid({
      userId: session.user.id,
      childProfileId: child._id,
      planTier: tier,
    });

    return NextResponse.json({
      mode: "demo",
      success: true,
      paymentId: payment._id.toString(),
      originalPrice,
      finalPrice,
      planName: plan.name,
    });
  } catch (error) {
    return handleRouteError(error, "Could not continue");
  }
}
