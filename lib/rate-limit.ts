/**
 * Rate limiter with two implementations sharing one interface:
 *
 *   Production  — Upstash Redis (set UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN)
 *   Local / CI  — in-memory Map (no env vars needed)
 *
 * Route handlers call `rateLimit(key, options)` and never touch the
 * implementation detail. Swap is transparent.
 *
 * Keying convention: `${routeName}:${ip}`
 */

import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

interface Options {
  /** Rolling window in ms. Default: 60 000 (1 min) */
  windowMs?: number
  /** Max requests per window. Default: 5 */
  max?: number
}

interface Result {
  success: boolean
  /** Seconds until the window resets — present only when success is false */
  retryAfter?: number
}

// ── Upstash implementation ────────────────────────────────────────────────────

function makeUpstashLimiter(max: number, windowMs: number): Ratelimit {
  return new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(max, `${windowMs} ms`),
    ephemeralCache: new Map(), // in-process cache reduces Redis round-trips
  })
}

// Cache limiter instances keyed by `${max}:${windowMs}` — avoids creating a
// new Redis connection on every request in the same function instance.
const limiterCache = new Map<string, Ratelimit>()

async function upstashRateLimit(key: string, options: Options): Promise<Result> {
  const max = options.max ?? 5
  const windowMs = options.windowMs ?? 60_000
  const cacheKey = `${max}:${windowMs}`

  let limiter = limiterCache.get(cacheKey)
  if (!limiter) {
    limiter = makeUpstashLimiter(max, windowMs)
    limiterCache.set(cacheKey, limiter)
  }

  const { success, reset } = await limiter.limit(key)
  if (success) return { success: true }
  return {
    success: false,
    retryAfter: Math.ceil((reset - Date.now()) / 1000),
  }
}

// ── In-memory fallback ────────────────────────────────────────────────────────

interface Entry {
  count: number
  resetAt: number
}

const store = new Map<string, Entry>()

function inMemoryRateLimit(key: string, options: Options): Result {
  const max = options.max ?? 5
  const windowMs = options.windowMs ?? 60_000
  const now = Date.now()

  const entry = store.get(key)
  if (!entry || entry.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return { success: true }
  }
  if (entry.count >= max) {
    return { success: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) }
  }
  entry.count++
  return { success: true }
}

// ── Public API ────────────────────────────────────────────────────────────────

const useUpstash =
  !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN

export async function rateLimit(key: string, options: Options = {}): Promise<Result> {
  if (useUpstash) return upstashRateLimit(key, options)
  return inMemoryRateLimit(key, options)
}
