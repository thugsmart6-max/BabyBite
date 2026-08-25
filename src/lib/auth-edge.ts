import NextAuth from "next-auth";
import { applyProductionAuthUrl } from "@/lib/auth-url";
import authConfig from "@/lib/auth.config";
import type { UserRole } from "@/types";

applyProductionAuthUrl();

export const { auth } = NextAuth({
  ...authConfig,
  callbacks: {
    ...authConfig.callbacks,
    session({ session, token }) {
      session.user.id = token.id as string;
      session.user.role = token.role as UserRole;
      session.user.onboardingComplete = token.onboardingComplete as boolean;
      session.user.hasPaid = (token.hasPaid as boolean) ?? false;
      return session;
    },
  },
});
