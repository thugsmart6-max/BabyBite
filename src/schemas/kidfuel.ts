import { z } from "zod";

export const mongoIdField = (label: string) =>
  z.string().regex(/^[a-fA-F0-9]{24}$/, `Invalid ${label}`);

export const kidfuelOnboardingSchema = z.object({
  name: z.string().min(1, "Child name is required").max(50),
  ageYears: z.number().min(4, "Minimum age is 4").max(12, "Maximum age is 12"),
  gender: z.enum(["male", "female", "other"]),
  heightCm: z.number().min(80).max(180).optional(),
  weightKg: z.number().min(10).max(80).optional(),
  dietPreference: z.enum(["vegetarian", "eggetarian", "non-vegetarian"]),
  foodStyle: z.enum(["south-indian", "north-indian", "mixed-indian"]),
  challenges: z
    .array(
      z.enum([
        "underweight",
        "poor-appetite",
        "picky-eater",
        "no-vegetables",
        "no-milk",
        "low-energy",
        "active-sports",
      ])
    )
    .min(1, "Select at least one challenge"),
  goal: z.enum([
    "healthy-nutrition",
    "better-eating-habits",
    "protein-focus",
    "balanced-meals",
    "food-variety",
  ]),
  allergies: z
    .array(z.enum(["dairy", "nuts", "eggs", "gluten", "soy", "seafood"]))
    .default([]),
  dislikedFoods: z.array(z.string().min(2).max(40)).max(10).default([]),
});

export const paymentSchema = z.object({
  childProfileId: mongoIdField("child profile"),
  planTier: z.enum(["healthy-nutrition", "protein-focus", "complete-bundle"]),
  method: z.enum(["card", "upi"]).optional(),
});

export const generatePlanSchema = z.object({
  childProfileId: mongoIdField("child profile"),
  regenerate: z.boolean().optional(),
});

export const pdfDeliveryEmailSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Please enter a valid email address")
    .transform((v) => v.toLowerCase()),
  childProfileId: mongoIdField("child profile").optional(),
});

export type KidfuelOnboardingInput = z.infer<typeof kidfuelOnboardingSchema>;
