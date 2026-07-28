import type { TmdbPaginatedResponse } from './common'
import type { TmdbMovie } from './movie'
import type { TmdbPerson } from './person'
import type { TmdbTvShow } from './tv'

export type TmdbMultiSearchMovie = TmdbMovie & {
  media_type: 'movie'
}

export type TmdbMultiSearchTvShow = TmdbTvShow & {
  media_type: 'tv'
}

export type TmdbMultiSearchPerson = TmdbPerson & {
  media_type: 'person'
}

export type TmdbMultiSearchResult =
  | TmdbMultiSearchMovie
  | TmdbMultiSearchTvShow
  | TmdbMultiSearchPerson

export type TmdbMultiSearchResponse =
  TmdbPaginatedResponse<TmdbMultiSearchResult>
