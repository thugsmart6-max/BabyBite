import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import { resolvePaymentOffer } from "@/lib/payment-offer";
import type { PaymentOfferSnapshot } from "@/lib/payment-offer";

/** Start the 3-day / 1.5-day pricing clock when she finishes onboarding. */
export async function ensurePaymentOfferClock(
  userId: string,
  input: { onboardingComplete: boolean; familyHasPaid: boolean }
): Promise<PaymentOfferSnapshot> {
  await connectDB();

  const user = await User.findById(userId).select("paymentOfferStartedAt onboardingComplete");
  if (!user) {
    return resolvePaymentOffer(null);
  }

  if (
    input.onboardingComplete &&
    !input.familyHasPaid &&
    !user.paymentOfferStartedAt
  ) {
    user.paymentOfferStartedAt = new Date();
    await user.save();
  }

  return resolvePaymentOffer(user.paymentOfferStartedAt ?? null);
}
