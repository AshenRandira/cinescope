import { randomUUID } from 'node:crypto'
import type { IncomingHttpHeaders } from 'node:http'

import { CACHE_CONTROL, ResponseCache } from './cache.js'
import {
  ApiError,
  getNormalizedUpstreamError,
} from './errors.js'
import { FixedWindowRateLimiter } from './rateLimit.js'
import { validateTmdbRequest } from './allowlist.js'

const API_PATH_PREFIX = '/api/tmdb'
const DEFAULT_UPSTREAM_ORIGIN = 'https://api.themoviedb.org/3/'
const MAX_UPSTREAM_BYTES = 5 * 1024 * 1024
const UPSTREAM_TIMEOUT_MS = 8_000

type RequestLike = {
  headers: IncomingHttpHeaders
  ip?: string
  method: string
  originalUrl?: string
  url: string
}

type ResponseLike = {
  json: (body: unknown) => unknown
  set: (field: string, value: string) => unknown
  status: (statusCode: number) => ResponseLike
}

type AppCheckResult = {
  appId: string
}

type LogContext = Record<
  string,
  boolean | number | string | undefined
>

type ApiLogger = {
  error: (message: string, context: LogContext) => void
  info: (message: string, context: LogContext) => void
  warn: (message: string, context: LogContext) => void
}

export type TmdbApiDependencies = {
  cache?: ResponseCache
  enforceAppCheck: () => boolean
  fetchImpl?: typeof fetch
  getSecret: () => string
  getUpstreamOrigin?: () => string
  logger: ApiLogger
  now?: () => number
  rateLimiter?: FixedWindowRateLimiter
  requestId?: () => string
  verifyAppCheck: (token: string) => Promise<AppCheckResult>
}

function getHeader(
  headers: IncomingHttpHeaders,
  name: string,
): string | undefined {
  const value = headers[name.toLowerCase()]
  return Array.isArray(value) ? value[0] : value
}

function getRequestUrl(request: RequestLike): URL {
  return new URL(
    request.originalUrl ?? request.url,
    'https://cinescope.invalid',
  )
}

function getApiPath(pathname: string): string {
  const prefixIndex = pathname.indexOf(API_PATH_PREFIX)

  if (prefixIndex === -1) return pathname

  const path = pathname.slice(prefixIndex + API_PATH_PREFIX.length)
  return path || '/'
}

function getClientKey(request: RequestLike): string {
  const forwardedFor = getHeader(
    request.headers,
    'x-forwarded-for',
  )

  return forwardedFor?.split(',')[0]?.trim() || request.ip || 'unknown'
}

function assertSameOriginRequest(request: RequestLike): void {
  const origin = getHeader(request.headers, 'origin')

  if (!origin) return

  let originHost: string

  try {
    originHost = new URL(origin).host
  } catch {
    throw new ApiError(
      'invalid_request',
      'The request origin is not valid.',
      403,
    )
  }

  const forwardedHost = getHeader(
    request.headers,
    'x-forwarded-host',
  )?.split(',')[0]?.trim()
  const requestHost = forwardedHost || getHeader(request.headers, 'host')

  if (!requestHost || originHost !== requestHost) {
    throw new ApiError(
      'invalid_request',
      'Cross-origin catalogue requests are not permitted.',
      403,
    )
  }
}

function setCommonHeaders(
  response: ResponseLike,
  requestId: string,
): void {
  response.set('Cross-Origin-Resource-Policy', 'same-origin')
  response.set('Referrer-Policy', 'no-referrer')
  response.set('X-Content-Type-Options', 'nosniff')
  response.set('X-Request-Id', requestId)
}

function sendError(
  response: ResponseLike,
  error: ApiError,
  requestId: string,
): void {
  response.set('Cache-Control', 'private, no-store, max-age=0')
  response.status(error.status).json({
    error: {
      code: error.code,
      message: error.message,
      requestId,
    },
  })
}

async function parseUpstreamBody(response: Response): Promise<unknown> {
  const declaredLength = Number(
    response.headers.get('content-length') ?? 0,
  )

  if (
    Number.isFinite(declaredLength) &&
    declaredLength > MAX_UPSTREAM_BYTES
  ) {
    throw new ApiError(
      'upstream_failure',
      'The catalogue service returned an oversized response.',
      502,
    )
  }

  const responseText = await response.text()

  if (Buffer.byteLength(responseText, 'utf8') > MAX_UPSTREAM_BYTES) {
    throw new ApiError(
      'upstream_failure',
      'The catalogue service returned an oversized response.',
      502,
    )
  }

  try {
    return JSON.parse(responseText) as unknown
  } catch {
    throw new ApiError(
      'upstream_failure',
      'The catalogue service returned an invalid response.',
      502,
    )
  }
}

