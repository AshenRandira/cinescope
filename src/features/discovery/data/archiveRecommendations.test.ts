import {
  describe,
  expect,
  it,
} from 'vitest'

import type {
  TmdbMovie,
  TmdbTvShow,
} from '../../../types/tmdb'

import type { LibraryRecord } from '../../library/data/library'
import {
  createDefaultPreferences,
  type UserPreferences,
} from '../../preferences/data/preferences'
import {
  buildArchiveRecommendations,
  getArchiveRecommendationPages,
  selectArchiveRecommendationSeeds,
  type ArchiveRecommendationResponse,
  type ArchiveRecommendationSeed,
} from './archiveRecommendations'

const baseLibraryRecord: LibraryRecord = {
  backdropPath: null,
  id: 1,
  isFavorite: false,
  isWatched: false,
  mediaType: 'movie',
  overview: null,
  posterPath: '/library-poster.jpg',
  releaseYear: '2020',
  savedAt: '2026-08-08T10:00:00.000Z',
  title: 'Library record',
  tvProgress: null,
  updatedAt: '2026-08-08T10:00:00.000Z',
  userRating: null,
}

function createLibraryRecord(
  overrides: Partial<LibraryRecord> = {},
): LibraryRecord {
  return {
    ...baseLibraryRecord,
    ...overrides,
  }
}

function createMovie(
  id: number,
  overrides: Partial<TmdbMovie> = {},
): TmdbMovie {
  return {
    adult: false,
    backdrop_path: `/movie-${id}-backdrop.jpg`,
    genre_ids: [18],
    id,
    original_language: 'en',
    original_title: `Movie ${id}`,
    overview: `Overview for movie ${id}`,
    popularity: 20,
    poster_path: `/movie-${id}-poster.jpg`,
    release_date: '2020-01-01',
    title: `Movie ${id}`,
    video: false,
    vote_average: 7,
    vote_count: 1000,
    ...overrides,
  }
}

function createTvShow(
  id: number,
  overrides: Partial<TmdbTvShow> = {},
): TmdbTvShow {
  return {
    adult: false,
    backdrop_path: `/tv-${id}-backdrop.jpg`,
    first_air_date: '2021-02-03',
    genre_ids: [18],
    id,
    name: `Series ${id}`,
    origin_country: ['US'],
    original_language: 'en',
    original_name: `Series ${id}`,
    overview: `Overview for series ${id}`,
    popularity: 18,
    poster_path: `/tv-${id}-poster.jpg`,
    vote_average: 8,
    vote_count: 2000,
    ...overrides,
  }
}

function createSeed(
  id: number,
  mediaType: 'movie' | 'tv' = 'movie',
  signal: ArchiveRecommendationSeed['signal'] = 'recent',
): ArchiveRecommendationSeed {
  return {
    id,
    mediaType,
    signal,
    title: `Seed ${id}`,
  }
}

function createResponse(
  seed: ArchiveRecommendationSeed,
  results: Array<TmdbMovie | TmdbTvShow>,
  totalPages = 1,
): ArchiveRecommendationResponse {
  return {
    response: {
      page: 1,
      results,
      total_pages: totalPages,
      total_results: results.length,
    },
    seed,
  }
}

