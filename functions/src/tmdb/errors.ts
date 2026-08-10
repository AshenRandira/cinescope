export type ApiErrorCode =
  | 'app_check_required'
  | 'invalid_request'
  | 'method_not_allowed'
  | 'not_found'
  | 'rate_limited'
  | 'upstream_failure'
  | 'upstream_timeout'

export class ApiError extends Error {
  readonly code: ApiErrorCode
  readonly status: number

  constructor(
    code: ApiErrorCode,
    message: string,
    status: number,
  ) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.status = status
  }
}

export function getNormalizedUpstreamError(
  status: number,
): ApiError {
  if (status === 404) {
    return new ApiError(
      'not_found',
      'The requested catalogue record was not found.',
      404,
    )
  }

  if (status === 429) {
    return new ApiError(
      'upstream_failure',
      'The catalogue service is temporarily busy. Try again shortly.',
      503,
    )
  }

  return new ApiError(
    'upstream_failure',
    'The catalogue service could not complete this request.',
    502,
  )
}
