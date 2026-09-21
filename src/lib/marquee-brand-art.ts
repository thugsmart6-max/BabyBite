/** One kitchen / brand image per benefit pack (same order as SAMPLE_PACKS). */
export const MARQUEE_BRAND_ART: {
  src: string;
  fit: "contain" | "cover";
}[] = [
  { src: "/art-tiffins.png", fit: "contain" },
  { src: "/art-tiffin.png", fit: "contain" },
  { src: "/site images food.png", fit: "cover" },
  { src: "/proterin,iron,calcium,energy.png", fit: "contain" },
  { src: "/art-mark.png", fit: "contain" },
  { src: "/art-compare.png", fit: "contain" },
];

export function brandArtForPackIndex(index: number) {
  return MARQUEE_BRAND_ART[index % MARQUEE_BRAND_ART.length];
}
