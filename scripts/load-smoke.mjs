#!/usr/bin/env node
/**
 * Light concurrency smoke test (no auth). Example:
 *   node scripts/load-smoke.mjs https://baby-bite.vercel.app 20
 */
const base = (process.argv[2] ?? "http://localhost:3000").replace(/\/$/, "");
const concurrency = Math.min(Number(process.argv[3] ?? 10) || 10, 100);
const url = `${base}/api/health`;

const started = Date.now();
const results = await Promise.all(
  Array.from({ length: concurrency }, async (_, i) => {
    const t0 = Date.now();
    try {
      const res = await fetch(url);
      const json = await res.json().catch(() => ({}));
      return { i, ok: res.ok, status: res.status, ms: Date.now() - t0, json };
    } catch (err) {
      return { i, ok: false, status: 0, ms: Date.now() - t0, error: String(err) };
    }
  })
);

const failed = results.filter((r) => !r.ok);
console.log(
  JSON.stringify(
    {
      url,
      concurrency,
      totalMs: Date.now() - started,
      ok: results.length - failed.length,
      failed: failed.length,
      p95Ms: results.map((r) => r.ms).sort((a, b) => a - b)[Math.floor(results.length * 0.95)] ?? 0,
      sample: results.slice(0, 3),
    },
    null,
    2
  )
);
process.exit(failed.length ? 1 : 0);
