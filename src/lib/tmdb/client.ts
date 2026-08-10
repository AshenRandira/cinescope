import { getFirebaseAppCheckToken } from '../../config/firebase'

const TMDB_API_BASE_PATH = '/api/tmdb/'

type TmdbQueryValue = string | number | boolean | null | undefined

interface TmdbRequestOptions extends Omit<RequestInit, 'headers'> {
  headers?: HeadersInit
  query?: Record<string, TmdbQueryValue>
}

interface TmdbApiErrorOptions {
  endpoint: string
  requestId?: string
  status: number
}

export class TmdbApiError extends Error {
  readonly endpoint: string
  readonly requestId?: string
  readonly status: number

  constructor(message: string, options: TmdbApiErrorOptions) {
    super(message)

    this.name = 'TmdbApiError'
    this.endpoint = options.endpoint
    this.requestId = options.requestId
    this.status = options.status
  }
}

export function buildTmdbApiUrl(
  path: string,
  query?: Record<string, TmdbQueryValue>,
): string {
  const normalizedPath = path.replace(/^\/+/, '')
  const url = new URL(
    `${TMDB_API_BASE_PATH}${normalizedPath}`,
    'https://cinescope.invalid',
  )

  if (
    !normalizedPath ||
    normalizedPath.includes('..') ||
    /[?#]/.test(normalizedPath)
  ) {
    throw new TmdbApiError(
      'The catalogue request path is not valid.',
      { endpoint: path, status: 0 },
    )
  }

  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value))
      }
    })
  }

  return `${url.pathname}${url.search}`
}

async function readJsonResponse(response: Response): Promise<unknown> {
  const responseText = await response.text()

  if (!responseText) {
    return null
  }

  try {
    return JSON.parse(responseText) as unknown
  } catch {
    throw new TmdbApiError(
      'The catalogue service returned an invalid response.',
      {
        endpoint: response.url,
        status: response.status,
      },
    )
  }
}

type CineScopeApiErrorResponse = {
  error: {
    code: string
    message: string
    requestId?: string
  }
}

function isCineScopeApiErrorResponse(
  value: unknown,
): value is CineScopeApiErrorResponse {
  return (
    typeof value === 'object' &&
    value !== null &&
    'error' in value &&
    typeof value.error === 'object' &&
    value.error !== null &&
    'message' in value.error &&
    typeof value.error.message === 'string'
  )
}

export async function tmdbFetch<T>(
  path: string,
  options: TmdbRequestOptions = {},
): Promise<T> {
  const { headers: customHeaders, query, ...requestOptions } = options
  const url = buildTmdbApiUrl(path, query)

  const headers = new Headers(customHeaders)

  headers.set('Accept', 'application/json')

  const appCheckToken = await getFirebaseAppCheckToken()

  if (appCheckToken) {
    headers.set('X-Firebase-AppCheck', appCheckToken)
  }

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
      'Unable to reach the catalogue service. Check your internet connection and try again.',
      {
        endpoint: url.toString(),
        status: 0,
      },
    )
  }

  const responseBody = await readJsonResponse(response)

  if (!response.ok) {
    const apiError = isCineScopeApiErrorResponse(responseBody)
      ? responseBody
      : undefined

    throw new TmdbApiError(
      apiError?.error.message ??
      `The catalogue request failed with status ${response.status}.`,
      {
        endpoint: url.toString(),
        requestId: apiError?.error.requestId,
        status: response.status,
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

  return 'An unexpected error occurred while loading catalogue data.'
}
