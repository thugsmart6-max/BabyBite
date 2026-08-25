import type { NextAuthConfig } from "next-auth";
import { rewriteAuthRedirect } from "@/lib/auth-url";

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
