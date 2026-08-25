import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/permissions";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import { ChildProfile, toKidFuelProfile, type IChildProfile } from "@/models/ChildProfile";
import { NutritionAnalysis } from "@/models/NutritionAnalysis";
import { kidfuelOnboardingSchema } from "@/schemas/kidfuel";
import { generateNutritionAnalysis } from "@/services/analysis-engine";
import { handleRouteError, zodErrorResponse } from "@/lib/api-route";

function serializeChild(child: IChildProfile) {
  return {
    id: child._id.toString(),
    name: child.name,
    ageYears: child.ageYears,
    gender: child.gender,
    heightCm: child.heightCm,
    weightKg: child.weightKg,
    dietPreference: child.dietPreference,
    foodStyle: child.foodStyle,
    hasPaid: child.hasPaid,
    selectedPlan: child.selectedPlan,
    pdfEmailSent: Boolean(child.pdfEmailSentAt),
    challenges: child.challenges,
    goal: child.goal,
    allergies: child.allergies ?? [],
    dislikedFoods: child.dislikedFoods ?? [],
  };
}

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const parsed = kidfuelOnboardingSchema.safeParse(body);

    if (!parsed.success) {
      return zodErrorResponse(parsed.error);
    }

    await connectDB();

    const child = await ChildProfile.findOneAndUpdate(
      { userId: session.user.id },
      {
        $set: {
          userId: session.user.id,
          ...parsed.data,
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    const profile = toKidFuelProfile(child);
    const analysisResult = generateNutritionAnalysis(profile);

    const analysis = await NutritionAnalysis.findOneAndUpdate(
      { userId: session.user.id, childProfileId: child._id },
      {
        $set: {
          userId: session.user.id,
          childProfileId: child._id,
          score: analysisResult.score,
          summary: analysisResult.summary,
          improvements: analysisResult.improvements,
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    await User.findByIdAndUpdate(session.user.id, { onboardingComplete: true });

    return NextResponse.json({
      success: true,
      childProfileId: child._id.toString(),
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

export async function GET() {
  try {
    const session = await requireAuth();
    await connectDB();

    const child = await ChildProfile.findOne({ userId: session.user.id }).sort({
      createdAt: -1,
    });
    if (!child) {
      return NextResponse.json({ child: null, analysis: null });
    }

    const analysis = await NutritionAnalysis.findOne({
      childProfileId: child._id,
    }).sort({ createdAt: -1 });

    return NextResponse.json({
      child: serializeChild(child),
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
