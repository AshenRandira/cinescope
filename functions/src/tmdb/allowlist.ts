import { ApiError } from './errors.js'
import type { CacheProfile } from './cache.js'

type Validator = (value: string) => boolean

type RouteRule = {
  appendToResponse?: string
  cacheProfile: CacheProfile
  name: string
  path: RegExp
  query: Readonly<Record<string, Validator>>
}

export type ValidatedTmdbRequest = {
  cacheKey: string
  cacheProfile: CacheProfile
  routeName: string
  upstreamPath: string
  upstreamQuery: URLSearchParams
}

const isBooleanFalse: Validator = (value) => value === 'false'
const isDate: Validator = (value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false

  const date = new Date(`${value}T00:00:00.000Z`)
  return !Number.isNaN(date.valueOf()) &&
    date.toISOString().startsWith(value)
}
const isGenreList: Validator = (value) =>
  /^\d{1,6}(?:[|,]\d{1,6})*$/.test(value)
const isLanguage: Validator = (value) =>
  /^[a-z]{2}(?:-[A-Z]{2})?$/.test(value)
const isPage: Validator = (value) => {
  const page = Number(value)
  return Number.isInteger(page) && page >= 1 && page <= 500
}
const isRating: Validator = (value) => {
  const rating = Number(value)
  return Number.isFinite(rating) && rating >= 0 && rating <= 10
}
const isRuntime: Validator = (value) => {
  const runtime = Number(value)
  return Number.isInteger(runtime) && runtime >= 0 && runtime <= 1_000
}
const isSearchQuery: Validator = (value) => {
  const normalized = value.trim().replace(/\s+/g, ' ')
  const hasControlCharacter = [...value].some((character) => {
    const codePoint = character.codePointAt(0) ?? 0
    return codePoint <= 31 || codePoint === 127
  })

  return normalized.length >= 2 && normalized.length <= 100 &&
    !hasControlCharacter
}
const isSort: Validator = (value) =>
  new Set([
    'popularity.desc',
    'primary_release_date.desc',
    'vote_average.desc',
    'vote_count.desc',
  ]).has(value)
const isTimezone: Validator = (value) =>
  value.length >= 1 && value.length <= 64 &&
    /^[A-Za-z0-9_+\-/]+$/.test(value)
const isVoteCount: Validator = (value) => {
  const count = Number(value)
  return Number.isInteger(count) && count >= 0 && count <= 10_000_000
}

const languageQuery = Object.freeze({ language: isLanguage })
const paginatedQuery = Object.freeze({
  language: isLanguage,
  page: isPage,
})
const recommendationsQuery = paginatedQuery
const movieDiscoveryQuery = Object.freeze({
  include_adult: isBooleanFalse,
  include_video: isBooleanFalse,
  language: isLanguage,
  page: isPage,
  'primary_release_date.gte': isDate,
  'primary_release_date.lte': isDate,
  sort_by: isSort,
  'vote_average.gte': isRating,
  'vote_count.gte': isVoteCount,
  with_genres: isGenreList,
  without_genres: isGenreList,
  'with_runtime.gte': isRuntime,
  'with_runtime.lte': isRuntime,
})
const tvDiscoveryQuery = Object.freeze({
  include_adult: isBooleanFalse,
  language: isLanguage,
  page: isPage,
  sort_by: isSort,
  'vote_count.gte': isVoteCount,
})
const searchQuery = Object.freeze({
  include_adult: isBooleanFalse,
  language: isLanguage,
  page: isPage,
  query: isSearchQuery,
})
const onAirQuery = Object.freeze({
  language: isLanguage,
  page: isPage,
  timezone: isTimezone,
})

