import { getTmdbReadAccessToken } from '../../config/env'
import type { TmdbApiErrorResponse } from '../../types/tmdb'

const TMDB_API_BASE_URL = 'https://api.themoviedb.org/3/'

type TmdbQueryValue = string | number | boolean | null | undefined

interface TmdbRequestOptions extends Omit<RequestInit, 'headers'> {
  headers?: HeadersInit
  query?: Record<string, TmdbQueryValue>
}

interface TmdbApiErrorOptions {
  endpoint: string
  status: number
  tmdbCode?: number
}

export class TmdbApiError extends Error {
  readonly endpoint: string
  readonly status: number
  readonly tmdbCode?: number

  constructor(message: string, options: TmdbApiErrorOptions) {
    super(message)

    this.name = 'TmdbApiError'
    this.endpoint = options.endpoint
    this.status = options.status
    this.tmdbCode = options.tmdbCode
  }
}

function buildTmdbUrl(
  path: string,
  query?: Record<string, TmdbQueryValue>,
): URL {
  const normalizedPath = path.replace(/^\/+/, '')
  const url = new URL(normalizedPath, TMDB_API_BASE_URL)

  if (!query) {
    return url
  }

  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, String(value))
    }
  })

  return url
}

async function readJsonResponse(response: Response): Promise<unknown> {
  const responseText = await response.text()

  if (!responseText) {
    return null
  }

  try {
    return JSON.parse(responseText) as unknown
  } catch {
    throw new TmdbApiError('TMDB returned an invalid JSON response.', {
      endpoint: response.url,
      status: response.status,
    })
  }
}

function isTmdbApiErrorResponse(
  value: unknown,
): value is TmdbApiErrorResponse {
  return (
    typeof value === 'object' &&
    value !== null &&
    ('status_message' in value ||
      'status_code' in value ||
      'success' in value)
  )
}

export async function tmdbFetch<T>(
  path: string,
  options: TmdbRequestOptions = {},
): Promise<T> {
  const { headers: customHeaders, query, ...requestOptions } = options
  const url = buildTmdbUrl(path, query)

  const headers = new Headers(customHeaders)

  headers.set('Accept', 'application/json')
  headers.set(
    'Authorization',
    `Bearer ${getTmdbReadAccessToken()}`,
  )

  let response: Response

  try {
    response = await fetch(url, {
      ...requestOptions,
      headers,
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw error
    }

    throw new TmdbApiError(
      'Unable to connect to TMDB. Check your internet connection and try again.',
      {
        endpoint: url.toString(),
        status: 0,
      },
    )
  }

  const responseBody = await readJsonResponse(response)

  if (!response.ok) {
    const tmdbError = isTmdbApiErrorResponse(responseBody)
      ? responseBody
      : undefined

    throw new TmdbApiError(
      tmdbError?.status_message ??
      `TMDB request failed with status ${response.status}.`,
      {
        endpoint: url.toString(),
        status: response.status,
        tmdbCode: tmdbError?.status_code,
      },
    )
  }

  return responseBody as T
}

export function getTmdbErrorMessage(error: unknown): string {
  if (error instanceof TmdbApiError) {
    return error.message
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'An unexpected error occurred while loading TMDB data.'
}
