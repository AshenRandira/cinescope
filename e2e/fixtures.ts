import type { Page, Route } from '@playwright/test'

const movieSummary = {
  adult: false,
  backdrop_path: null,
  genre_ids: [18],
  id: 550,
  original_language: 'en',
  original_title: 'Fixture Film',
  overview: 'A stable feature record used only by automated browser tests.',
  popularity: 100,
  poster_path: null,
  release_date: '1999-10-15',
  title: 'Fixture Film',
  video: false,
  vote_average: 8.4,
  vote_count: 250,
}

const fixtureVideo = {
  id: 'fixture-video',
  iso_639_1: 'en',
  iso_3166_1: 'US',
  key: 'fixture-trailer',
  name: 'Fixture Trailer',
  official: true,
  published_at: '2026-01-15T00:00:00.000Z',
  site: 'YouTube',
  size: 1080,
  type: 'Trailer',
}

const movieDetails = {
  ...movieSummary,
  belongs_to_collection: null,
  budget: 63_000_000,
  credits: { cast: [], crew: [], id: 550 },
  genres: [{ id: 18, name: 'Drama' }],
  homepage: '',
  imdb_id: 'tt0137523',
  origin_country: ['US'],
  production_companies: [],
  production_countries: [{ iso_3166_1: 'US', name: 'United States' }],
  recommendations: {
    page: 1,
    results: [],
    total_pages: 0,
    total_results: 0,
  },
  revenue: 100_000_000,
  runtime: 139,
  spoken_languages: [{ english_name: 'English', iso_639_1: 'en', name: 'English' }],
  status: 'Released',
  tagline: 'Deterministic cinema.',
  videos: { id: 550, results: [fixtureVideo] },
}

const recommendationMovieSummary = {
  ...movieSummary,
  backdrop_path: '/reflective-echo-backdrop.jpg',
  genre_ids: [18, 99],
  id: 551,
  original_language: 'ko',
  original_title: 'Reflective Echo',
  poster_path: '/reflective-echo-poster.jpg',
  title: 'Reflective Echo',
  vote_average: 8.1,
  vote_count: 175,
}

const secondaryMovieSummary = {
  ...recommendationMovieSummary,
  id: 553,
  title: 'Fixture Second Film',
  original_title: 'Fixture Second Film',
}

const tertiaryMovieSummary = {
  ...secondaryMovieSummary,
  id: 554,
  title: 'Fixture Third Film',
  original_title: 'Fixture Third Film',
}

const movieRecommendationResponse = {
  page: 1,
  results: [recommendationMovieSummary, secondaryMovieSummary],
  total_pages: 1,
  total_results: 1,
}

const homeMovieResponse = {
  page: 1,
  results: [recommendationMovieSummary],
  total_pages: 1,
  total_results: 1,
}

const tvSummary = {
  adult: false,
  backdrop_path: null,
  first_air_date: '2024-01-10',
  genre_ids: [18],
  id: 1399,
  name: 'Fixture Series',
  origin_country: ['US'],
  original_language: 'en',
  original_name: 'Fixture Series',
  overview: 'A stable television record used only by automated browser tests.',
  popularity: 80,
  poster_path: null,
  vote_average: 8.2,
  vote_count: 180,
}

const secondaryTvSummary = {
  ...tvSummary,
  id: 1405,
  name: 'Fixture Second Series',
  original_name: 'Fixture Second Series',
}

const episodeSummary = {
  air_date: '2024-01-10',
  crew: [],
  episode_number: 1,
  episode_type: 'standard',
  guest_stars: [],
  id: 1401,
  name: 'Pilot Projection',
  overview: 'The first frame in the deterministic season fixture.',
  production_code: 'FIX-101',
  runtime: 52,
  season_number: 1,
  show_id: 1399,
  still_path: null,
  vote_average: 8,
  vote_count: 42,
}

const secondEpisodeSummary = {
  ...episodeSummary,
  air_date: '2024-01-17',
  episode_number: 2,
  id: 1402,
  name: 'The Second Transmission',
  overview: 'The next frame in the deterministic season fixture.',
  production_code: 'FIX-102',
}

