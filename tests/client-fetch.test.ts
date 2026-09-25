import { afterEach, describe, expect, it, vi } from "vitest";
import { clearClientFetchCache, fetchJson } from "@/lib/client-fetch";

describe("client fetch helpers", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    clearClientFetchCache();
  });

  it("dedupes concurrent GET requests when cacheGet is enabled", async () => {
    let calls = 0;
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        calls += 1;
        await new Promise((r) => setTimeout(r, 30));
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      })
    );

    const [a, b] = await Promise.all([
      fetchJson("/api/test-dedupe", { cacheGet: true }),
      fetchJson("/api/test-dedupe", { cacheGet: true }),
    ]);

    expect(calls).toBe(1);
    expect(a.json).toEqual({ ok: true });
    expect(b.json).toEqual({ ok: true });
  });

  it("aborts slow requests with REQUEST_TIMEOUT", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((_url, init) => {
        return new Promise((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => {
            reject(new DOMException("Aborted", "AbortError"));
          });
        });
      })
    );

    await expect(fetchJson("/api/slow", { timeoutMs: 20 })).rejects.toThrow("REQUEST_TIMEOUT");
  });
});
