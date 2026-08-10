type RateLimitEntry = {
  count: number
  resetAt: number
}

export type RateLimitDecision = {
  allowed: boolean
  remaining: number
  retryAfterSeconds: number
}

export class FixedWindowRateLimiter {
  readonly #entries = new Map<string, RateLimitEntry>()
  readonly #limit: number
  readonly #maxEntries: number
  readonly #now: () => number
  readonly #windowMs: number

  constructor({
    limit = 120,
    maxEntries = 2_000,
    now = Date.now,
    windowMs = 60_000,
  }: {
    limit?: number
    maxEntries?: number
    now?: () => number
    windowMs?: number
  } = {}) {
    this.#limit = limit
    this.#maxEntries = maxEntries
    this.#now = now
    this.#windowMs = windowMs
  }

  consume(key: string): RateLimitDecision {
    const now = this.#now()
    let entry = this.#entries.get(key)

    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + this.#windowMs }
      this.#entries.set(key, entry)
    }

    entry.count += 1
    this.#prune(now)

    return {
      allowed: entry.count <= this.#limit,
      remaining: Math.max(0, this.#limit - entry.count),
      retryAfterSeconds: Math.max(
        1,
        Math.ceil((entry.resetAt - now) / 1_000),
      ),
    }
  }

  #prune(now: number): void {
    for (const [key, entry] of this.#entries) {
      if (entry.resetAt <= now) this.#entries.delete(key)
    }

    while (this.#entries.size > this.#maxEntries) {
      const oldestKey = this.#entries.keys().next()

      if (oldestKey.done) break
      this.#entries.delete(oldestKey.value)
    }
  }
}
