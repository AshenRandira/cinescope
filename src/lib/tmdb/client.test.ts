import { beforeEach, describe, expect, it, vi } from 'vitest'

const { getFirebaseAppCheckToken } = vi.hoisted(() => ({
  getFirebaseAppCheckToken:
    vi.fn<() => Promise<string | null>>(),
}))

vi.mock('../../config/firebase', () => ({
  getFirebaseAppCheckToken,
}))

import {
  buildTmdbApiUrl,
  TmdbApiError,
  tmdbFetch,
} from './client'

describe('TMDB API client boundary', () => {
  beforeEach(() => {
    getFirebaseAppCheckToken.mockReset()
    getFirebaseAppCheckToken.mockResolvedValue(null)
    vi.unstubAllGlobals()
  })

  it('builds a same-origin API URL without an upstream host', () => {
    expect(
      buildTmdbApiUrl('/discover/movie', {
        include_adult: false,
        page: 2,
      }),
    ).toBe('/api/tmdb/discover/movie?include_adult=false&page=2')
  })

  it('rejects paths that could escape the controlled API prefix', () => {
    expect(() => buildTmdbApiUrl('../configuration')).toThrow(
      TmdbApiError,
    )
  })

  it('calls only the CineScope API and never sets a TMDB authorization header', async () => {
    getFirebaseAppCheckToken.mockResolvedValue('app-check-token')
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ page: 1, results: [] }), {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    await tmdbFetch('/movie/popular', {
      query: { language: 'en-US', page: 1 },
    })

    const [url, options] = fetchMock.mock.calls[0]
    const headers = new Headers(options?.headers)

    expect(url).toBe(
      '/api/tmdb/movie/popular?language=en-US&page=1',
    )
    expect(headers.get('Accept')).toBe('application/json')
    expect(headers.get('Authorization')).toBeNull()
    expect(headers.get('X-Firebase-AppCheck')).toBe(
      'app-check-token',
    )
  })

  it('uses normalized API errors and retains the request reference', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>().mockResolvedValue(
        new Response(
          JSON.stringify({
            error: {
              code: 'invalid_request',
              message: 'The catalogue parameter page is invalid.',
              requestId: 'request-123',
            },
          }),
          { status: 400 },
        ),
      ),
    )

    const request = tmdbFetch('/movie/popular', {
      query: { page: 0 },
    })

    await expect(request).rejects.toMatchObject({
      endpoint: '/api/tmdb/movie/popular?page=0',
      message: 'The catalogue parameter page is invalid.',
      requestId: 'request-123',
      status: 400,
    })
  })
})
