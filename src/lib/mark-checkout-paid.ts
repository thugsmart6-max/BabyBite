import type { Types } from "mongoose";
import { ChildProfile } from "@/models/ChildProfile";
import { Payment } from "@/models/Payment";
import type { PlanTier } from "@/types/babybite";

export async function markCheckoutPaid(input: {
  userId: string;
  childProfileId: Types.ObjectId;
  planTier: PlanTier;
}) {
  await ChildProfile.updateMany(
    { userId: input.userId },
    { $set: { hasPaid: true, selectedPlan: input.planTier } }
  );
}

export async function finalizeRazorpayPayment(input: {
  paymentId: string;
  userId: string;
  razorpayPaymentId: string;
  planTier: PlanTier;
  childProfileId: Types.ObjectId;
}) {
  const payment = await Payment.findOneAndUpdate(
    {
      _id: input.paymentId,
      userId: input.userId,
      status: "pending",
    },
    {
      $set: {
        status: "paid",
        razorpayPaymentId: input.razorpayPaymentId,
      },
    },
    { new: true }
  );

  if (!payment) return null;

  await markCheckoutPaid({
    userId: input.userId,
    childProfileId: input.childProfileId,
    planTier: input.planTier,
  });

  return payment;
}
