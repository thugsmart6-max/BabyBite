import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IPayment extends Document {
  userId: Types.ObjectId;
  childProfileId: Types.ObjectId;
  planTier: string;
  planName: string;
  originalPrice: number;
  discountPercent: number;
  finalPrice: number;
  spinResult: number;
  status: "demo_paid" | "pending" | "failed";
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    childProfileId: {
      type: Schema.Types.ObjectId,
      ref: "ChildProfile",
      required: true,
    },
    planTier: { type: String, required: true },
    planName: { type: String, required: true },
    originalPrice: { type: Number, required: true },
    discountPercent: { type: Number, required: true },
    finalPrice: { type: Number, required: true },
    spinResult: { type: Number, required: true },
    status: {
      type: String,
      enum: ["demo_paid", "pending", "failed"],
      default: "demo_paid",
    },
  },
  { timestamps: true }
);

export const Payment: Model<IPayment> =
  mongoose.models.Payment ?? mongoose.model<IPayment>("Payment", PaymentSchema);
