import mongoose, { Schema, Document, Model, Types } from "mongoose";
import type {
  DailyPlan,
  NutritionBreakdown,
  PlanTier,
} from "@/types/kidfuel";

export interface IMealPlan extends Document {
  userId: Types.ObjectId;
  childProfileId: Types.ObjectId;
  planTier: PlanTier;
  today: DailyPlan;
  weekly: DailyPlan[];
  monthly: DailyPlan[];
  breakdown: NutritionBreakdown;
  recommendedFoods: string[];
  engineVersion?: number;
  createdAt: Date;
  updatedAt: Date;
}

const MealPlanSchema = new Schema<IMealPlan>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    childProfileId: {
      type: Schema.Types.ObjectId,
      ref: "ChildProfile",
      required: true,
      index: true,
    },
    planTier: {
      type: String,
      enum: ["healthy-nutrition", "protein-focus", "complete-bundle"],
      required: true,
    },
    today: { type: Schema.Types.Mixed, required: true },
    weekly: { type: Schema.Types.Mixed, required: true },
    monthly: { type: Schema.Types.Mixed, required: true },
    breakdown: { type: Schema.Types.Mixed, required: true },
    recommendedFoods: { type: [String], default: [] },
    engineVersion: { type: Number, default: 0 },
  },
  { timestamps: true }
);

if (mongoose.models.MealPlan) {
  delete mongoose.models.MealPlan;
}

export const MealPlan: Model<IMealPlan> = mongoose.model<IMealPlan>("MealPlan", MealPlanSchema);
