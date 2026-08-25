import { User } from "@/models/User";
import { pdfDeliveryEmailSchema } from "@/schemas/kidfuel";

export type PdfEmailValidationResult =
  | { ok: true; email: string }
  | { ok: false; error: string; status: 400 | 409 };

export function parsePdfDeliveryEmail(input: unknown): PdfEmailValidationResult {
  const parsed = pdfDeliveryEmailSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid email",
      status: 400,
    };
  }
  return { ok: true, email: parsed.data.email };
}

/** Reject emails already registered to a different BabyBite account. */
export async function assertPdfEmailAvailable(
  email: string,
  userId: string
): Promise<PdfEmailValidationResult> {
  const conflict = await User.findOne({
    email,
    _id: { $ne: userId },
  }).select("_id");

  if (conflict) {
    return {
      ok: false,
      error: "This email is already registered to another account",
      status: 409,
    };
  }

  return { ok: true, email };
}
