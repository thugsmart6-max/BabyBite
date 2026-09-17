import mongoose, { Schema, Document, Model, Types } from "mongoose";
import type {
  ChildGender,
  CookTime,
  DietPreference,
  FoodAllergy,
  FoodStyle,
  KitchenBudget,
  NutritionChallenge,
  NutritionGoal,
  PlanTier,
  RiceHabit,
  TiffinNeed,
} from "@/types/babybite";
import {
  DEFAULT_COOK_TIME,
  DEFAULT_KITCHEN_BUDGET,
  DEFAULT_RICE_HABIT,
  DEFAULT_TIFFIN_NEED,
} from "@/types/babybite";
import type { BabyBiteChildProfile } from "@/types/babybite";

export interface IChildProfile extends Document {
  userId: Types.ObjectId;
  name: string;
  ageYears: number;
  gender: ChildGender;
  heightCm?: number;
  weightKg?: number;
  baselineHeightCm?: number;
  baselineWeightKg?: number;
  baselineNotedAt?: Date;
  remeasuredAt?: Date;
  dietPreference: DietPreference;
  foodStyle: FoodStyle;
  challenges: NutritionChallenge[];
  goal: NutritionGoal;
  allergies: FoodAllergy[];
  dislikedFoods: string[];
  cookTime?: CookTime;
  kitchenBudget?: KitchenBudget;
  riceHabit?: RiceHabit;
  tiffinNeed?: TiffinNeed;
  hasPaid: boolean;
  selectedPlan?: PlanTier;
  pdfDeliveryEmail?: string;
  pdfEmailSentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ChildProfileSchema = new Schema<IChildProfile>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true },
    ageYears: { type: Number, required: true, min: 4, max: 12 },
    gender: { type: String, enum: ["male", "female", "other"], required: true },
    heightCm: Number,
    weightKg: Number,
    baselineHeightCm: Number,
    baselineWeightKg: Number,
    baselineNotedAt: Date,
    remeasuredAt: Date,
    dietPreference: {
      type: String,
      enum: ["vegetarian", "eggetarian", "non-vegetarian"],
      required: true,
    },
    foodStyle: {
      type: String,
      enum: ["south-indian", "north-indian", "mixed-indian"],
      required: true,
    },
    challenges: {
      type: [String],
      enum: [
        "underweight",
        "poor-appetite",
        "picky-eater",
        "no-vegetables",
        "no-milk",
        "low-energy",
        "active-sports",
      ],
      default: [],
    },
    goal: {
      type: String,
      enum: [
        "healthy-nutrition",
        "better-eating-habits",
        "protein-focus",
        "balanced-meals",
        "food-variety",
      ],
      required: true,
    },
    allergies: {
      type: [String],
      enum: ["dairy", "nuts", "eggs", "gluten", "soy", "seafood"],
      default: [],
    },
    dislikedFoods: { type: [String], default: [] },
    cookTime: {
      type: String,
      enum: ["ten-min", "normal"],
      default: DEFAULT_COOK_TIME,
    },
    kitchenBudget: {
      type: String,
      enum: ["tight", "normal"],
      default: DEFAULT_KITCHEN_BUDGET,
    },
    riceHabit: {
      type: String,
      enum: ["eats-rice", "refuses-rice"],
      default: DEFAULT_RICE_HABIT,
    },
    tiffinNeed: {
      type: String,
      enum: ["school-lunch", "home-only"],
      default: DEFAULT_TIFFIN_NEED,
    },
    hasPaid: { type: Boolean, default: false },
    selectedPlan: {
      type: String,
      enum: ["healthy-nutrition", "protein-focus", "complete-bundle"],
    },
    pdfDeliveryEmail: { type: String, lowercase: true, trim: true },
    pdfEmailSentAt: Date,
  },
  { timestamps: true }
);

if (mongoose.models.ChildProfile) {
  delete mongoose.models.ChildProfile;
}

export const ChildProfile: Model<IChildProfile> = mongoose.model<IChildProfile>(
  "ChildProfile",
  ChildProfileSchema
);

export function toBabyBiteProfile(doc: IChildProfile): BabyBiteChildProfile {
  return {
    id: doc._id.toString(),
    name: doc.name,
    ageYears: doc.ageYears,
    gender: doc.gender,
    heightCm: doc.heightCm,
    weightKg: doc.weightKg,
    baselineHeightCm: doc.baselineHeightCm,
    baselineWeightKg: doc.baselineWeightKg,
    dietPreference: doc.dietPreference,
    foodStyle: doc.foodStyle,
    challenges: doc.challenges,
    goal: doc.goal,
    allergies: doc.allergies ?? [],
    dislikedFoods: doc.dislikedFoods ?? [],
    cookTime: doc.cookTime ?? DEFAULT_COOK_TIME,
    kitchenBudget: doc.kitchenBudget ?? DEFAULT_KITCHEN_BUDGET,
    riceHabit: doc.riceHabit ?? DEFAULT_RICE_HABIT,
    tiffinNeed: doc.tiffinNeed ?? DEFAULT_TIFFIN_NEED,
  };
}