const routeRules: readonly RouteRule[] = [
  {
    cacheProfile: 'genres',
    name: 'movie-genres',
    path: /^\/genre\/movie\/list$/,
    query: languageQuery,
  },
  {
    cacheProfile: 'genres',
    name: 'tv-genres',
    path: /^\/genre\/tv\/list$/,
    query: languageQuery,
  },
  {
    cacheProfile: 'private',
    name: 'multi-search',
    path: /^\/search\/multi$/,
    query: searchQuery,
  },
  {
    cacheProfile: 'catalogue',
    name: 'movie-discovery',
    path: /^\/discover\/movie$/,
    query: movieDiscoveryQuery,
  },
  {
    cacheProfile: 'catalogue',
    name: 'tv-discovery',
    path: /^\/discover\/tv$/,
    query: tvDiscoveryQuery,
  },
  {
    cacheProfile: 'catalogue',
    name: 'trending',
    path: /^\/trending\/(?:all|movie|tv)\/week$/,
    query: paginatedQuery,
  },
  {
    cacheProfile: 'catalogue',
    name: 'movie-register',
    path: /^\/movie\/(?:popular|now_playing|upcoming)$/,
    query: paginatedQuery,
  },
  {
    cacheProfile: 'catalogue',
    name: 'tv-register',
    path: /^\/tv\/(?:popular|top_rated|on_the_air|airing_today)$/,
    query: onAirQuery,
  },
  {
    cacheProfile: 'details',
    name: 'movie-providers',
    path: /^\/movie\/[1-9]\d*\/watch\/providers$/,
    query: {},
  },
  {
    cacheProfile: 'details',
    name: 'tv-providers',
    path: /^\/tv\/[1-9]\d*\/watch\/providers$/,
    query: {},
  },
  {
    cacheProfile: 'catalogue',
    name: 'movie-recommendations',
    path: /^\/movie\/[1-9]\d*\/recommendations$/,
    query: recommendationsQuery,
  },
  {
    cacheProfile: 'catalogue',
    name: 'tv-recommendations',
    path: /^\/tv\/[1-9]\d*\/recommendations$/,
    query: recommendationsQuery,
  },
  {
    appendToResponse: 'credits,videos,recommendations',
    cacheProfile: 'details',
    name: 'movie-details',
    path: /^\/movie\/[1-9]\d*$/,
    query: languageQuery,
  },
  {
    appendToResponse: 'credits,videos,recommendations',
    cacheProfile: 'details',
    name: 'tv-details',
    path: /^\/tv\/[1-9]\d*$/,
    query: languageQuery,
  },
  {
    appendToResponse: 'credits',
    cacheProfile: 'details',
    name: 'tv-season',
    path: /^\/tv\/[1-9]\d*\/season\/(?:0|[1-9]\d*)$/,
    query: languageQuery,
  },
  {
    appendToResponse: 'credits,images,videos',
    cacheProfile: 'details',
    name: 'tv-episode',
    path:
      /^\/tv\/[1-9]\d*\/season\/(?:0|[1-9]\d*)\/episode\/[1-9]\d*$/,
    query: languageQuery,
  },
  {
    appendToResponse: 'combined_credits,images,external_ids',
    cacheProfile: 'details',
    name: 'person-details',
    path: /^\/person\/[1-9]\d*$/,
    query: languageQuery,
  },
]

function getRule(path: string): RouteRule {
  if (!/^\/[A-Za-z0-9_/-]+$/.test(path)) {
    throw new ApiError(
      'invalid_request',
      'The catalogue path contains unsupported characters.',
      400,
    )
  }

  const rule = routeRules.find((candidate) => candidate.path.test(path))

  if (!rule) {
    throw new ApiError(
      'not_found',
      'This catalogue route is not available.',
      404,
    )
  }

  return rule
}

export function validateTmdbRequest(
  path: string,
  searchParams: URLSearchParams,
): ValidatedTmdbRequest {
  const rule = getRule(path)
  const upstreamQuery = new URLSearchParams()
  const seenKeys = new Set<string>()

  for (const [key, value] of searchParams) {
    if (seenKeys.has(key)) {
      throw new ApiError(
        'invalid_request',
        `The catalogue parameter ${key} cannot be repeated.`,
        400,
      )
    }

    seenKeys.add(key)

    if (key === 'append_to_response') {
      if (!rule.appendToResponse || value !== rule.appendToResponse) {
        throw new ApiError(
          'invalid_request',
          'The requested catalogue expansion is not permitted.',
          400,
        )
      }

      upstreamQuery.set(key, value)
      continue
    }

    const validator = rule.query[key]

    if (!validator || !validator(value)) {
      throw new ApiError(
        'invalid_request',
        `The catalogue parameter ${key} is not valid for this route.`,
        400,
      )
    }

    upstreamQuery.set(key, value)
  }

  const canonicalQuery = new URLSearchParams(
    [...upstreamQuery.entries()].sort(([first], [second]) =>
      first.localeCompare(second),
    ),
  )
  const queryString = canonicalQuery.toString()

  return {
    cacheKey: queryString ? `${path}?${queryString}` : path,
    cacheProfile: rule.cacheProfile,
    routeName: rule.name,
    upstreamPath: path,
    upstreamQuery: canonicalQuery,
  }
}
