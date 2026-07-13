import type { TmdbPaginatedResponse } from './common'
import type { TmdbGenre } from './genre'
import type { TmdbVideoListResponse } from './video'

export interface TmdbMovie {
  adult: boolean
  backdrop_path: string | null
  genre_ids: number[]
  id: number
  original_language: string
  original_title: string
  overview: string
  popularity: number
  poster_path: string | null
  release_date: string
  title: string
  video: boolean
  vote_average: number
  vote_count: number
}

export interface TmdbMovieCollection {
  backdrop_path: string | null
  id: number
  name: string
  poster_path: string | null
}

export interface TmdbProductionCompany {
  id: number
  logo_path: string | null
  name: string
  origin_country: string
}

export interface TmdbProductionCountry {
  iso_3166_1: string
  name: string
}

export interface TmdbSpokenLanguage {
  english_name: string
  iso_639_1: string
  name: string
}

export interface TmdbMovieCastMember {
  adult: boolean
  cast_id: number
  character: string
  credit_id: string
  gender: number
  id: number
  known_for_department: string
  name: string
  order: number
  original_name: string
  popularity: number
  profile_path: string | null
}

export interface TmdbMovieCrewMember {
  adult: boolean
  credit_id: string
  department: string
  gender: number
  id: number
  job: string
  known_for_department: string
  name: string
  original_name: string
  popularity: number
  profile_path: string | null
}

export interface TmdbMovieCredits {
  cast: TmdbMovieCastMember[]
  crew: TmdbMovieCrewMember[]
  id: number
}

export interface TmdbMovieDetails {
  adult: boolean
  backdrop_path: string | null
  belongs_to_collection: TmdbMovieCollection | null
  budget: number
  credits: TmdbMovieCredits
  genres: TmdbGenre[]
  homepage: string
  id: number
  imdb_id: string | null
  origin_country: string[]
  original_language: string
  original_title: string
  overview: string
  popularity: number
  poster_path: string | null
  production_companies: TmdbProductionCompany[]
  production_countries: TmdbProductionCountry[]
  recommendations: TmdbPaginatedResponse<TmdbMovie>
  release_date: string
  revenue: number
  runtime: number | null
  spoken_languages: TmdbSpokenLanguage[]
  status: string
  tagline: string
  title: string
  video: boolean
  videos: TmdbVideoListResponse
  vote_average: number
  vote_count: number
}