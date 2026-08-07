export interface TmdbPerson {
  adult: boolean
  gender: number
  id: number
  known_for_department: string
  name: string
  original_name: string
  popularity: number
  profile_path: string | null
}

export type TmdbPersonCreditMediaType =
  | 'movie'
  | 'tv'

export interface TmdbPersonCombinedCredit {
  adult: boolean
  backdrop_path: string | null
  character?: string
  credit_id: string
  department?: string
  episode_count?: number
  first_air_date?: string
  genre_ids: number[]
  id: number
  job?: string
  media_type: TmdbPersonCreditMediaType
  name?: string
  order?: number
  original_language: string
  original_name?: string
  original_title?: string
  overview: string
  popularity: number
  poster_path: string | null
  release_date?: string
  title?: string
  video?: boolean
  vote_average: number
  vote_count: number
}

export interface TmdbPersonCombinedCredits {
  cast: TmdbPersonCombinedCredit[]
  crew: TmdbPersonCombinedCredit[]
  id: number
}

export interface TmdbPersonImage {
  aspect_ratio: number
  file_path: string
  height: number
  iso_639_1: string | null
  vote_average: number
  vote_count: number
  width: number
}

export interface TmdbPersonImages {
  id: number
  profiles: TmdbPersonImage[]
}

export interface TmdbPersonExternalIds {
  facebook_id: string | null
  freebase_id: string | null
  freebase_mid: string | null
  id: number
  imdb_id: string | null
  instagram_id: string | null
  tiktok_id: string | null
  tvrage_id: number | null
  twitter_id: string | null
  wikidata_id: string | null
  youtube_id: string | null
}

export interface TmdbPersonDetails {
  adult: boolean
  also_known_as: string[]
  biography: string
  birthday: string | null
  combined_credits: TmdbPersonCombinedCredits
  deathday: string | null
  external_ids: TmdbPersonExternalIds
  gender: number
  homepage: string | null
  id: number
  images: TmdbPersonImages
  imdb_id: string | null
  known_for_department: string
  name: string
  place_of_birth: string | null
  popularity: number
  profile_path: string | null
}
