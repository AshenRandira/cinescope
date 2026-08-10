export type CacheProfile =
  | 'catalogue'
  | 'details'
  | 'genres'
  | 'private'

export type CachedResponse = {
  body: unknown
  expiresAt: number
}

const CACHE_TTL_MS: Record<CacheProfile, number> = {
  catalogue: 5 * 60 * 1000,
  details: 5 * 60 * 1000,
  genres: 60 * 60 * 1000,
  private: 0,
}

export const CACHE_CONTROL: Record<CacheProfile, string> = {
  catalogue:
    'public, max-age=60, s-maxage=300, stale-while-revalidate=600',
  details:
    'public, max-age=60, s-maxage=300, stale-while-revalidate=600',
  genres:
    'public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400',
  private: 'private, no-store, max-age=0',
}

export class ResponseCache {
  readonly #entries = new Map<string, CachedResponse>()
  readonly #maxEntries: number
  readonly #now: () => number

  constructor(
    maxEntries = 250,
    now: () => number = Date.now,
  ) {
    this.#maxEntries = maxEntries
    this.#now = now
  }

  get(key: string): unknown | undefined {
    const entry = this.#entries.get(key)

    if (!entry) return undefined

    if (entry.expiresAt <= this.#now()) {
      this.#entries.delete(key)
      return undefined
    }

    this.#entries.delete(key)
    this.#entries.set(key, entry)
    return entry.body
  }

  set(
    key: string,
    body: unknown,
    profile: CacheProfile,
  ): void {
    const ttl = CACHE_TTL_MS[profile]

    if (ttl === 0) return

    this.#entries.delete(key)
    this.#entries.set(key, {
      body,
      expiresAt: this.#now() + ttl,
    })

    while (this.#entries.size > this.#maxEntries) {
      const oldestKey = this.#entries.keys().next()

      if (oldestKey.done) break
      this.#entries.delete(oldestKey.value)
    }
  }
}
