import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/permissions";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import { ChildProfile, toBabyBiteProfile, type IChildProfile } from "@/models/ChildProfile";
import { NutritionAnalysis } from "@/models/NutritionAnalysis";
import { babybiteOnboardingSchema } from "@/schemas/babybite";
import { generateNutritionAnalysis } from "@/services/analysis-engine";
import { handleRouteError, zodErrorResponse } from "@/lib/api-route";
import { nextGrowthFields } from "@/lib/growth-measure";
import mongoose from "mongoose";

function serializeChild(child: IChildProfile) {
  return {
    id: child._id.toString(),
    name: child.name,
    ageYears: child.ageYears,
    gender: child.gender,
    heightCm: child.heightCm,
    weightKg: child.weightKg,
    baselineHeightCm: child.baselineHeightCm,
    baselineWeightKg: child.baselineWeightKg,
    baselineNotedAt: child.baselineNotedAt?.toISOString(),
    remeasuredAt: child.remeasuredAt?.toISOString(),
    dietPreference: child.dietPreference,
    foodStyle: child.foodStyle,
    hasPaid: child.hasPaid,
    selectedPlan: child.selectedPlan,
    pdfEmailSent: Boolean(child.pdfEmailSentAt),
    challenges: child.challenges,
    goal: child.goal,
    allergies: child.allergies ?? [],
    dislikedFoods: child.dislikedFoods ?? [],
    cookTime: child.cookTime ?? "normal",
    kitchenBudget: child.kitchenBudget ?? "normal",
    riceHabit: child.riceHabit ?? "eats-rice",
    tiffinNeed: child.tiffinNeed ?? "home-only",
  };
}

async function familyHasPaid(userId: string) {
  return Boolean(await ChildProfile.exists({ userId, hasPaid: true }));
}

async function writeAnalysis(userId: string, child: IChildProfile) {
  const profile = toBabyBiteProfile(child);
  const analysisResult = generateNutritionAnalysis(profile);

  const analysis = await NutritionAnalysis.findOneAndUpdate(
    { userId, childProfileId: child._id },
    {
      $set: {
        userId,
        childProfileId: child._id,
        score: analysisResult.score,
        summary: analysisResult.summary,
        improvements: analysisResult.improvements,
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  return analysis;
}

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const parsed = babybiteOnboardingSchema.safeParse(body);

    if (!parsed.success) {
      return zodErrorResponse(parsed.error);
    }

    await connectDB();

    const { childProfileId, createNew, heightCm, weightKg, ...childData } = parsed.data;
    const paid = await familyHasPaid(session.user.id);
    const incomingMeasure = {
      ...(heightCm !== undefined ? { heightCm } : {}),
      ...(weightKg !== undefined ? { weightKg } : {}),
    };

    let existing: IChildProfile | null = null;
    if (!createNew) {
      if (childProfileId) {
        existing = await ChildProfile.findOne({
          _id: childProfileId,
          userId: session.user.id,
        });
      } else {
        existing = await ChildProfile.findOne({ userId: session.user.id }).sort({
          createdAt: -1,
        });
      }
    }

    const growth = nextGrowthFields(existing, incomingMeasure);
    const payload = {
      userId: session.user.id,
      ...childData,
      ...incomingMeasure,
      ...growth,
    };

    const child = existing
      ? await ChildProfile.findOneAndUpdate(
          { _id: existing._id, userId: session.user.id },
          { $set: payload },
          { new: true }
        )
      : await ChildProfile.create({
          ...payload,
          hasPaid: paid,
        });

    if (!child) {
      return NextResponse.json({ error: "Child profile not found" }, { status: 404 });
    }

    const analysis = await writeAnalysis(session.user.id, child);
    await User.findByIdAndUpdate(session.user.id, { onboardingComplete: true });

    return NextResponse.json({
      success: true,
      childProfileId: child._id.toString(),
      hasPaid: child.hasPaid,
      analysis: {
        score: analysis.score,
        summary: analysis.summary,
        improvements: analysis.improvements,
      },
    });
  } catch (error) {
    return handleRouteError(error, "Failed to save profile");
  }
}

export async function GET(request: Request) {
  try {
    const session = await requireAuth();
    await connectDB();

    const requested = new URL(request.url).searchParams.get("childId");
    const children = await ChildProfile.find({ userId: session.user.id }).sort({
      createdAt: 1,
    });

    if (children.length === 0) {
      return NextResponse.json({ child: null, children: [], analysis: null });
    }

    const selected =
      (requested &&
        mongoose.Types.ObjectId.isValid(requested) &&
        children.find((item) => item._id.toString() === requested)) ||
      children[children.length - 1];

    const analysis = await NutritionAnalysis.findOne({
      childProfileId: selected._id,
    }).sort({ createdAt: -1 });

    return NextResponse.json({
      child: serializeChild(selected),
      children: children.map(serializeChild),
      analysis: analysis
        ? {
            score: analysis.score,
            summary: analysis.summary,
            improvements: analysis.improvements,
          }
        : null,
    });
  } catch (error) {
    return handleRouteError(error, "Failed to load profile");
  }
}
