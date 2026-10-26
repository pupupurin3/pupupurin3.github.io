import type { MiddlewareHandler } from 'hono'
import type { AppEnv } from '../env'
import { ApiError } from '../lib/errors'
import { visitorId } from '../lib/visitor'

export interface RateLimitOptions {
  /** Bucket name; each route family gets its own budget. */
  name: string
  limit: number
  windowMs: number
}

/**
 * Fixed-window rate limit per visitor, stored in D1 so every Worker instance
 * shares the same counts. Sends the IETF RateLimit-* headers on every
 * response and a 429 with Retry-After once the budget is spent.
 */
export function rateLimit({ name, limit, windowMs }: RateLimitOptions): MiddlewareHandler<AppEnv> {
  return async (c, next) => {
    const now = Date.now()
    const windowStart = now - (now % windowMs)
    const count = await c.var.repos.rateLimits.hit(`${name}:${await visitorId(c)}`, windowStart)
    const resetSeconds = Math.max(1, Math.ceil((windowStart + windowMs - now) / 1000))
    c.header('RateLimit-Limit', String(limit))
    c.header('RateLimit-Remaining', String(Math.max(0, limit - count)))
    c.header('RateLimit-Reset', String(resetSeconds))
    if (count > limit) {
      throw new ApiError(429, 'Too Many Requests', `Slow down a little. Try again in ${resetSeconds} seconds.`, {
        headers: { 'Retry-After': String(resetSeconds) },
      })
    }
    await next()
  }
}
