import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IPDFReport extends Document {
  userId: Types.ObjectId;
  childProfileId: Types.ObjectId;
  mealPlanId: Types.ObjectId;
  fileName: string;
  generatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PDFReportSchema = new Schema<IPDFReport>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    childProfileId: { type: Schema.Types.ObjectId, ref: "ChildProfile", required: true },
    mealPlanId: { type: Schema.Types.ObjectId, ref: "MealPlan", required: true },
    fileName: { type: String, required: true },
    generatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const PDFReport: Model<IPDFReport> =
  mongoose.models.PDFReport ?? mongoose.model<IPDFReport>("PDFReport", PDFReportSchema);
