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
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  status: "demo_paid" | "pending" | "paid" | "failed";
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
    razorpayOrderId: { type: String, index: true, sparse: true },
    razorpayPaymentId: { type: String, sparse: true },
    status: {
      type: String,
      enum: ["demo_paid", "pending", "paid", "failed"],
      default: "demo_paid",
    },
  },
  { timestamps: true }
);

PaymentSchema.index({ userId: 1, childProfileId: 1, status: 1, createdAt: -1 });

export const Payment: Model<IPayment> =
  mongoose.models.Payment ?? mongoose.model<IPayment>("Payment", PaymentSchema);
