/**
 * Regenerates src/lib/kitchen-meal-descriptions-i18n.ts from meal templates.
 * Run: node scripts/generate-meal-description-i18n.mjs
 */
import { BABYBITE_MEALS } from "../src/lib/data/babybite-meals.ts";
import fs from "fs";

const lines = [
  '/** Auto-synced meal description strings from babybite-meals — do not edit keys by hand. */',
  'export const MEAL_DESCRIPTION_I18N: Record<string, { ta: string; hi: string }> = {',
];

for (const meal of BABYBITE_MEALS) {
  const key = meal.description.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  lines.push(`  "${key}": { ta: "", hi: "" },`);
}

lines.push("};");
lines.push("");

const out = "./src/lib/kitchen-meal-descriptions-i18n.ts";
fs.writeFileSync(out, lines.join("\n"));
console.log("Wrote", out, "entries", BABYBITE_MEALS.length);
