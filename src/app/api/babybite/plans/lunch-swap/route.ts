import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/permissions";
import { connectDB } from "@/lib/mongodb";
import { handleRouteError, zodErrorResponse } from "@/lib/api-route";
import { ChildProfile } from "@/models/ChildProfile";
import { MealPlan } from "@/models/MealPlan";
import { mongoIdField } from "@/schemas/babybite";
import { applyLunchOverrides } from "@/lib/plan-lunch-overrides";
import { storedPlanToResponse } from "@/services/babybite-plan-store";
import { invalidateUserMealViews } from "@/lib/cache/shared-cache";

const bodySchema = z.object({
  childProfileId: mongoIdField("childProfileId"),
  dayDate: z.string().min(4).max(32),
  mealName: z.string().min(1).max(200),
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

    const mealPlan = await MealPlan.findOne({
      userId: session.user.id,
      childProfileId: child._id,
    }).sort({ createdAt: -1 });

    if (!mealPlan) {
      return NextResponse.json(
        { success: false, message: "Meal plan not found", code: "MEAL_PLAN_NOT_FOUND", error: "Meal plan not found" },
        { status: 404 }
      );
    }

    const base = storedPlanToResponse(child, mealPlan);
    const overrides = { ...(mealPlan.lunchOverrides ?? {}), [parsed.data.dayDate]: parsed.data.mealName };
    const patched = applyLunchOverrides(base, overrides);

    const dayExists = [patched.today, ...(patched.weekly ?? []), ...(patched.monthly ?? [])].some(
      (day) => day.date === parsed.data.dayDate
    );
    if (!dayExists) {
      return NextResponse.json(
        { success: false, message: "That day is not on your calendar", code: "INVALID_DAY", error: "Invalid day" },
        { status: 422 }
      );
    }

    mealPlan.lunchOverrides = overrides;
    mealPlan.today = patched.today;
    mealPlan.weekly = patched.weekly;
    mealPlan.monthly = patched.monthly;
    await mealPlan.save();

    await invalidateUserMealViews(session.user.id, child._id.toString(), parsed.data.dayDate);

    return NextResponse.json({
      success: true,
      plan: patched,
      lunchOverrides: overrides,
    });
  } catch (error) {
    return handleRouteError(error, "Unable to update lunch");
  }
}
