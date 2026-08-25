import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/permissions";
import { connectDB } from "@/lib/mongodb";
import { generatePlanSchema } from "@/schemas/kidfuel";
import { getOrRefreshMealPlan } from "@/services/kidfuel-plan-store";
import { MEAL_ENGINE_VERSION } from "@/lib/plan-variety";
import { handleRouteError, zodErrorResponse } from "@/lib/api-route";
import { ChildProfile } from "@/models/ChildProfile";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const parsed = generatePlanSchema.safeParse(body);

    if (!parsed.success) {
      return zodErrorResponse(parsed.error);
    }

    await connectDB();

    const child = await ChildProfile.findOne({
      _id: parsed.data.childProfileId,
      userId: session.user.id,
    });

    if (!child) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    if (!child.hasPaid) {
      return NextResponse.json({ error: "Complete the previous step to continue" }, { status: 402 });
    }

    const result = await getOrRefreshMealPlan(session.user.id, child, {
      force: Boolean(parsed.data.regenerate),
    });

    if (!result.mealPlan || !result.generated) {
      return NextResponse.json({ error: "Failed to save meal plan" }, { status: 500 });
    }

    return NextResponse.json(
      {
        success: true,
        reused: result.reused,
        mealPlanId: result.mealPlan._id.toString(),
        emailSent: false,
        plan: result.generated,
        engineVersion: MEAL_ENGINE_VERSION,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    return handleRouteError(error, "Failed to generate plan");
  }
}

export async function GET(request: Request) {
  try {
    const session = await requireAuth();
    const { searchParams } = new URL(request.url);
    const childProfileId = searchParams.get("childProfileId");

    await connectDB();

    const childQuery: Record<string, unknown> = { userId: session.user.id };
    if (childProfileId) childQuery._id = childProfileId;

    const child = await ChildProfile.findOne(childQuery).sort({ createdAt: -1 });
    if (!child) {
      return NextResponse.json({ plan: null });
    }

    if (!child.hasPaid) {
      return NextResponse.json({ plan: null });
    }

    const result = await getOrRefreshMealPlan(session.user.id, child);
    if (!result.generated) {
      return NextResponse.json({ plan: null });
    }

    return NextResponse.json(
      { plan: result.generated, engineVersion: MEAL_ENGINE_VERSION, reused: result.reused },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    return handleRouteError(error, "Failed to load plan");
  }
}
