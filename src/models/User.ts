import mongoose, { Schema, Document, Model } from "mongoose";
import type { UserRole } from "@/types";

export type AuthProvider = "credentials" | "google" | "apple";

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  authProvider?: AuthProvider;
  image?: string;
  role: UserRole;
  emailVerified?: Date;
  onboardingComplete: boolean;
  termsAcceptedAt?: Date;
  termsVersion?: string;
  parentProfile?: {
    phone?: string;
    timezone?: string;
    notificationsEnabled: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, select: false },
    authProvider: {
      type: String,
      enum: ["credentials", "google", "apple"],
    },
    image: String,
    role: {
      type: String,
      enum: ["parent", "co-parent", "caregiver"],
      default: "parent",
    },
    emailVerified: Date,
    onboardingComplete: { type: Boolean, default: false },
    termsAcceptedAt: Date,
    termsVersion: { type: String, default: "2025-06-01" },
    parentProfile: {
      phone: String,
      timezone: { type: String, default: "UTC" },
      notificationsEnabled: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

UserSchema.index({ email: 1 });

export const User: Model<IUser> =
  mongoose.models.User ?? mongoose.model<IUser>("User", UserSchema);
