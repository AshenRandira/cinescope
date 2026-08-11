export const TV_PROGRESS_MAX_EPISODES = 2_000

export type TvEpisodePointer = {
  episodeNumber: number
  name: string
  seasonNumber: number
  stillPath: string | null
}

export type TvProgress = {
  resumeEpisode: TvEpisodePointer | null
  updatedAt: string
  watchedEpisodeKeys: string[]
}

export type TvSeasonProgress = {
  isComplete: boolean
  percentage: number
  total: number
  watched: number
}

function isObject(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value)
  )
}

function isValidEpisodeNumber(value: unknown): value is number {
  return (
    Number.isSafeInteger(value) &&
    Number(value) > 0
  )
}

function isValidSeasonNumber(value: unknown): value is number {
  return (
    Number.isSafeInteger(value) &&
    Number(value) >= 0
  )
}

export function getTvEpisodeProgressKey(
  seasonNumber: number,
  episodeNumber: number,
): string {
  return `${seasonNumber}:${episodeNumber}`
}

function parseTvEpisodeProgressKey(
  value: unknown,
): { episodeNumber: number; seasonNumber: number } | null {
  if (typeof value !== 'string') return null

  const match = /^(0|[1-9]\d*):([1-9]\d*)$/.exec(value)

  if (!match) return null

  const seasonNumber = Number(match[1])
  const episodeNumber = Number(match[2])

  if (
    !isValidSeasonNumber(seasonNumber) ||
    !isValidEpisodeNumber(episodeNumber)
  ) {
    return null
  }

  return { episodeNumber, seasonNumber }
}

function compareEpisodeKeys(
  first: string,
  second: string,
): number {
  const firstIdentity = parseTvEpisodeProgressKey(first)
  const secondIdentity = parseTvEpisodeProgressKey(second)

  if (!firstIdentity || !secondIdentity) {
    return first.localeCompare(second)
  }

  return (
    firstIdentity.seasonNumber -
      secondIdentity.seasonNumber ||
    firstIdentity.episodeNumber -
      secondIdentity.episodeNumber
  )
}

function normalizeEpisodeKeys(values: string[]): string[] {
  return [...new Set(values)]
    .sort(compareEpisodeKeys)
    .slice(0, TV_PROGRESS_MAX_EPISODES)
}

export function parseTvEpisodePointer(
  value: unknown,
): TvEpisodePointer | null {
  if (!isObject(value)) return null

  if (
    !isValidEpisodeNumber(value.episodeNumber) ||
    !isValidSeasonNumber(value.seasonNumber) ||
    typeof value.name !== 'string' ||
    !value.name.trim() ||
    value.name.length > 300 ||
    (value.stillPath !== null &&
      typeof value.stillPath !== 'string')
  ) {
    return null
  }

  return {
    episodeNumber: value.episodeNumber,
    name: value.name.trim(),
    seasonNumber: value.seasonNumber,
    stillPath: value.stillPath,
  }
}

export function parseTvProgress(
  value: unknown,
): TvProgress | null {
  if (!isObject(value)) return null

  if (
    typeof value.updatedAt !== 'string' ||
    !value.updatedAt ||
    !Array.isArray(value.watchedEpisodeKeys) ||
    value.watchedEpisodeKeys.length === 0 ||
    value.watchedEpisodeKeys.length >
      TV_PROGRESS_MAX_EPISODES
  ) {
    return null
  }

  const watchedEpisodeKeys = value.watchedEpisodeKeys
    .map((episodeKey) =>
      parseTvEpisodeProgressKey(episodeKey),
    )

  if (watchedEpisodeKeys.some((identity) => !identity)) {
    return null
  }

  const normalizedKeys = normalizeEpisodeKeys(
    watchedEpisodeKeys.map((identity) =>
      getTvEpisodeProgressKey(
        identity!.seasonNumber,
        identity!.episodeNumber,
      ),
    ),
  )
  const resumeEpisode =
    value.resumeEpisode === null
      ? null
      : parseTvEpisodePointer(value.resumeEpisode)

  if (
    value.resumeEpisode !== null &&
    resumeEpisode === null
  ) {
    return null
  }

  return {
    resumeEpisode,
    updatedAt: value.updatedAt,
    watchedEpisodeKeys: normalizedKeys,
  }
}

export function isTvEpisodeWatched(
  progress: TvProgress | null | undefined,
  seasonNumber: number,
  episodeNumber: number,
): boolean {
  return Boolean(
    progress?.watchedEpisodeKeys.includes(
      getTvEpisodeProgressKey(
        seasonNumber,
        episodeNumber,
      ),
    ),
  )
}

export function setTvEpisodeWatched(
  progress: TvProgress | null | undefined,
  episode: TvEpisodePointer,
  nextEpisode: TvEpisodePointer | null,
  watched: boolean,
  updatedAt = new Date().toISOString(),
): TvProgress | null {
  const episodeKey = getTvEpisodeProgressKey(
    episode.seasonNumber,
    episode.episodeNumber,
  )
  const currentKeys =
    progress?.watchedEpisodeKeys ?? []
  const watchedEpisodeKeys = watched
    ? normalizeEpisodeKeys([
        ...currentKeys,
        episodeKey,
      ])
    : currentKeys.filter(
        (currentKey) => currentKey !== episodeKey,
      )

  if (watchedEpisodeKeys.length === 0) return null

  return {
    resumeEpisode: watched ? nextEpisode : episode,
    updatedAt,
    watchedEpisodeKeys,
  }
}

export function getTvSeasonProgress(
  progress: TvProgress | null | undefined,
  seasonNumber: number,
  episodeNumbers: number[],
): TvSeasonProgress {
  const uniqueEpisodeNumbers = [
    ...new Set(
      episodeNumbers.filter(isValidEpisodeNumber),
    ),
  ]
  const watched = uniqueEpisodeNumbers.filter(
    (episodeNumber) =>
      isTvEpisodeWatched(
        progress,
        seasonNumber,
        episodeNumber,
      ),
  ).length
  const total = uniqueEpisodeNumbers.length

  return {
    isComplete: total > 0 && watched === total,
    percentage:
      total > 0 ? Math.round((watched / total) * 100) : 0,
    total,
    watched,
  }
}

export function areTvProgressEqual(
  first: TvProgress | null,
  second: TvProgress | null,
): boolean {
  if (first === second) return true
  if (!first || !second) return false

  return (
    first.updatedAt === second.updatedAt &&
    first.watchedEpisodeKeys.length ===
      second.watchedEpisodeKeys.length &&
    first.watchedEpisodeKeys.every(
      (episodeKey, index) =>
        episodeKey ===
        second.watchedEpisodeKeys[index],
    ) &&
    first.resumeEpisode?.episodeNumber ===
      second.resumeEpisode?.episodeNumber &&
    first.resumeEpisode?.name ===
      second.resumeEpisode?.name &&
    first.resumeEpisode?.seasonNumber ===
      second.resumeEpisode?.seasonNumber &&
    first.resumeEpisode?.stillPath ===
      second.resumeEpisode?.stillPath
  )
}
