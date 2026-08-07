export const TV_SEASON_APPEND_TO_RESPONSE =
  'credits'

export function parseSeasonNumber(
  routeSeasonNumber: string | undefined,
): number | null {
  if (
    !routeSeasonNumber ||
    !/^\d+$/.test(routeSeasonNumber)
  ) {
    return null
  }

  const seasonNumber = Number(routeSeasonNumber)

  if (
    !Number.isSafeInteger(seasonNumber) ||
    seasonNumber < 0
  ) {
    return null
  }

  return seasonNumber
}

export function getTvSeasonQueryKey(
  tvId: number | null,
  seasonNumber: number | null,
) {
  return [
    'tmdb',
    'tv',
    tvId,
    'season',
    seasonNumber,
    'en-US',
  ] as const
}
