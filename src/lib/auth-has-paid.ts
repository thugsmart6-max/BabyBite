import { connectDB } from "@/lib/mongodb";
import { ChildProfile } from "@/models/ChildProfile";
import mongoose from "mongoose";

export async function loadUserHasPaid(userId: string): Promise<boolean> {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return false;
  }

  await connectDB();
  const child = await ChildProfile.findOne({ userId })
    .sort({ createdAt: -1 })
    .select("hasPaid")
    .lean();
  return child?.hasPaid ?? false;
}