const seasonSummary = {
  air_date: '2024-01-10',
  episode_count: 2,
  id: 1400,
  name: 'Season 1',
  overview: 'A deterministic two-episode season.',
  poster_path: null,
  season_number: 1,
  vote_average: 8,
}

const tvDetails = {
  ...tvSummary,
  created_by: [],
  credits: { cast: [], crew: [], id: 1399 },
  episode_run_time: [52],
  genres: [{ id: 18, name: 'Drama' }],
  homepage: '',
  in_production: false,
  languages: ['en'],
  last_air_date: '2024-01-17',
  last_episode_to_air: secondEpisodeSummary,
  networks: [],
  next_episode_to_air: null,
  number_of_episodes: 2,
  number_of_seasons: 1,
  production_companies: [],
  production_countries: [{ iso_3166_1: 'US', name: 'United States' }],
  recommendations: {
    page: 1,
    results: [],
    total_pages: 0,
    total_results: 0,
  },
  seasons: [seasonSummary],
  spoken_languages: [{ english_name: 'English', iso_639_1: 'en', name: 'English' }],
  status: 'Ended',
  tagline: 'Every signal has a beginning.',
  type: 'Scripted',
  videos: { id: 1399, results: [] },
}

const seasonDetails = {
  _id: 'fixture-season',
  air_date: seasonSummary.air_date,
  credits: { cast: [], crew: [], id: 1400 },
  episodes: [episodeSummary, secondEpisodeSummary],
  id: seasonSummary.id,
  name: seasonSummary.name,
  overview: seasonSummary.overview,
  poster_path: null,
  season_number: 1,
  vote_average: 8,
}

const episodeDetails = {
  ...episodeSummary,
  credits: { cast: [], crew: [], guest_stars: [], id: 1401 },
  images: { id: 1401, stills: [] },
  videos: { id: 1401, results: [] },
}

const secondEpisodeDetails = {
  ...secondEpisodeSummary,
  credits: { cast: [], crew: [], guest_stars: [], id: 1402 },
  images: { id: 1402, stills: [] },
  videos: { id: 1402, results: [] },
}

const searchResponse = {
  page: 1,
  results: [{ ...movieSummary, media_type: 'movie' }],
  total_pages: 1,
  total_results: 1,
}

const intentMovieSummary = {
  ...movieSummary,
  genre_ids: [35, 10751],
  id: 552,
  original_title: 'Fixture Family Comedy',
  overview: 'A concise comedy selected for a family viewing request.',
  release_date: '2018-06-08',
  title: 'Fixture Family Comedy',
  vote_average: 7.6,
  vote_count: 160,
}

const movieDiscoveryResponse = {
  page: 1,
  results: [intentMovieSummary, secondaryMovieSummary, tertiaryMovieSummary],
  total_pages: 1,
  total_results: 1,
}

const tvDiscoveryResponse = {
  page: 1,
  results: [tvSummary, secondaryTvSummary],
  total_pages: 1,
  total_results: 1,
}

const personDetails = {
  adult: false,
  also_known_as: [],
  biography:
    'A stable contributor biography used only by automated browser tests.',
  birthday: '1980-01-01',
  combined_credits: {
    cast: [
      {
        ...movieSummary,
        character: 'The Archivist',
        credit_id: 'fixture-credit',
        media_type: 'movie',
      },
    ],
    crew: [],
    id: 287,
  },
  deathday: null,
  external_ids: {
    facebook_id: null,
    freebase_id: null,
    freebase_mid: null,
    id: 287,
    imdb_id: null,
    instagram_id: null,
    tiktok_id: null,
    tvrage_id: null,
    twitter_id: null,
    wikidata_id: null,
    youtube_id: null,
  },
  gender: 0,
  homepage: null,
  id: 287,
  images: { id: 287, profiles: [] },
  imdb_id: null,
  known_for_department: 'Acting',
  name: 'Fixture Contributor',
  place_of_birth: 'Fixture City',
  popularity: 42,
  profile_path: null,
}

function fulfillJson(route: Route, json: unknown): Promise<void> {
  return route.fulfill({ json })
}

