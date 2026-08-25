import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import { signupSchema } from "@/schemas/auth";
import { TERMS_VERSION } from "@/lib/constants";
import { handleRouteError, zodErrorResponse } from "@/lib/api-route";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = signupSchema.safeParse(body);

    if (!parsed.success) {
      return zodErrorResponse(parsed.error);
    }

    await connectDB();

    const existing = await User.findOne({ email: parsed.data.email.toLowerCase() });
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(parsed.data.password, 12);

    const user = await User.create({
      name: parsed.data.name,
      email: parsed.data.email.toLowerCase(),
      password: hashedPassword,
      role: "parent",
      onboardingComplete: false,
      authProvider: "credentials",
      termsAcceptedAt: new Date(),
      termsVersion: parsed.data.termsVersion ?? TERMS_VERSION,
    });

    return NextResponse.json(
      { id: user._id.toString(), email: user.email, name: user.name },
      { status: 201 }
    );
  } catch (error) {
    return handleRouteError(error, "Failed to create account");
  }
}
