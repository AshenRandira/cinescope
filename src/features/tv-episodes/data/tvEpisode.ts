export const TV_EPISODE_APPEND_TO_RESPONSE =
  'credits,images,videos'

export function parseEpisodeNumber(
  routeEpisodeNumber: string | undefined,
): number | null {
  if (
    !routeEpisodeNumber ||
    !/^\d+$/.test(routeEpisodeNumber)
  ) {
    return null
  }

  const episodeNumber = Number(routeEpisodeNumber)

  if (
    !Number.isSafeInteger(episodeNumber) ||
    episodeNumber <= 0
  ) {
    return null
  }

  return episodeNumber
}

export function getTvEpisodeQueryKey(
  tvId: number | null,
  seasonNumber: number | null,
  episodeNumber: number | null,
) {
  return [
    'tmdb',
    'tv',
    tvId,
    'season',
    seasonNumber,
    'episode',
    episodeNumber,
    'en-US',
  ] as const
}
