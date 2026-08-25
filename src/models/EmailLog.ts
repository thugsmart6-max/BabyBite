import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IEmailLog extends Document {
  userId: Types.ObjectId;
  childProfileId: Types.ObjectId;
  to: string;
  subject: string;
  status: "sent" | "failed" | "skipped";
  error?: string;
  sentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const EmailLogSchema = new Schema<IEmailLog>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    childProfileId: { type: Schema.Types.ObjectId, ref: "ChildProfile", required: true },
    to: { type: String, required: true },
    subject: { type: String, required: true },
    status: { type: String, enum: ["sent", "failed", "skipped"], required: true },
    error: String,
    sentAt: Date,
  },
  { timestamps: true }
);

export const EmailLog: Model<IEmailLog> =
  mongoose.models.EmailLog ?? mongoose.model<IEmailLog>("EmailLog", EmailLogSchema);
