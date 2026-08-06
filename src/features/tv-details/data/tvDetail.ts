export const TV_DETAIL_APPEND_TO_RESPONSE =
  'credits,videos,recommendations'

export function parseTvId(
  routeTvId: string | undefined,
): number | null {
  if (!routeTvId || !/^\d+$/.test(routeTvId)) {
    return null
  }

  const tvId = Number(routeTvId)

  if (!Number.isSafeInteger(tvId) || tvId <= 0) {
    return null
  }

  return tvId
}

export function getTvDetailQueryKey(
  tvId: number | null,
) {
  return [
    'tmdb',
    'tv',
    tvId,
    'details',
    'en-US',
  ] as const
}

export function getTvWatchProvidersQueryKey(
  tvId: number | null,
) {
  return [
    'tmdb',
    'tv',
    tvId,
    'watch-providers',
  ] as const
}
