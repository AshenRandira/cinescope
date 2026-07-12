export interface TmdbGenre {
  id: number
  name: string
}

export interface TmdbGenreListResponse {
  genres: TmdbGenre[]
}
