import { renderToBuffer } from "@react-pdf/renderer";
import { KidFuelPDFDocument } from "@/components/pdf/kidfuel-report";
import type { GeneratedMealPlan, KidFuelChildProfile } from "@/types/kidfuel";

export async function generatePDFBuffer(
  profile: KidFuelChildProfile,
  plan: GeneratedMealPlan
): Promise<Buffer> {
  const doc = KidFuelPDFDocument({ profile, plan });
  const buffer = await renderToBuffer(doc);
  return Buffer.from(buffer);
}

export function pdfFileName(childName: string): string {
  const safe = childName.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();
  return `babybite-plan-${safe}-${Date.now()}.pdf`;
}
