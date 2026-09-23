import mongoose, { Schema, Document, Model, Types } from "mongoose";
import type {
  DailyPlan,
  KitchenLists,
  MealSlot,
  NutritionBreakdown,
  PlanTier,
} from "@/types/babybite";

export interface IMealPlan extends Document {
  userId: Types.ObjectId;
  childProfileId: Types.ObjectId;
  planTier: PlanTier;
  today: DailyPlan;
  weekly: DailyPlan[];
  monthly: DailyPlan[];
  breakdown: NutritionBreakdown;
  recommendedFoods: string[];
  kitchenLists?: KitchenLists;
  recentMealNames?: Record<MealSlot, string[]>;
  engineVersion?: number;
  schoolLunchView?: boolean;
  lunchOverrides?: Record<string, string>;
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
    kitchenLists: { type: Schema.Types.Mixed },
    recentMealNames: { type: Schema.Types.Mixed },
    engineVersion: { type: Number, default: 0 },
    schoolLunchView: { type: Boolean },
    lunchOverrides: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

MealPlanSchema.index({ userId: 1, childProfileId: 1 });

if (mongoose.models.MealPlan) {
  delete mongoose.models.MealPlan;
}

export const MealPlan: Model<IMealPlan> = mongoose.model<IMealPlan>("MealPlan", MealPlanSchema);
