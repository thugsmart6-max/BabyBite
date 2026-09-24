import { translateKitchen } from "@/lib/kitchen-translate";
import type { MotherLang } from "@/lib/mother-copy";

/** Split engine rationale / swap copy into sentences, then localize each piece. */
export function translatePlanText(lang: MotherLang, text: string): string {
  if (lang === "en" || !text.trim()) return text;

  const segments = text
    .split(/(?<=[.!?])\s+/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (segments.length <= 1) {
    return translateKitchen(lang, text.trim());
  }

  return segments
    .map((segment) => {
      const normalized = segment.endsWith(".") || segment.endsWith("!") || segment.endsWith("?")
        ? segment
        : `${segment}.`;
      return translateKitchen(lang, normalized);
    })
    .join(" ");
}

export function translatePantryList(lang: MotherLang, items: string[]): string {
  return items.map((item) => translateKitchen(lang, item)).join(" · ");
}
