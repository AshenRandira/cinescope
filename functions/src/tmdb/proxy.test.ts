import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createTmdbApiHandler } from './proxy.js'

class TestResponse {
  body: unknown
  readonly headers = new Map<string, string>()
  statusCode = 200

  json(body: unknown): this {
    this.body = body
    return this
  }

  set(field: string, value: string): this {
    this.headers.set(field.toLowerCase(), value)
    return this
  }

  status(statusCode: number): this {
    this.statusCode = statusCode
    return this
  }
}

function createRequest(
  url: string,
  overrides: Partial<{
    headers: Record<string, string>
    method: string
  }> = {},
) {
  return {
    headers: {
      host: 'cinescope.test',
      ...overrides.headers,
    },
    ip: '127.0.0.1',
    method: overrides.method ?? 'GET',
    originalUrl: url,
    url,
  }
}

describe('TMDB proxy handler', () => {
  const logger = {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('keeps the bearer token server-side and caches successful public data', async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ page: 1, results: [] }), {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }),
    )
    const handler = createTmdbApiHandler({
      enforceAppCheck: () => false,
      fetchImpl,
      getSecret: () => 'server-secret',
      logger,
      requestId: () => 'request-123',
      verifyAppCheck: vi.fn(),
    })
    const request = createRequest(
      '/api/tmdb/movie/popular?language=en-US&page=1',
    )
    const firstResponse = new TestResponse()
    const secondResponse = new TestResponse()

    await handler(request, firstResponse)
    await handler(request, secondResponse)

    const [, upstreamOptions] = fetchImpl.mock.calls[0]
    const upstreamHeaders = new Headers(
      upstreamOptions?.headers,
    )

    expect(fetchImpl).toHaveBeenCalledTimes(1)
    expect(upstreamHeaders.get('Authorization')).toBe(
      'Bearer server-secret',
    )
    expect(firstResponse.statusCode).toBe(200)
    expect(firstResponse.headers.get('x-cinescope-cache')).toBe('MISS')
    expect(secondResponse.headers.get('x-cinescope-cache')).toBe('HIT')
    expect(JSON.stringify(secondResponse.body)).not.toContain(
      'server-secret',
    )
  })

  it('rejects unsupported methods and cross-origin requests', async () => {
    const handler = createTmdbApiHandler({
      enforceAppCheck: () => false,
      getSecret: () => 'server-secret',
      logger,
      verifyAppCheck: vi.fn(),
    })
    const methodResponse = new TestResponse()
    const originResponse = new TestResponse()

    await handler(
      createRequest('/api/tmdb/movie/popular', {
        method: 'POST',
      }),
      methodResponse,
    )
    await handler(
      createRequest('/api/tmdb/movie/popular', {
        headers: { origin: 'https://other.example' },
      }),
      originResponse,
    )

    expect(methodResponse.statusCode).toBe(405)
    expect(methodResponse.headers.get('allow')).toBe('GET')
    expect(originResponse.statusCode).toBe(403)
  })

  it('supports staged App Check enforcement and normalizes invalid tokens', async () => {
    const verifyAppCheck = vi.fn().mockRejectedValue(
      new Error('sensitive verifier details'),
    )
    const handler = createTmdbApiHandler({
      enforceAppCheck: () => true,
      getSecret: () => 'server-secret',
      logger,
      verifyAppCheck,
    })
    const missingResponse = new TestResponse()
    const invalidResponse = new TestResponse()

    await handler(
      createRequest('/api/tmdb/movie/popular'),
      missingResponse,
    )
    await handler(
      createRequest('/api/tmdb/movie/popular', {
        headers: { 'x-firebase-appcheck': 'invalid' },
      }),
      invalidResponse,
    )

    expect(missingResponse.statusCode).toBe(401)
    expect(invalidResponse.statusCode).toBe(401)
    expect(JSON.stringify(invalidResponse.body)).not.toContain(
      'sensitive verifier details',
    )
  })

  it('normalizes upstream failures without returning the upstream body', async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({ status_message: 'Invalid API key: secret' }),
        { status: 401 },
      ),
    )
    const handler = createTmdbApiHandler({
      enforceAppCheck: () => false,
      fetchImpl,
      getSecret: () => 'server-secret',
      logger,
      requestId: () => 'request-500',
      verifyAppCheck: vi.fn(),
    })
    const response = new TestResponse()

    await handler(
      createRequest('/api/tmdb/movie/popular'),
      response,
    )

    expect(response.statusCode).toBe(502)
    expect(response.body).toEqual({
      error: {
        code: 'upstream_failure',
        message:
          'The catalogue service could not complete this request.',
        requestId: 'request-500',
      },
    })
  })
})
