import type { NextAuthConfig } from "next-auth";

export default {
  trustHost: true,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
    newUser: "/onboarding",
  },
  providers: [],
} satisfies NextAuthConfig;
