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
      // #region agent log
      fetch('http://127.0.0.1:7803/ingest/95f350a3-7db0-463e-a25d-1bd09a11d00d',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'422235'},body:JSON.stringify({sessionId:'422235',location:'src/app/api/auth/signup/route.ts:parse',message:'signup schema rejected',data:{ok:false,issue:parsed.error.issues[0]?.message ?? 'invalid'},timestamp:Date.now(),hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      return zodErrorResponse(parsed.error);
    }

    await connectDB();

    const existing = await User.findOne({ email: parsed.data.email.toLowerCase() });
    if (existing) {
      // #region agent log
      fetch('http://127.0.0.1:7803/ingest/95f350a3-7db0-463e-a25d-1bd09a11d00d',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'422235'},body:JSON.stringify({sessionId:'422235',location:'src/app/api/auth/signup/route.ts:exists',message:'signup email already registered',data:{status:409},timestamp:Date.now(),hypothesisId:'E'})}).catch(()=>{});
      // #endregion
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

    // #region agent log
    fetch('http://127.0.0.1:7803/ingest/95f350a3-7db0-463e-a25d-1bd09a11d00d',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'422235'},body:JSON.stringify({sessionId:'422235',location:'src/app/api/auth/signup/route.ts:created',message:'signup created user',data:{status:201},timestamp:Date.now(),hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    return NextResponse.json(
      { id: user._id.toString(), email: user.email, name: user.name },
      { status: 201 }
    );
  } catch (error) {
    const err = error instanceof Error ? error : new Error("unknown");
    // #region agent log
    fetch('http://127.0.0.1:7803/ingest/95f350a3-7db0-463e-a25d-1bd09a11d00d',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'422235'},body:JSON.stringify({sessionId:'422235',location:'src/app/api/auth/signup/route.ts:catch',message:'signup failed',data:{status:500,name:err.name,text:err.message.slice(0,180),hasMongoUri:Boolean(process.env.MONGODB_URI)},timestamp:Date.now(),hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    return handleRouteError(error, "Failed to create account");
  }
}
