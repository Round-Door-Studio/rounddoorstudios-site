/**
 * Wraps an `unstable_cache`-wrapped read with a bounded fallback to the raw,
 * uncached implementation.
 *
 * Why this exists: `unstable_cache`, on bare `next start`'s default
 * filesystem cache handler (no Vercel-managed cache backend — exactly what
 * CI's Playwright job runs against), has a known, non-deterministic failure
 * mode where a cache read can hang indefinitely past the point the
 * underlying query has already completed — traced to Next's own cache
 * bookkeeping, not the query itself. Whether real, Vercel-hosted production
 * (which swaps in a different, managed cache handler) is also affected is
 * unconfirmed.
 *
 * This wrapper races the cached call against `timeoutMs`. If the cache
 * hasn't resolved in time, it falls back to the raw function for that one
 * request — trading that request's caching benefit for correctness (never
 * blocking a response indefinitely, and never serving stale data — the
 * fallback is a fresh read, not a cached-but-expired one). The abandoned
 * cached call is not cancelled (`unstable_cache` exposes no way to do that)
 * and keeps running in the background; if it eventually resolves, that's
 * harmless — it just repopulates the cache for the next request.
 *
 * `timeoutMs` should be generous relative to normal query latency (these
 * Supabase reads normally complete in well under a second) so this only
 * fires on a genuine stall, never on ordinary jitter — too tight a timeout
 * would silently turn this from "rare safety net" into "cache never helps".
 */
export function withCacheFallback<Args extends unknown[], T>(
  cached: (...args: Args) => Promise<T>,
  raw: (...args: Args) => Promise<T>,
  timeoutMs: number,
  label: string,
): (...args: Args) => Promise<T> {
  return async (...args: Args): Promise<T> => {
    let timer: ReturnType<typeof setTimeout>;
    const timedOut = new Promise<typeof TIMED_OUT>((resolve) => {
      timer = setTimeout(() => resolve(TIMED_OUT), timeoutMs);
    });

    try {
      const result = await Promise.race([cached(...args), timedOut]);
      if (result === TIMED_OUT) {
        console.warn(`[db cache] ${label} exceeded ${timeoutMs}ms — falling back to an uncached read`);
        return await raw(...args);
      }
      return result;
    } finally {
      clearTimeout(timer!);
    }
  };
}

const TIMED_OUT = Symbol('cache-fallback-timeout');
