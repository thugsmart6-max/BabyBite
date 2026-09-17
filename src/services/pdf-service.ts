import { renderToBuffer } from "@react-pdf/renderer";
import { BabyBitePDFDocument } from "@/components/pdf/babybite-report";
import type { GeneratedMealPlan, BabyBiteChildProfile } from "@/types/babybite";

export async function generatePDFBuffer(
  profile: BabyBiteChildProfile,
  plan: GeneratedMealPlan
): Promise<Buffer> {
  const doc = BabyBitePDFDocument({ profile, plan });
  const buffer = await renderToBuffer(doc);
  return Buffer.from(buffer);
}

export function pdfFileName(childName: string): string {
  const safe = childName.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();
  return `babybite-plan-${safe}-${Date.now()}.pdf`;
}
