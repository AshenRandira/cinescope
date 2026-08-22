import type {
  TmdbMultiSearchResponse,
  TmdbMultiSearchResult,
} from '../../../types/tmdb'

export type SearchMediaType =
  | 'movie'
  | 'tv'
  | 'person'

export type SearchScope =
  | 'all'
  | SearchMediaType

export type SearchRecord = {
  dateYear: string | null
  genreIds: number[]
  id: number
  imagePath: string | null
  imageType: 'poster' | 'profile'
  knownForDepartment: string | null
  matchReasons: string[]
  mediaType: SearchMediaType
  originalLanguage: string | null
  overview: string | null
  score: number | null
  title: string
  voteCount: number
}

type SearchQuery = Record<
  string,
  string | number | boolean
>

const TMDB_PAGE_LIMIT = 500

export const SEARCH_MINIMUM_LENGTH = 2
export const SEARCH_MAXIMUM_LENGTH = 100

export const searchScopeOptions: ReadonlyArray<{
  label: string
  value: SearchScope
}> = [
  {
    label: 'All records',
    value: 'all',
  },
  {
    label: 'Movies',
    value: 'movie',
  },
  {
    label: 'TV series',
    value: 'tv',
  },
  {
    label: 'People',
    value: 'person',
  },
]

export function normalizeSearchQuery(
  value: string,
): string {
  return value
    .trim()
    .replace(/\s+/g, ' ')
    .slice(0, SEARCH_MAXIMUM_LENGTH)
}

export function parseSearchScope(
  value: string | null,
): SearchScope {
  const option = searchScopeOptions.find(
    (candidate) => candidate.value === value,
  )

  return option?.value ?? 'all'
}

export function getSearchQueryKey(
  query: string,
) {
  return [
    'tmdb',
    'multi-search',
    query,
    'en-US',
  ] as const
}

export function buildSearchQuery(
  query: string,
  page: number,
): SearchQuery {
  return {
    include_adult: false,
    language: 'en-US',
    page,
    query,
  }
}

export function getNextSearchPage(
  lastPage: TmdbMultiSearchResponse,
): number | undefined {
  const availablePages = Math.min(
    lastPage.total_pages,
    TMDB_PAGE_LIMIT,
  )

  if (lastPage.page >= availablePages) {
    return undefined
  }

  return lastPage.page + 1
}

function getYear(
  dateValue: string,
): string | null {
  const match = /^(\d{4})-\d{2}-\d{2}$/.exec(
    dateValue,
  )

  return match?.[1] ?? null
}

function getTitle(
  primaryTitle: string,
  originalTitle: string,
  fallback: string,
): string {
  return (
    primaryTitle.trim() ||
    originalTitle.trim() ||
    fallback
  )
}

function getOverview(
  overview: string,
): string | null {
  const normalizedOverview = overview.trim()

  return normalizedOverview || null
}

function getScore(
  voteAverage: number,
  voteCount: number,
): number | null {
  return voteCount > 0
    ? voteAverage
    : null
}

export function adaptSearchRecord(
  result: TmdbMultiSearchResult,
): SearchRecord {
  switch (result.media_type) {
    case 'movie':
      return {
        dateYear: getYear(result.release_date),
        genreIds: result.genre_ids,
        id: result.id,
        imagePath: result.poster_path,
        imageType: 'poster',
        knownForDepartment: null,
        matchReasons: [],
        mediaType: 'movie',
        originalLanguage:
          result.original_language.trim() || null,
        overview: getOverview(result.overview),
        score: getScore(
          result.vote_average,
          result.vote_count,
        ),
        title: getTitle(
          result.title,
          result.original_title,
          'Untitled film record',
        ),
        voteCount: result.vote_count,
      }

    case 'tv':
      return {
        dateYear: getYear(result.first_air_date),
        genreIds: result.genre_ids,
        id: result.id,
        imagePath: result.poster_path,
        imageType: 'poster',
        knownForDepartment: null,
        matchReasons: [],
        mediaType: 'tv',
        originalLanguage:
          result.original_language.trim() || null,
        overview: getOverview(result.overview),
        score: getScore(
          result.vote_average,
          result.vote_count,
        ),
        title: getTitle(
          result.name,
          result.original_name,
          'Untitled television record',
        ),
        voteCount: result.vote_count,
      }

    case 'person':
      return {
        dateYear: null,
        genreIds: [],
        id: result.id,
        imagePath: result.profile_path,
        imageType: 'profile',
        knownForDepartment:
          result.known_for_department.trim() ||
          'Department unavailable',
        matchReasons: [],
        mediaType: 'person',
        originalLanguage: null,
        overview: null,
        score: null,
        title: getTitle(
          result.name,
          result.original_name,
          'Unnamed person record',
        ),
        voteCount: 0,
      }
  }
}

export function flattenSearchPages(
  pages:
    | ReadonlyArray<TmdbMultiSearchResponse>
    | undefined,
): SearchRecord[] {
  if (!pages) {
    return []
  }

  const seenRecords = new Set<string>()
  const records: SearchRecord[] = []

  pages.forEach((page) => {
    page.results.forEach((result) => {
      const recordKey =
        `${result.media_type}:${result.id}`

      if (seenRecords.has(recordKey)) {
        return
      }

      seenRecords.add(recordKey)
      records.push(adaptSearchRecord(result))
    })
  })

  return records
}

export function filterSearchRecords(
  records: SearchRecord[],
  scope: SearchScope,
): SearchRecord[] {
  if (scope === 'all') {
    return records
  }

  return records.filter(
    (record) => record.mediaType === scope,
  )
}

export function countSearchRecords(
  records: SearchRecord[],
): Record<SearchScope, number> {
  const counts: Record<SearchScope, number> = {
    all: records.length,
    movie: 0,
    person: 0,
    tv: 0,
  }

  records.forEach((record) => {
    counts[record.mediaType] += 1
  })

  return counts
}
