const TMDB_TOKEN_ENV_NAME = 'VITE_TMDB_READ_ACCESS_TOKEN'

export function getTmdbReadAccessToken(): string {
  const token = import.meta.env.VITE_TMDB_READ_ACCESS_TOKEN?.trim()

  if (!token) {
    throw new Error(
      `Missing ${TMDB_TOKEN_ENV_NAME}. Add the TMDB Read Access Token to .env.local and restart the development server.`,
    )
  }

  return token
}
