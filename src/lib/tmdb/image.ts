const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p'

export type TmdbImageSize =
  | `w${number}`
  | `h${number}`
  | 'original'

export const TMDB_IMAGE_DEFAULTS = {
  backdrop: 'w1280',
  logo: 'w185',
  poster: 'w500',
  profile: 'w185',
} as const satisfies Record<string, TmdbImageSize>

export function getTmdbImageUrl(
  filePath: string | null | undefined,
  size: TmdbImageSize = 'original',
): string | null {
  if (!filePath) {
    return null
  }

  const normalizedPath = filePath.startsWith('/')
    ? filePath
    : `/${filePath}`

  return `${TMDB_IMAGE_BASE_URL}/${size}${normalizedPath}`
}

export function getTmdbImageSrcSet(
  filePath: string | null | undefined,
  sizes: ReadonlyArray<`w${number}`>,
): string | undefined {
  if (!filePath) {
    return undefined
  }

  const candidates = sizes.map((size) => {
    const width = Number(size.slice(1))
    const url = getTmdbImageUrl(filePath, size)

    return `${url} ${width}w`
  })

  return candidates.join(', ')
}

export function getTmdbPosterUrl(
  filePath: string | null | undefined,
  size: TmdbImageSize = TMDB_IMAGE_DEFAULTS.poster,
): string | null {
  return getTmdbImageUrl(filePath, size)
}

export function getTmdbBackdropUrl(
  filePath: string | null | undefined,
  size: TmdbImageSize = TMDB_IMAGE_DEFAULTS.backdrop,
): string | null {
  return getTmdbImageUrl(filePath, size)
}

export function getTmdbProfileUrl(
  filePath: string | null | undefined,
  size: TmdbImageSize = TMDB_IMAGE_DEFAULTS.profile,
): string | null {
  return getTmdbImageUrl(filePath, size)
}

export function getTmdbLogoUrl(
  filePath: string | null | undefined,
  size: TmdbImageSize = TMDB_IMAGE_DEFAULTS.logo,
): string | null {
  return getTmdbImageUrl(filePath, size)
}