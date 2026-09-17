"use client";

import { ThreeDMarquee } from "@/components/ui/3d-marquee";

const KITCHEN_STILLS = [
  "/art-tiffin.png",
  "/art-tiffins.png",
  "/art-nutrients.png",
  "/art-compare.png",
  "/art-mark.png",
];

export default function ThreeDMarqueeDemo() {
  const images = Array.from({ length: 31 }, (_, index) => KITCHEN_STILLS[index % KITCHEN_STILLS.length]);
  return (
    <div className="mx-auto my-10 max-w-7xl overflow-hidden rounded-3xl bg-gray-950/5 p-2 ring-1 ring-neutral-700/10 dark:bg-neutral-800">
      <ThreeDMarquee images={images} />
    </div>
  );
}
