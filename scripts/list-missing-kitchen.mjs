import { BABYBITE_MEALS } from "../src/lib/data/babybite-meals.ts";
import fs from "fs";

const src = fs.readFileSync("./src/lib/kitchen-translate.ts", "utf8");
const keys = new Set(
  [...src.matchAll(/"([^"]+)":\s*\{\s*ta:/g)].map((m) => m[1].toLowerCase())
);
const missingNames = [];
const missingDesc = [];
for (const m of BABYBITE_MEALS) {
  if (!keys.has(m.name.toLowerCase())) missingNames.push(m.name);
  if (!keys.has(m.description.toLowerCase())) missingDesc.push(m.description);
}
console.log("missing names", missingNames.length);
console.log(missingNames.join("\n"));
console.log("missing desc", missingDesc.length);
for (const d of missingDesc) console.log("---\n" + d);
