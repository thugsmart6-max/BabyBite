const DEFAULT_TIMEOUT_MS = 25_000;
const GET_CACHE_MS = 4_000;

type FetchJsonInit = RequestInit & {
  timeoutMs?: number;
  /** Dedupe in-flight GETs with the same URL for a few seconds. */
  cacheGet?: boolean;
};

type CacheEntry = { promise: Promise<unknown>; at: number };

const inflightGet = new Map<string, CacheEntry>();

function cacheKey(url: string, init?: RequestInit) {
  return `${init?.method ?? "GET"}:${url}`;
}

export async function fetchJson<T = Record<string, unknown>>(
  url: string,
  init: FetchJsonInit = {}
): Promise<{ res: Response; json: T }> {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, cacheGet = false, ...requestInit } = init;
  const method = (requestInit.method ?? "GET").toUpperCase();
  const key = cacheKey(url, requestInit);

  if (method === "GET" && cacheGet) {
    const hit = inflightGet.get(key);
    if (hit && Date.now() - hit.at < GET_CACHE_MS) {
      const cached = (await hit.promise) as { res: Response; json: T };
      return { res: cached.res, json: { ...cached.json } };
    }
  }

  const run = async () => {
    const controller = new AbortController();
    const timer = globalThis.setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, { ...requestInit, signal: controller.signal });
      const json = (await res.json().catch(() => ({}))) as T;
      return { res, json };
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        throw new Error("REQUEST_TIMEOUT");
      }
      throw err;
    } finally {
      globalThis.clearTimeout(timer);
    }
  };

  const promise = run();
  if (method === "GET" && cacheGet) {
    inflightGet.set(key, { promise, at: Date.now() });
    promise.finally(() => {
      globalThis.setTimeout(() => {
        const current = inflightGet.get(key);
        if (current?.promise === promise) inflightGet.delete(key);
      }, GET_CACHE_MS);
    });
  }

  return promise;
}

/** Clear GET dedupe cache (e.g. after POST mutations). */
export function clearClientFetchCache() {
  inflightGet.clear();
}
