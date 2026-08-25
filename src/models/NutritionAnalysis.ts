import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IAnalysisImprovement {
  label: string;
  status: "good" | "needs-work";
  icon: string;
}

export interface INutritionAnalysis extends Document {
  userId: Types.ObjectId;
  childProfileId: Types.ObjectId;
  score: number;
  summary: string;
  improvements: IAnalysisImprovement[];
  createdAt: Date;
  updatedAt: Date;
}

const NutritionAnalysisSchema = new Schema<INutritionAnalysis>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    childProfileId: {
      type: Schema.Types.ObjectId,
      ref: "ChildProfile",
      required: true,
      index: true,
    },
    score: { type: Number, required: true, min: 0, max: 100 },
    summary: { type: String, required: true },
    improvements: [
      {
        label: String,
        status: { type: String, enum: ["good", "needs-work"] },
        icon: String,
      },
    ],
  },
  { timestamps: true }
);

export const NutritionAnalysis: Model<INutritionAnalysis> =
  mongoose.models.NutritionAnalysis ??
  mongoose.model<INutritionAnalysis>("NutritionAnalysis", NutritionAnalysisSchema);
