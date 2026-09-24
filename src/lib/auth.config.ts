import type { NextAuthConfig } from "next-auth";
import { applyProductionAuthUrl, rewriteAuthRedirect } from "@/lib/auth-url";

applyProductionAuthUrl();

export default {
  trustHost: true,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
    newUser: "/onboarding",
  },
  providers: [],
  callbacks: {
    redirect({ url, baseUrl }) {
      return rewriteAuthRedirect(url, baseUrl);
    },
  },
} satisfies NextAuthConfig;
