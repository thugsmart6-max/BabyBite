import { expect, test } from "./fixtures";
import { assertNoHorizontalOverflow, gotoReady } from "./helpers";

const MONITORS = [
  { name: "hd1366", width: 1366, height: 768 },
  { name: "hd1280", width: 1280, height: 720 },
  { name: "scaled1536", width: 1536, height: 864 },
  { name: "fhd1900", width: 1900, height: 1080 },
  { name: "fhd1920", width: 1920, height: 1080 },
  { name: "qhd2560", width: 2560, height: 1440 },
  { name: "ultrawide3440", width: 3440, height: 1440 },
] as const;

const PATHS = ["/landing", "/login", "/results"] as const;

test.describe("monitor fit", () => {
  for (const monitor of MONITORS) {
    for (const path of PATHS) {
      test(`${monitor.name} ${path} has no horizontal overflow`, async ({ page }) => {
        await page.setViewportSize({ width: monitor.width, height: monitor.height });
        if (path === "/results") {
          await page.goto(path);
          await page.waitForLoadState("domcontentloaded");
        } else {
          await gotoReady(page, path);
        }
        await assertNoHorizontalOverflow(page, `${monitor.name} ${path}`);

        const offenders = await page.evaluate(() => {
          const vw = window.innerWidth;
          const hits: string[] = [];
          const isClipped = (el: Element) => {
            for (let node: Element | null = el; node; node = node.parentElement) {
              const style = window.getComputedStyle(node);
              if (style.overflowX === "hidden" || style.overflowX === "clip") return true;
              if (node.classList.contains("os-marquee")) return true;
            }
            return false;
          };
          for (const el of document.querySelectorAll("*")) {
            const style = window.getComputedStyle(el);
            if (style.display === "none" || style.visibility === "hidden") continue;
            if (isClipped(el)) continue;
            const r = el.getBoundingClientRect();
            if (r.width < 2 || r.height < 2) continue;
            if (r.right > vw + 2 || r.left < -2) {
              const tag = el.tagName.toLowerCase();
              const id = el.id ? `#${el.id}` : "";
              const cls =
                el.classList.length > 0
                  ? `.${[...el.classList].slice(0, 3).join(".")}`
                  : "";
              hits.push(`${tag}${id}${cls} (${Math.round(r.left)}–${Math.round(r.right)} / ${vw})`);
            }
            if (hits.length >= 8) break;
          }
          return hits;
        });
        expect(offenders, `${monitor.name} ${path} unclipped DOM bleed`).toEqual([]);
      });
    }
  }
});
