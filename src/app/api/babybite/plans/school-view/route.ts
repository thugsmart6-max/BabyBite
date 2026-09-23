import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/permissions";
import { connectDB } from "@/lib/mongodb";
import { handleRouteError, zodErrorResponse } from "@/lib/api-route";
import { ChildProfile } from "@/models/ChildProfile";
import { MealPlan } from "@/models/MealPlan";
import { mongoIdField } from "@/schemas/babybite";
import { invalidateUserMealViews } from "@/lib/cache/shared-cache";

const bodySchema = z.object({
  childProfileId: mongoIdField("childProfileId"),
  schoolLunchView: z.boolean(),
});

export const dynamic = "force-dynamic";

export async function PATCH(request: Request) {
  try {
    const session = await requireAuth();
    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) return zodErrorResponse(parsed.error);

    await connectDB();

    const child = await ChildProfile.findOne({
      _id: parsed.data.childProfileId,
      userId: session.user.id,
    });
    if (!child) {
      return NextResponse.json(
        { success: false, message: "Profile not found", code: "PROFILE_NOT_FOUND", error: "Profile not found" },
        { status: 404 }
      );
    }

    if (!child.hasPaid) {
      return NextResponse.json(
        { success: false, message: "Complete payment first", code: "PAYMENT_REQUIRED", error: "Complete payment first" },
        { status: 402 }
      );
    }

    const mealPlan = await MealPlan.findOne({
      userId: session.user.id,
      childProfileId: child._id,
    }).sort({ createdAt: -1 });

    if (mealPlan) {
      mealPlan.schoolLunchView = parsed.data.schoolLunchView;
      await mealPlan.save();
    }

    await invalidateUserMealViews(session.user.id, child._id.toString());

    return NextResponse.json({ success: true, schoolLunchView: parsed.data.schoolLunchView });
  } catch (error) {
    return handleRouteError(error, "Unable to save lunch view preference");
  }
}