export function createTmdbApiHandler({
  cache = new ResponseCache(),
  enforceAppCheck,
  fetchImpl = fetch,
  getSecret,
  getUpstreamOrigin = () => DEFAULT_UPSTREAM_ORIGIN,
  logger,
  now = Date.now,
  rateLimiter = new FixedWindowRateLimiter(),
  requestId: createRequestId = randomUUID,
  verifyAppCheck,
}: TmdbApiDependencies) {
  return async function tmdbApiHandler(
    request: RequestLike,
    response: ResponseLike,
  ): Promise<void> {
    const startedAt = now()
    const requestId = createRequestId()
    let routeName = 'unmatched'
    let cacheResult = 'BYPASS'

    setCommonHeaders(response, requestId)

    try {
      if (request.method !== 'GET') {
        response.set('Allow', 'GET')
        throw new ApiError(
          'method_not_allowed',
          'Only GET catalogue requests are supported.',
          405,
        )
      }

      assertSameOriginRequest(request)

      const appCheckToken = getHeader(
        request.headers,
        'x-firebase-appcheck',
      )

      if (appCheckToken) {
        try {
          await verifyAppCheck(appCheckToken)
        } catch {
          throw new ApiError(
            'app_check_required',
            'A valid application attestation is required.',
            401,
          )
        }
      } else if (enforceAppCheck()) {
        throw new ApiError(
          'app_check_required',
          'A valid application attestation is required.',
          401,
        )
      }

      const rateLimit = rateLimiter.consume(getClientKey(request))
      response.set(
        'X-RateLimit-Remaining',
        String(rateLimit.remaining),
      )

      if (!rateLimit.allowed) {
        response.set(
          'Retry-After',
          String(rateLimit.retryAfterSeconds),
        )
        throw new ApiError(
          'rate_limited',
          'Too many catalogue requests. Try again shortly.',
          429,
        )
      }

      const requestUrl = getRequestUrl(request)
      const validated = validateTmdbRequest(
        getApiPath(requestUrl.pathname),
        requestUrl.searchParams,
      )
      routeName = validated.routeName

      const cachedBody = cache.get(validated.cacheKey)
      response.set(
        'Cache-Control',
        CACHE_CONTROL[validated.cacheProfile],
      )

      if (cachedBody !== undefined) {
        cacheResult = 'HIT'
        response.set('X-CineScope-Cache', cacheResult)
        response.status(200).json(cachedBody)
        logger.info('tmdb_api_request', {
          cache: cacheResult,
          durationMs: now() - startedAt,
          requestId,
          route: routeName,
          status: 200,
        })
        return
      }

      cacheResult = 'MISS'
      response.set('X-CineScope-Cache', cacheResult)

      const secret = getSecret().trim()

      if (!secret) {
        throw new ApiError(
          'upstream_failure',
          'The catalogue service is not configured.',
          503,
        )
      }

      const upstreamUrl = new URL(
        validated.upstreamPath.replace(/^\/+/, ''),
        getUpstreamOrigin(),
      )
      upstreamUrl.search = validated.upstreamQuery.toString()

      const abortController = new AbortController()
      const timeout = setTimeout(
        () => abortController.abort(),
        UPSTREAM_TIMEOUT_MS,
      )
      let upstreamResponse: Response

      try {
        upstreamResponse = await fetchImpl(upstreamUrl, {
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${secret}`,
          },
          method: 'GET',
          signal: abortController.signal,
        })
      } catch (error) {
        if (
          error instanceof DOMException &&
          error.name === 'AbortError'
        ) {
          throw new ApiError(
            'upstream_timeout',
            'The catalogue service took too long to respond.',
            504,
          )
        }

        throw new ApiError(
          'upstream_failure',
          'The catalogue service could not be reached.',
          502,
        )
      } finally {
        clearTimeout(timeout)
      }

      if (!upstreamResponse.ok) {
        throw getNormalizedUpstreamError(upstreamResponse.status)
      }

      const responseBody = await parseUpstreamBody(upstreamResponse)
      cache.set(
        validated.cacheKey,
        responseBody,
        validated.cacheProfile,
      )
      response.status(200).json(responseBody)
      logger.info('tmdb_api_request', {
        cache: cacheResult,
        durationMs: now() - startedAt,
        requestId,
        route: routeName,
        status: 200,
      })
    } catch (error) {
      const apiError =
        error instanceof ApiError
          ? error
          : new ApiError(
              'upstream_failure',
              'The catalogue service could not complete this request.',
              500,
            )

      sendError(response, apiError, requestId)

      const logContext = {
        cache: cacheResult,
        code: apiError.code,
        durationMs: now() - startedAt,
        requestId,
        route: routeName,
        status: apiError.status,
      }

      if (apiError.status >= 500) {
        logger.error('tmdb_api_request_failed', logContext)
      } else {
        logger.warn('tmdb_api_request_rejected', logContext)
      }
    }
  }
}
