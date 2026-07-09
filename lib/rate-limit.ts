/**
 * In-memory rate limiter. Swap the store for an Upstash Redis client later
 * without touching the route handlers — just replace the logic inside `rateLimit`.
 *
 * Keying convention: `${routeName}:${ip}`
 */

interface Entry {
  count: number
  resetAt: number
}

// Module-level Map survives across requests within the same function instance.
// Good enough for serverless; upgrade to Upstash for multi-instance accuracy.
const store = new Map<string, Entry>()

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

export function rateLimit(key: string, options: Options = {}): Result {
  const windowMs = options.windowMs ?? 60_000
  const max = options.max ?? 5
  const now = Date.now()

  const entry = store.get(key)

  if (!entry || entry.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return { success: true }
  }

  if (entry.count >= max) {
    return {
      success: false,
      retryAfter: Math.ceil((entry.resetAt - now) / 1000),
    }
  }

  entry.count++
  return { success: true }
}
