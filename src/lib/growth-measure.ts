export type GrowthFields = {
  heightCm?: number;
  weightKg?: number;
  baselineHeightCm?: number;
  baselineWeightKg?: number;
  baselineNotedAt?: Date;
  remeasuredAt?: Date;
};

export function nextGrowthFields(
  existing: GrowthFields | null | undefined,
  incoming: { heightCm?: number; weightKg?: number }
): GrowthFields {
  const now = new Date();
  const next: GrowthFields = {};

  if (incoming.heightCm !== undefined) {
    next.heightCm = incoming.heightCm;
    if (existing?.baselineHeightCm == null) {
      next.baselineHeightCm = incoming.heightCm;
      next.baselineNotedAt = existing?.baselineNotedAt ?? now;
    } else {
      next.baselineHeightCm = existing.baselineHeightCm;
      next.baselineNotedAt = existing.baselineNotedAt;
      if (incoming.heightCm !== existing.heightCm) {
        next.remeasuredAt = now;
      }
    }
  } else if (existing?.baselineHeightCm != null) {
    next.baselineHeightCm = existing.baselineHeightCm;
    next.baselineNotedAt = existing.baselineNotedAt;
  }

  if (incoming.weightKg !== undefined) {
    next.weightKg = incoming.weightKg;
    if (existing?.baselineWeightKg == null) {
      next.baselineWeightKg = incoming.weightKg;
      next.baselineNotedAt = next.baselineNotedAt ?? existing?.baselineNotedAt ?? now;
    } else {
      next.baselineWeightKg = existing.baselineWeightKg;
      if (incoming.weightKg !== existing.weightKg) {
        next.remeasuredAt = now;
      }
    }
  } else if (existing?.baselineWeightKg != null) {
    next.baselineWeightKg = existing.baselineWeightKg;
  }

  if (existing?.remeasuredAt && !next.remeasuredAt) {
    next.remeasuredAt = existing.remeasuredAt;
  }

  return next;
}
