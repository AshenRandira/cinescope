import {
  parseTvProgress,
  type TvProgress,
} from './tvProgress'

export type LibraryMediaType = 'movie' | 'tv'

export type LibraryCandidate = {
  backdropPath: string | null
  id: number
  mediaType: LibraryMediaType
  overview: string | null
  posterPath: string | null
  releaseYear: string | null
  title: string
}

export type LibraryRecord = LibraryCandidate & {
  isFavorite: boolean
  isWatched: boolean
  savedAt: string
  tvProgress: TvProgress | null
  updatedAt: string
  userRating: number | null
}

export type LibraryRecordPatch = Partial<
  Pick<
    LibraryRecord,
    | 'isFavorite'
    | 'isWatched'
    | 'tvProgress'
    | 'userRating'
  >
>

export type LibrarySyncStatus =
  | 'local'
  | 'connecting'
  | 'syncing'
  | 'synced'
  | 'error'

export type LibrarySyncCopy = {
  detail: string
  label: string
}

export const LIBRARY_STORAGE_KEY =
  'cinescope.library.v1'

const LIBRARY_USER_STORAGE_PREFIX =
  `${LIBRARY_STORAGE_KEY}.user`

export function getLibraryRecordKey(
  mediaType: LibraryMediaType,
  id: number,
): string {
  return `${mediaType}:${id}`
}

export function getLibraryStorageKey(
  userId: string | null,
): string {
  return userId
    ? `${LIBRARY_USER_STORAGE_PREFIX}.${encodeURIComponent(userId)}`
    : LIBRARY_STORAGE_KEY
}

export function getLibraryPendingDeletionStorageKey(
  userId: string,
): string {
  return `${getLibraryStorageKey(userId)}.pending-deletions`
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

function getNullableString(
  value: unknown,
): string | null {
  return typeof value === 'string'
    ? value
    : null
}

export function parseLibraryRecord(
  value: unknown,
): LibraryRecord | null {
  if (!isObject(value)) return null

  if (
    value.mediaType !== 'movie' &&
    value.mediaType !== 'tv'
  ) {
    return null
  }

  if (
    !Number.isInteger(value.id) ||
    Number(value.id) <= 0 ||
    typeof value.title !== 'string' ||
    !value.title.trim() ||
    typeof value.isFavorite !== 'boolean' ||
    typeof value.isWatched !== 'boolean' ||
    typeof value.savedAt !== 'string' ||
    typeof value.updatedAt !== 'string'
  ) {
    return null
  }

  const userRating =
    value.userRating === null
      ? null
      : Number(value.userRating)

  if (
    userRating !== null &&
    (!Number.isInteger(userRating) ||
      userRating < 1 ||
      userRating > 10)
  ) {
    return null
  }

  return {
    backdropPath: getNullableString(
      value.backdropPath,
    ),
    id: Number(value.id),
    isFavorite: value.isFavorite,
    isWatched: value.isWatched,
    mediaType: value.mediaType,
    overview: getNullableString(value.overview),
    posterPath: getNullableString(value.posterPath),
    releaseYear: getNullableString(
      value.releaseYear,
    ),
    savedAt: value.savedAt,
    title: value.title.trim(),
    tvProgress:
      value.mediaType === 'tv'
        ? parseTvProgress(value.tvProgress)
        : null,
    updatedAt: value.updatedAt,
    userRating,
  }
}

export function getContinueWatchingRecords(
  records: LibraryRecord[],
): LibraryRecord[] {
  return records
    .filter(
      (record) =>
        record.mediaType === 'tv' &&
        !record.isWatched &&
        record.tvProgress !== null &&
        record.tvProgress.watchedEpisodeKeys.length > 0,
    )
    .sort((first, second) =>
      second.tvProgress!.updatedAt.localeCompare(
        first.tvProgress!.updatedAt,
      ),
    )
}

export function parseLibraryRecords(
  value: string | null,
): LibraryRecord[] {
  if (!value) return []

  try {
    const parsedValue: unknown = JSON.parse(value)
    if (!Array.isArray(parsedValue)) return []

    const records = parsedValue
      .map(parseLibraryRecord)
      .filter(
        (record): record is LibraryRecord =>
          record !== null,
      )

    const uniqueRecords = new Map<
      string,
      LibraryRecord
    >()

    records.forEach((record) => {
      uniqueRecords.set(
        getLibraryRecordKey(
          record.mediaType,
          record.id,
        ),
        record,
      )
    })

    return [...uniqueRecords.values()]
  } catch {
    return []
  }
}

export function sortLibraryRecords(
  records: LibraryRecord[],
): LibraryRecord[] {
  return [...records].sort((first, second) =>
    second.updatedAt.localeCompare(first.updatedAt),
  )
}

export function mergeLibraryRecords(
  ...recordGroups: LibraryRecord[][]
): LibraryRecord[] {
  const recordsByKey = new Map<
    string,
    LibraryRecord
  >()

  recordGroups.flat().forEach((record) => {
    const recordKey = getLibraryRecordKey(
      record.mediaType,
      record.id,
    )
    const existingRecord = recordsByKey.get(recordKey)

    if (
      !existingRecord ||
      record.updatedAt > existingRecord.updatedAt
    ) {
      recordsByKey.set(recordKey, record)
    }
  })

  return sortLibraryRecords([...recordsByKey.values()])
}

export function getLibrarySyncCopy(
  status: LibrarySyncStatus,
  error: string | null,
): LibrarySyncCopy {
  switch (status) {
    case 'connecting':
      return {
        detail:
          'Your browser archive is ready while CineScope connects to your account.',
        label: 'Connecting archive',
      }
    case 'syncing':
      return {
        detail:
          'Recent library changes are being saved to your account.',
        label: 'Saving changes',
      }
    case 'synced':
      return {
        detail:
          'This collection is saved locally and synced securely to your account.',
        label: 'Account sync active',
      }
    case 'error':
      return {
        detail:
          error ??
          'Cloud sync is paused. Your changes remain saved in this browser.',
        label: 'Cloud sync paused',
      }
    case 'local':
      return {
        detail:
          'Saved on this browser. Sign in to keep the collection with your account.',
        label: 'Browser archive',
      }
  }
}
