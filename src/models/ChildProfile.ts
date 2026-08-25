import mongoose, { Schema, Document, Model, Types } from "mongoose";
import type {
  ChildGender,
  DietPreference,
  FoodAllergy,
  FoodStyle,
  NutritionChallenge,
  NutritionGoal,
  PlanTier,
} from "@/types/kidfuel";
import type { KidFuelChildProfile } from "@/types/kidfuel";

export interface IChildProfile extends Document {
  userId: Types.ObjectId;
  name: string;
  ageYears: number;
  gender: ChildGender;
  heightCm?: number;
  weightKg?: number;
  dietPreference: DietPreference;
  foodStyle: FoodStyle;
  challenges: NutritionChallenge[];
  goal: NutritionGoal;
  allergies: FoodAllergy[];
  dislikedFoods: string[];
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

export function toKidFuelProfile(doc: IChildProfile): KidFuelChildProfile {
  return {
    id: doc._id.toString(),
    name: doc.name,
    ageYears: doc.ageYears,
    gender: doc.gender,
    heightCm: doc.heightCm,
    weightKg: doc.weightKg,
    dietPreference: doc.dietPreference,
    foodStyle: doc.foodStyle,
    challenges: doc.challenges,
    goal: doc.goal,
    allergies: doc.allergies ?? [],
    dislikedFoods: doc.dislikedFoods ?? [],
  };
}
