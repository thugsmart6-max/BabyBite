import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import { signupSchema } from "@/schemas/auth";
import { TERMS_VERSION } from "@/lib/constants";
import { handleRouteError, jsonError, jsonSuccess, zodErrorResponse } from "@/lib/api-route";
import { logError, logInfo } from "@/lib/logger";

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
      return jsonError("Email already registered", 409, "EMAIL_ALREADY_REGISTERED");
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

    logInfo("auth.signup.created", { userId: user._id.toString() });

    return jsonSuccess(
      { id: user._id.toString(), email: user.email, name: user.name },
      201
    );
  } catch (error) {
    logError("auth.signup.failed", error);
    return handleRouteError(error, "Failed to create account");
  }
}
