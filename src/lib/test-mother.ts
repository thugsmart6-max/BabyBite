import bcrypt from "bcryptjs";
import { TERMS_VERSION } from "@/lib/constants";
import { User } from "@/models/User";

/** Kitchen test login. Kept on the server so it works in local and production Mongo. */
export const TEST_MOTHER = {
  email: "mother.dev@example.com",
  name: "Dev Mother",
  password: "Kitchen159",
} as const;

let seedPromise: Promise<void> | null = null;

export async function ensureTestMotherAccount() {
  if (!seedPromise) {
    seedPromise = upsertTestMother().catch((error) => {
      seedPromise = null;
      throw error;
    });
  }
  return seedPromise;
}

async function upsertTestMother() {
  const email = TEST_MOTHER.email;
  const existing = await User.findOne({ email }).select("+password");

  if (existing) {
    const passwordOk = existing.password
      ? await bcrypt.compare(TEST_MOTHER.password, existing.password)
      : false;
    if (!passwordOk) {
      existing.password = await bcrypt.hash(TEST_MOTHER.password, 12);
    }
    existing.authProvider = existing.authProvider ?? "credentials";
    if (!existing.name?.trim()) existing.name = TEST_MOTHER.name;
    if (!existing.termsAcceptedAt) existing.termsAcceptedAt = new Date();
    if (!existing.termsVersion) existing.termsVersion = TERMS_VERSION;
    await existing.save();
    return;
  }

  await User.create({
    name: TEST_MOTHER.name,
    email,
    password: await bcrypt.hash(TEST_MOTHER.password, 12),
    role: "parent",
    onboardingComplete: false,
    authProvider: "credentials",
    termsAcceptedAt: new Date(),
    termsVersion: TERMS_VERSION,
  });
}
