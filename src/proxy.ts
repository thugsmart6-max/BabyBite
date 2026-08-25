import { auth } from "@/lib/auth-edge";
import { NextResponse } from "next/server";
import { resolveFunnelGate } from "@/lib/funnel-gates";

const handler = auth((req) => {
  const { pathname } = req.nextUrl;
  const decision = resolveFunnelGate({
    pathname,
    isLoggedIn: !!req.auth,
    onboardingComplete: Boolean(req.auth?.user?.onboardingComplete),
    hasPaid: Boolean(req.auth?.user?.hasPaid),
  });

  if (decision.type === "unauthorized") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (decision.type === "redirect") {
    return NextResponse.redirect(new URL(decision.path, req.url));
  }

  return NextResponse.next();
});

export const proxy = handler;
export default handler;

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