describe('selectArchiveRecommendationSeeds', () => {
  it('uses the four strongest positive signals', () => {
    const records = [
      createLibraryRecord({
        id: 1,
        isFavorite: true,
        isWatched: true,
        userRating: 9,
      }),
      createLibraryRecord({
        id: 2,
        isFavorite: true,
        isWatched: true,
        updatedAt: '2026-08-08T10:01:00.000Z',
      }),
      createLibraryRecord({
        id: 3,
        isWatched: true,
        updatedAt: '2026-08-08T10:02:00.000Z',
        userRating: 10,
      }),
      createLibraryRecord({
        id: 4,
        isFavorite: true,
      }),
      createLibraryRecord({ id: 5, userRating: 7 }),
      createLibraryRecord({
        id: 6,
        updatedAt: '2026-08-08T12:00:00.000Z',
      }),
    ]

    expect(
      selectArchiveRecommendationSeeds(records).map(
        ({ id }) => id,
      ),
    ).toEqual([1, 3, 2, 4])
  })

  it('falls back to recent unrated records and ignores low ratings', () => {
    const records = [
      createLibraryRecord({ id: 7, userRating: 4 }),
      createLibraryRecord({
        id: 8,
        updatedAt: '2026-08-08T09:00:00.000Z',
      }),
      createLibraryRecord({
        id: 9,
        mediaType: 'tv',
        title: 'Recent series',
        updatedAt: '2026-08-08T11:00:00.000Z',
      }),
    ]

    expect(selectArchiveRecommendationSeeds(records)).toEqual(
      [
        {
          id: 9,
          mediaType: 'tv',
          signal: 'recent',
          title: 'Recent series',
        },
        {
          id: 8,
          mediaType: 'movie',
          signal: 'recent',
          title: 'Library record',
        },
      ],
    )
  })

  it('uses the preferred media balance as a bounded seed tiebreaker', () => {
    const records = [
      createLibraryRecord({
        id: 20,
        isFavorite: true,
      }),
      createLibraryRecord({
        id: 21,
        isFavorite: true,
        mediaType: 'tv',
        title: 'Preferred series seed',
      }),
    ]

    expect(
      selectArchiveRecommendationSeeds(records, {
        ...createDefaultPreferences(),
        preferredMedia: 'tv',
      }).map(({ id }) => id),
    ).toEqual([21, 20])
  })

  it('uses active TV progress as a positive seed signal', () => {
    const records = [
      createLibraryRecord({
        id: 30,
        mediaType: 'tv',
        title: 'Series in progress',
        tvProgress: {
          resumeEpisode: null,
          updatedAt: '2026-08-11T09:00:00.000Z',
          watchedEpisodeKeys: ['1:1'],
        },
      }),
      createLibraryRecord({
        id: 31,
        updatedAt: '2026-08-11T10:00:00.000Z',
      }),
    ]

    expect(selectArchiveRecommendationSeeds(records)).toEqual([
      {
        id: 30,
        mediaType: 'tv',
        signal: 'progress',
        title: 'Series in progress',
      },
    ])
  })
})