export async function installPublicApiFixtures(
  page: Page,
  options: { clearStorage?: boolean } = {},
): Promise<void> {
  await page.emulateMedia({ reducedMotion: 'reduce' })

  if (options.clearStorage ?? true) {
    await page.addInitScript(() => {
      const browserGlobal = globalThis as typeof globalThis & {
        localStorage: { clear: () => void }
        sessionStorage: {
          clear: () => void
          getItem: (key: string) => string | null
          setItem: (key: string, value: string) => void
        }
      }
      const resetKey = 'cinescope.e2e-storage-reset'

      if (
        browserGlobal.sessionStorage.getItem(resetKey)
      ) {
        return
      }

      browserGlobal.localStorage.clear()
      browserGlobal.sessionStorage.clear()
      browserGlobal.sessionStorage.setItem(resetKey, 'true')
    })
  }

  await page.route('https://image.tmdb.org/**', (route) =>
    route.fulfill({
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800"><rect width="1200" height="800" fill="#30261f"/><circle cx="840" cy="260" r="260" fill="#6f4f37" opacity=".72"/></svg>',
      contentType: 'image/svg+xml',
    }),
  )

  if (
    process.env.CINESCOPE_PLAYWRIGHT_CHANNEL &&
    process.env.CINESCOPE_PLAYWRIGHT_CHANNEL !== 'chromium'
  ) {
    await page.route(/\.css(?:\?.*)?$/, (route) =>
      route.fulfill({ body: '', contentType: 'text/css' }),
    )
  }

  await page.route('https://www.youtube-nocookie.com/**', (route) =>
    route.fulfill({ body: '<!doctype html><title>Fixture video</title>', contentType: 'text/html' }),
  )

  await page.route('**/api/tmdb/**', async (route) => {
    const pathname = new URL(route.request().url()).pathname.replace(
      '/api/tmdb',
      '',
    )

    switch (pathname) {
      case '/movie/popular':
      case '/movie/now_playing':
      case '/movie/upcoming':
      case '/trending/movie/week':
        await fulfillJson(route, homeMovieResponse)
        return
      case '/trending/all/week':
        await fulfillJson(route, {
          ...homeMovieResponse,
          results: [
            { ...recommendationMovieSummary, media_type: 'movie' },
            { ...secondaryTvSummary, media_type: 'tv' },
          ],
        })
        return
      case '/search/multi':
        await fulfillJson(route, searchResponse)
        return
      case '/discover/movie':
        await fulfillJson(route, movieDiscoveryResponse)
        return
      case '/discover/tv':
        await fulfillJson(route, tvDiscoveryResponse)
        return
      case '/genre/movie/list':
        await fulfillJson(route, {
          genres: [
            { id: 18, name: 'Drama' },
            { id: 35, name: 'Comedy' },
            { id: 10751, name: 'Family' },
          ],
        })
        return
      case '/movie/550':
        await fulfillJson(route, movieDetails)
        return
      case '/movie/550/watch/providers':
        await fulfillJson(route, { id: 550, results: {} })
        return
      case '/movie/550/recommendations':
        await fulfillJson(route, movieRecommendationResponse)
        return
      case '/genre/tv/list':
        await fulfillJson(route, { genres: [{ id: 18, name: 'Drama' }] })
        return
      case '/tv/popular':
      case '/tv/on_the_air':
      case '/trending/tv/week':
        await fulfillJson(route, tvDiscoveryResponse)
        return
      case '/tv/1399':
        await fulfillJson(route, tvDetails)
        return
      case '/tv/1399/watch/providers':
        await fulfillJson(route, { id: 1399, results: {} })
        return
      case '/tv/1399/season/1':
        await fulfillJson(route, seasonDetails)
        return
      case '/tv/1399/season/1/episode/1':
        await fulfillJson(route, episodeDetails)
        return
      case '/tv/1399/season/1/episode/2':
        await fulfillJson(route, secondEpisodeDetails)
        return
      case '/person/287':
        await fulfillJson(route, personDetails)
        return
      default:
        await route.fulfill({
          json: {
            status_code: 34,
            status_message: `Unhandled E2E fixture: ${pathname}`,
            success: false,
          },
          status: 404,
        })
    }
  })
}
