import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import Apple from "next-auth/providers/apple";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import authConfig from "@/lib/auth.config";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import { loadUserHasPaid } from "@/lib/auth-has-paid";
import { loginSchema } from "@/schemas/auth";
import type { UserRole } from "@/types";

async function resolveDbUserId(email: string | null | undefined, fallbackId?: string) {
  if (fallbackId && mongoose.Types.ObjectId.isValid(fallbackId)) {
    return fallbackId;
  }

  if (!email) return fallbackId ?? "";

  await connectDB();
  const dbUser = await User.findOne({ email: email.toLowerCase() }).select(
    "_id role onboardingComplete"
  );
  return dbUser?._id.toString() ?? fallbackId ?? "";
}

async function applyDbUserToToken(
  token: { id?: string; role?: UserRole; onboardingComplete?: boolean; hasPaid?: boolean },
  userId: string
) {
  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) return;

  token.id = userId;

  await connectDB();
  const dbUser = await User.findById(userId).select("role onboardingComplete");
  if (dbUser) {
    token.role = dbUser.role;
    token.onboardingComplete = dbUser.onboardingComplete;
  }

  token.hasPaid = await loadUserHasPaid(userId);
}

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      image?: string;
      role: UserRole;
      onboardingComplete: boolean;
      hasPaid: boolean;
    };
  }

  interface User {
    role: UserRole;
    onboardingComplete: boolean;
    hasPaid?: boolean;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
    onboardingComplete: boolean;
    hasPaid?: boolean;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    ...(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET
      ? [
          Google({
            clientId: process.env.AUTH_GOOGLE_ID,
            clientSecret: process.env.AUTH_GOOGLE_SECRET,
          }),
        ]
      : []),
    ...(process.env.AUTH_APPLE_ID &&
    process.env.AUTH_APPLE_SECRET &&
    !process.env.AUTH_APPLE_ID.startsWith("your-")
      ? [
          Apple({
            clientId: process.env.AUTH_APPLE_ID,
            clientSecret: process.env.AUTH_APPLE_SECRET,
          }),
        ]
      : []),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        await connectDB();
        const user = await User.findOne({ email: parsed.data.email }).select("+password");
        if (!user || !user.password) return null;

        const isValid = await bcrypt.compare(parsed.data.password, user.password);
        if (!isValid) return null;

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
          onboardingComplete: user.onboardingComplete,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "credentials") return true;

      try {
        await connectDB();
        const existingUser = await User.findOne({ email: user.email?.toLowerCase() });

        if (!existingUser && user.email) {
          await User.create({
            name: user.name ?? "Parent",
            email: user.email.toLowerCase(),
            ...(user.image ? { image: user.image } : {}),
            role: "parent",
            onboardingComplete: false,
            emailVerified: new Date(),
            authProvider:
              account?.provider === "google"
                ? "google"
                : account?.provider === "apple"
                  ? "apple"
                  : "credentials",
          });
        } else if (existingUser) {
          if (user.image && !existingUser.image) {
            existingUser.image = user.image;
          }
          if (!existingUser.authProvider && account?.provider) {
            existingUser.authProvider =
              account.provider === "google"
                ? "google"
                : account.provider === "apple"
                  ? "apple"
                  : existingUser.authProvider;
          }
          await existingUser.save();
        }

        return true;
      } catch (error) {
        console.error("[auth] OAuth sign-in could not reach the database", error);
        return "/login?error=AccessDenied";
      }
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        const userId = await resolveDbUserId(user.email, user.id);
        token.role = user.role ?? "parent";
        token.onboardingComplete = user.onboardingComplete ?? false;
        await applyDbUserToToken(token, userId);
      }

      if (trigger === "update" && session) {
        token.onboardingComplete = session.onboardingComplete ?? token.onboardingComplete;
        token.role = session.role ?? token.role;
        if (session.hasPaid !== undefined) {
          token.hasPaid = session.hasPaid;
        }
      }

      if (token.email && (!token.id || !mongoose.Types.ObjectId.isValid(token.id as string))) {
        const userId = await resolveDbUserId(token.email as string);
        await applyDbUserToToken(token, userId);
      }

      if (
        token.id &&
        mongoose.Types.ObjectId.isValid(token.id as string) &&
        token.hasPaid === undefined
      ) {
        token.hasPaid = await loadUserHasPaid(token.id as string);
      }

      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      session.user.onboardingComplete = token.onboardingComplete;
      session.user.hasPaid = token.hasPaid ?? false;
      return session;
    },
  },
});
