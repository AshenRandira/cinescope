export interface TmdbWatchProvider {
  display_priority: number
  logo_path: string | null
  provider_id: number
  provider_name: string
}

export interface TmdbWatchProviderRegion {
  ads?: TmdbWatchProvider[]
  buy?: TmdbWatchProvider[]
  flatrate?: TmdbWatchProvider[]
  free?: TmdbWatchProvider[]
  link: string
  rent?: TmdbWatchProvider[]
}

export interface TmdbWatchProviderResponse {
  id: number
  results: Record<string, TmdbWatchProviderRegion>
}
