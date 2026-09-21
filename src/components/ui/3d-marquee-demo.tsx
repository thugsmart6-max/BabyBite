"use client";

import { SAMPLE_PACKS } from "@/components/babybite/oats-brand";
import { ThreeDMarquee } from "@/components/ui/3d-marquee";
import { useMotherLocale } from "@/components/providers/locale-provider";
import { brandArtForPackIndex } from "@/lib/marquee-brand-art";

/** Match Aceternity demo density (31 tiles → 4 columns). */
const TILE_COUNT = 31;

/**
 * Landing: canonical Aceternity 3D structure with BabyBite images + benefit copy.
 */
export default function ThreeDMarqueeDemo() {
  const { t } = useMotherLocale();
  const cards = Array.from({ length: TILE_COUNT }, (_, index) => {
    const packIndex = index % SAMPLE_PACKS.length;
    const item = SAMPLE_PACKS[packIndex];
    const art = brandArtForPackIndex(packIndex);
    return {
      title: t(item.nameKey),
      slot: t(item.slotKey),
      tone: item.tone,
      src: art.src,
      imageFit: art.fit,
    };
  });

  return (
    <div className="mx-auto max-w-7xl rounded-3xl bg-gray-950/5 p-2 ring-1 ring-neutral-700/10 dark:bg-neutral-800">
      <ThreeDMarquee cards={cards} />
    </div>
  );
}
