import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/permissions";
import { connectDB } from "@/lib/mongodb";
import { assertPdfEmailAvailable, parsePdfDeliveryEmail } from "@/lib/pdf-email-validation";
import { ChildProfile, toKidFuelProfile } from "@/models/ChildProfile";
import { PDFReport } from "@/models/PDFReport";
import { User } from "@/models/User";
import { pdfDeliveryEmailSchema } from "@/schemas/kidfuel";
import { generatePDFBuffer, pdfFileName } from "@/services/pdf-service";
import { sendPlanEmail } from "@/services/email-service";
import { getOrRefreshMealPlan } from "@/services/kidfuel-plan-store";
import { handleRouteError, zodErrorResponse } from "@/lib/api-route";
import type { GeneratedMealPlan } from "@/types/kidfuel";

async function loadChildAndPlan(userId: string, childProfileId?: string) {
  const childQuery = childProfileId
    ? { _id: childProfileId, userId }
    : { userId };

  const child = await ChildProfile.findOne(childQuery).sort({ createdAt: -1 });
  if (!child) return { child: null, plan: null, generated: null };

  if (!child.hasPaid) {
    return { child, plan: null, generated: null };
  }

  const result = await getOrRefreshMealPlan(userId, child);
  const generated = result.generated as GeneratedMealPlan | null;

  return {
    child,
    plan: result.mealPlan,
    generated,
  };
}

export async function GET(request: Request) {
  try {
    const session = await requireAuth();
    await connectDB();

    const download = new URL(request.url).searchParams.get("download") === "1";
    if (download) {
      const { child, generated } = await loadChildAndPlan(session.user.id);
      if (!child) {
        return NextResponse.json({ error: "Profile not found" }, { status: 404 });
      }
      if (!child.hasPaid) {
        return NextResponse.json({ error: "Complete the previous step to continue" }, { status: 402 });
      }
      if (!generated) {
        return NextResponse.json({ error: "Meal plan not found" }, { status: 404 });
      }

      const profile = toKidFuelProfile(child);
      const fileName = pdfFileName(profile.name);
      const pdfBuffer = await generatePDFBuffer(profile, generated);

      return new NextResponse(new Uint8Array(pdfBuffer), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${fileName}"`,
        },
      });
    }

    const user = await User.findById(session.user.id).select("email authProvider password");
    const { child } = await loadChildAndPlan(session.user.id);

    const authProvider =
      user?.authProvider ??
      (user?.password ? "credentials" : user?.email ? "google" : "credentials");

    return NextResponse.json({
      accountEmail: user?.email ?? session.user.email,
      authProvider,
      pdfEmailSent: Boolean(child?.pdfEmailSentAt),
      pdfDeliveryEmail: child?.pdfDeliveryEmail ?? null,
      childProfileId: child?._id.toString() ?? null,
    });
  } catch (error) {
    return handleRouteError(error, "Failed to load PDF status");
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const parsed = pdfDeliveryEmailSchema.safeParse(body);

    if (!parsed.success) {
      return zodErrorResponse(parsed.error);
    }

    await connectDB();

    const formatCheck = parsePdfDeliveryEmail({ email: parsed.data.email });
    if (!formatCheck.ok) {
      return NextResponse.json({ error: formatCheck.error }, { status: formatCheck.status });
    }

    const duplicateCheck = await assertPdfEmailAvailable(formatCheck.email, session.user.id);
    if (!duplicateCheck.ok) {
      return NextResponse.json({ error: duplicateCheck.error }, { status: duplicateCheck.status });
    }

    const user = await User.findById(session.user.id).select("email authProvider password");
    const authProvider =
      user?.authProvider ??
      (user?.password ? "credentials" : user?.email ? "google" : "credentials");

    if (
      (authProvider === "google" || authProvider === "apple") &&
      user?.email &&
      duplicateCheck.email !== user.email.toLowerCase()
    ) {
      return NextResponse.json(
        {
          error: `Please use your ${authProvider === "google" ? "Google" : "Apple"} account email (${user.email})`,
        },
        { status: 400 }
      );
    }

    const { child, plan, generated } = await loadChildAndPlan(
      session.user.id,
      parsed.data.childProfileId
    );

    if (!child) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    if (!child.hasPaid) {
      return NextResponse.json({ error: "Complete the previous step to continue" }, { status: 402 });
    }

    if (!plan || !generated) {
      return NextResponse.json(
        { error: "Meal plan not found. Complete plan generation first." },
        { status: 404 }
      );
    }

    const profile = toKidFuelProfile(child);
    const fileName = pdfFileName(profile.name);
    const pdfBuffer = await generatePDFBuffer(profile, generated);

    await PDFReport.create({
      userId: session.user.id,
      childProfileId: child._id,
      mealPlanId: plan._id,
      fileName,
      generatedAt: new Date(),
    });

    const emailResult = await sendPlanEmail({
      userId: session.user.id,
      childProfileId: child._id.toString(),
      to: duplicateCheck.email,
      profile,
      plan: generated,
      pdfBuffer,
      fileName,
    });

    if (!emailResult.sent) {
      return NextResponse.json(
        { error: emailResult.reason ?? "Failed to send email. Please try again." },
        { status: 502 }
      );
    }

    child.pdfDeliveryEmail = duplicateCheck.email;
    child.pdfEmailSentAt = new Date();
    await child.save();

    return NextResponse.json({
      success: true,
      sent: true,
      email: duplicateCheck.email,
    });
  } catch (error) {
    return handleRouteError(error, "Failed to send PDF");
  }
}
