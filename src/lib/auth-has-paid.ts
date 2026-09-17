import { connectDB } from "@/lib/mongodb";
import { ChildProfile } from "@/models/ChildProfile";
import mongoose from "mongoose";

export async function loadUserHasPaid(userId: string): Promise<boolean> {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return false;
  }

  await connectDB();
  const paid = await ChildProfile.exists({ userId, hasPaid: true });
  return Boolean(paid);
}
