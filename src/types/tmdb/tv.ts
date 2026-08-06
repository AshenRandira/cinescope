import type { TmdbPaginatedResponse } from './common'
import type { TmdbGenre } from './genre'
import type {
  TmdbProductionCompany,
  TmdbProductionCountry,
  TmdbSpokenLanguage,
} from './movie'
import type { TmdbVideoListResponse } from './video'

export interface TmdbTvShow {
  adult: boolean
  backdrop_path: string | null
  first_air_date: string
  genre_ids: number[]
  id: number
  name: string
  origin_country: string[]
  original_language: string
  original_name: string
  overview: string
  popularity: number
  poster_path: string | null
  vote_average: number
  vote_count: number
}

export interface TmdbTvCreator {
  credit_id: string
  gender: number
  id: number
  name: string
  profile_path: string | null
}

export interface TmdbTvNetwork {
  id: number
  logo_path: string | null
  name: string
  origin_country: string
}

export interface TmdbTvSeason {
  air_date: string | null
  episode_count: number
  id: number
  name: string
  overview: string
  poster_path: string | null
  season_number: number
  vote_average: number
}

export interface TmdbTvEpisodeSummary {
  air_date: string | null
  episode_number: number
  episode_type: string
  id: number
  name: string
  overview: string
  production_code: string
  runtime: number | null
  season_number: number
  show_id: number
  still_path: string | null
  vote_average: number
  vote_count: number
}

export interface TmdbTvCastMember {
  adult: boolean
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

export interface TmdbTvCrewMember {
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

export interface TmdbTvCredits {
  cast: TmdbTvCastMember[]
  crew: TmdbTvCrewMember[]
  id: number
}

export interface TmdbTvDetails {
  adult: boolean
  backdrop_path: string | null
  created_by: TmdbTvCreator[]
  credits: TmdbTvCredits
  episode_run_time: number[]
  first_air_date: string
  genres: TmdbGenre[]
  homepage: string
  id: number
  in_production: boolean
  languages: string[]
  last_air_date: string
  last_episode_to_air: TmdbTvEpisodeSummary | null
  name: string
  networks: TmdbTvNetwork[]
  next_episode_to_air: TmdbTvEpisodeSummary | null
  number_of_episodes: number
  number_of_seasons: number
  origin_country: string[]
  original_language: string
  original_name: string
  overview: string
  popularity: number
  poster_path: string | null
  production_companies: TmdbProductionCompany[]
  production_countries: TmdbProductionCountry[]
  recommendations: TmdbPaginatedResponse<TmdbTvShow>
  seasons: TmdbTvSeason[]
  spoken_languages: TmdbSpokenLanguage[]
  status: string
  tagline: string
  type: string
  videos: TmdbVideoListResponse
  vote_average: number
  vote_count: number
}
