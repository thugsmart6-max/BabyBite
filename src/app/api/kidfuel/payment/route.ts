import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/permissions";
import { connectDB } from "@/lib/mongodb";
import { ChildProfile } from "@/models/ChildProfile";
import { Payment } from "@/models/Payment";
import { paymentSchema } from "@/schemas/kidfuel";
import { PLAN_TIERS, type PlanTier } from "@/types/kidfuel";
import { COMPLETE_BUNDLE_CHECKOUT } from "@/lib/kidfuel-pricing";
import { handleRouteError, zodErrorResponse } from "@/lib/api-route";

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
    const originalPrice =
      tier === "complete-bundle" ? COMPLETE_BUNDLE_CHECKOUT.originalPrice : plan.price;
    const discountPercent = tier === "complete-bundle" ? COMPLETE_BUNDLE_CHECKOUT.discountPercent : 0;
    const finalPrice = plan.price;

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

    child.hasPaid = true;
    child.selectedPlan = tier;
    await child.save();

    return NextResponse.json({
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