describe('buildArchiveRecommendations', () => {
  it('filters unusable records and ranks cross-seed consensus first', () => {
    const libraryRecords = [baseLibraryRecord]
    const firstSeed = createSeed(1)
    const secondSeed = createSeed(4)
    const tvSeed = createSeed(100, 'tv')
    const recommendations = buildArchiveRecommendations(
      [
        createResponse(firstSeed, [
          createMovie(1),
          createMovie(2, {
            backdrop_path: null,
            poster_path: null,
          }),
          createMovie(3, { adult: true }),
          createMovie(10),
          createMovie(10),
          createMovie(20),
          createMovie(11),
        ]),
        createResponse(secondSeed, [
          createMovie(12, {
            vote_average: 10,
            vote_count: 2_000_000,
          }),
          createMovie(20),
        ]),
        createResponse(tvSeed, [createTvShow(200)]),
      ],
      libraryRecords,
    )

    expect(recommendations[0]?.id).toBe(20)
    expect(
      recommendations.map(
        ({ id, mediaType }) => `${mediaType}:${id}`,
      ),
    ).toEqual([
      'movie:20',
      'movie:12',
      'tv:200',
      'movie:10',
      'movie:11',
    ])
    expect(recommendations).not.toContainEqual(
      expect.objectContaining({ id: 1 }),
    )
    expect(recommendations).not.toContainEqual(
      expect.objectContaining({ id: 2 }),
    )
    expect(recommendations).not.toContainEqual(
      expect.objectContaining({ id: 3 }),
    )
  })

  it('uses score and audience weight within one-source results', () => {
    const recommendations = buildArchiveRecommendations(
      [
        createResponse(createSeed(1), [
          createMovie(30, {
            vote_average: 0,
            vote_count: 0,
          }),
          createMovie(31, {
            vote_average: 10,
            vote_count: 2_000_000,
          }),
        ]),
      ],
      [],
    )

    expect(recommendations.map(({ id }) => id)).toEqual([
      31, 30,
    ])
    expect(recommendations[0]).toMatchObject({
      mediaType: 'movie',
      score: 10,
    })
  })

  it('re-ranks mixed results with inspectable media, language, and genre preferences', () => {
    const preferences: UserPreferences = {
      ...createDefaultPreferences(),
      favoriteGenres: ['drama'],
      preferredLanguage: 'si',
      preferredMedia: 'tv',
    }
    const recommendations = buildArchiveRecommendations(
      [
        createResponse(createSeed(1), [
          createMovie(50, {
            genre_ids: [28],
            original_language: 'en',
          }),
          createMovie(51, {
            genre_ids: [18],
            original_language: 'si',
          }),
        ]),
        createResponse(createSeed(2, 'tv'), [
          createTvShow(52, {
            genre_ids: [18],
            original_language: 'si',
          }),
        ]),
      ],
      [],
      preferences,
    )

    expect(
      recommendations.map(({ id }) => id),
    ).toEqual([52, 51, 50])
  })

  it('re-ranks an existing reel for mood without changing its records', () => {
    const response = createResponse(createSeed(1), [
      createMovie(60, { genre_ids: [18] }),
      createMovie(61, { genre_ids: [35] }),
    ])
    const openReel = buildArchiveRecommendations(
      [response],
      [],
    )
    const comfortReel = buildArchiveRecommendations(
      [response],
      [],
      createDefaultPreferences(),
      { mood: 'comfort' },
    )

    expect(openReel.map(({ id }) => id)).toEqual([60, 61])
    expect(comfortReel.map(({ id }) => id)).toEqual([
      61, 60,
    ])
    expect(
      comfortReel.find(({ id }) => id === 61)
        ?.recommendationReasons,
    ).toContain('Fits this comforting mood.')
  })

  it('removes not-interested records before ranking', () => {
    const recommendations = buildArchiveRecommendations(
      [
        createResponse(createSeed(1), [
          createMovie(70),
          createMovie(71),
        ]),
      ],
      [],
      createDefaultPreferences(),
      { notInterestedRecordKeys: ['movie:70'] },
    )

    expect(recommendations.map(({ id }) => id)).toEqual([71])
  })

  it('explains archive consensus and preference signals deterministically', () => {
    const preferences: UserPreferences = {
      ...createDefaultPreferences(),
      favoriteGenres: ['drama'],
    }
    const firstSeed = createSeed(80, 'movie', 'favorite')
    const secondSeed = createSeed(81, 'movie', 'high-rating')
    const recommendations = buildArchiveRecommendations(
      [
        createResponse(firstSeed, [createMovie(90)]),
        createResponse(secondSeed, [createMovie(90)]),
      ],
      [],
      preferences,
    )

    expect(recommendations[0]?.recommendationReasons).toEqual([
      'Connected to 2 archive anchors, including Seed 80.',
      'Matches your drama preference.',
    ])
  })

  it('explains recommendations seeded by active TV progress', () => {
    const recommendations = buildArchiveRecommendations(
      [
        createResponse(
          createSeed(100, 'tv', 'progress'),
          [createTvShow(101)],
        ),
      ],
      [],
    )

    expect(recommendations[0]?.recommendationReasons[0]).toBe(
      'Because you are continuing Seed 100.',
    )
  })

  it('preserves first-seen order when recommendation weights tie', () => {
    const recommendations = buildArchiveRecommendations(
      [
        createResponse(createSeed(1), [createMovie(40)]),
        createResponse(createSeed(2), [createMovie(41)]),
      ],
      [],
    )

    expect(recommendations.map(({ id }) => id)).toEqual([
      40, 41,
    ])
  })

  it('caps a recommendation reel at twenty records', () => {
    const results = Array.from(
      { length: 25 },
      (_, index) => createMovie(index + 1000),
    )

    expect(
      buildArchiveRecommendations(
        [createResponse(createSeed(1), results)],
        [],
      ),
    ).toHaveLength(20)
  })
})

describe('getArchiveRecommendationPages', () => {
  it('returns one page without responses', () => {
    expect(getArchiveRecommendationPages([])).toBe(1)
  })

  it('uses the largest response count and applies the page cap', () => {
    expect(
      getArchiveRecommendationPages([
        createResponse(createSeed(1), [], 2),
        createResponse(createSeed(2), [], 18),
      ]),
    ).toBe(10)
  })
})
