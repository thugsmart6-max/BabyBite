/** Educational age bands only — not a diagnosis or a promise of extra centimetres. */

export type GrowthBand = {
  ageYears: number;
  heightCm: string;
  weightKg: string;
};

const BANDS: Record<number, Omit<GrowthBand, "ageYears">> = {
  4: { heightCm: "94–110 cm", weightKg: "12–20 kg" },
  5: { heightCm: "100–116 cm", weightKg: "14–22 kg" },
  6: { heightCm: "106–122 cm", weightKg: "16–25 kg" },
  7: { heightCm: "112–128 cm", weightKg: "18–28 kg" },
  8: { heightCm: "118–134 cm", weightKg: "20–32 kg" },
  9: { heightCm: "123–140 cm", weightKg: "22–36 kg" },
  10: { heightCm: "128–146 cm", weightKg: "24–40 kg" },
  11: { heightCm: "133–152 cm", weightKg: "26–45 kg" },
  12: { heightCm: "138–160 cm", weightKg: "28–50 kg" },
};

export function growthBandForAge(ageYears: number): GrowthBand {
  const clamped = Math.min(12, Math.max(4, Math.round(ageYears) || 7));
  const band = BANDS[clamped] ?? BANDS[7];
  return { ageYears: clamped, ...band };
}
