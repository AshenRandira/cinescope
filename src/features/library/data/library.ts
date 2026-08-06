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
  updatedAt: string
  userRating: number | null
}

export type LibraryRecordPatch = Partial<
  Pick<
    LibraryRecord,
    'isFavorite' | 'isWatched' | 'userRating'
  >
>

export const LIBRARY_STORAGE_KEY =
  'cinescope.library.v1'

export function getLibraryRecordKey(
  mediaType: LibraryMediaType,
  id: number,
): string {
  return `${mediaType}:${id}`
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

function parseLibraryRecord(
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
    updatedAt: value.updatedAt,
    userRating,
  }
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
