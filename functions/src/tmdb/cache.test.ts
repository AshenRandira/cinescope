import { describe, expect, it } from 'vitest'

import { ResponseCache } from './cache.js'
import { FixedWindowRateLimiter } from './rateLimit.js'

describe('bounded API controls', () => {
  it('expires cached responses and never stores private searches', () => {
    let now = 1_000
    const cache = new ResponseCache(2, () => now)

    cache.set('details', { id: 550 }, 'details')
    cache.set('search', { results: [] }, 'private')

    expect(cache.get('details')).toEqual({ id: 550 })
    expect(cache.get('search')).toBeUndefined()

    now += 5 * 60 * 1_000
    expect(cache.get('details')).toBeUndefined()
  })

  it('enforces a fixed request window with retry metadata', () => {
    let now = 10_000
    const limiter = new FixedWindowRateLimiter({
      limit: 2,
      now: () => now,
      windowMs: 1_000,
    })

    expect(limiter.consume('client').allowed).toBe(true)
    expect(limiter.consume('client').allowed).toBe(true)
    expect(limiter.consume('client')).toMatchObject({
      allowed: false,
      retryAfterSeconds: 1,
    })

    now += 1_000
    expect(limiter.consume('client').allowed).toBe(true)
  })
})
