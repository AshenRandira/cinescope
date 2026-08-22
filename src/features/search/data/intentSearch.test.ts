import { describe, expect, it } from 'vitest'

import type {
  TmdbMovie,
  TmdbPaginatedResponse,
  TmdbTvShow,
} from '../../../types/tmdb'
import {
  buildIntentDiscoverQuery,
  createDefaultIntentCriteria,
  flattenIntentPages,
  parseIntentCriteria,
  parseNaturalLanguageIntent,
  serializeIntentSearch,
  supportsIntentMedia,
  type IntentSearchCriteria,
} from './intentSearch'

function createMovie(overrides: Partial<TmdbMovie> = {}): TmdbMovie {
  return {
    adult: false,
    backdrop_path: null,
    genre_ids: [35, 10751],
    id: 1,
    original_language: 'en',
    original_title: 'Family Laughs',
    overview: 'A warm comedy.',
    popularity: 90,
    poster_path: null,
    release_date: '2018-04-10',
    title: 'Family Laughs',
    video: false,
    vote_average: 7.4,
    vote_count: 150,
    ...overrides,
  }
}

function createShow(overrides: Partial<TmdbTvShow> = {}): TmdbTvShow {
  return {
    adult: false,
    backdrop_path: null,
    first_air_date: '2019-02-01',
    genre_ids: [35, 10751],
    id: 2,
    name: 'Family Series',
    origin_country: ['US'],
    original_language: 'en',
    original_name: 'Family Series',
    overview: 'A warm series.',
    popularity: 80,
    poster_path: null,
    vote_average: 7.2,
    vote_count: 120,
    ...overrides,
  }
}

function page<T>(results: T[]): TmdbPaginatedResponse<T> {
  return {
    page: 1,
    results,
    total_pages: 1,
    total_results: results.length,
  }
}

describe('natural-language intent search', () => {
  it('extracts multiple viewing signals from a free-form request', () => {
    const parsed = parseNaturalLanguageIntent(
      'I want a funny family movie under two hours from the 2010s',
    )

    expect(parsed.isIntent).toBe(true)
    expect(parsed.criteria).toMatchObject({
      decade: 2010,
      genres: ['comedy', 'family'],
      media: 'movie',
      runtimeMaximum: 120,
    })
    expect(parsed.recognizedSignals).toContain('Comedy')
  })

  it('does not reinterpret a plausible title from one weak signal', () => {
    expect(parseNaturalLanguageIntent('Funny Games').isIntent).toBe(false)
    expect(parseNaturalLanguageIntent('Family Guy').isIntent).toBe(false)
    expect(parseNaturalLanguageIntent('Dune').isIntent).toBe(false)
  })

  it('round-trips edited criteria and lets URL state clear parsed values', () => {
    const parsed = parseNaturalLanguageIntent(
      'a reflective Korean drama from the 2010s',
    )
    const params = serializeIntentSearch('request', parsed.criteria)
    const edited = new URLSearchParams(params)

    edited.delete('genres')
    edited.delete('decade')
    edited.set('runtime', '90')

    expect(parseIntentCriteria(edited, parsed.criteria)).toEqual({
      ...parsed.criteria,
      decade: null,
      genres: [],
      runtimeMaximum: 90,
    })
  })

  it('builds separate movie and TV discover contracts', () => {
    const criteria: IntentSearchCriteria = {
      ...createDefaultIntentCriteria(),
      decade: 2010,
      genres: ['comedy', 'family'],
      language: 'ko',
      runtimeMaximum: 120,
    }

    expect(buildIntentDiscoverQuery(criteria, 'movie', 2)).toMatchObject({
      'primary_release_date.gte': '2010-01-01',
      'primary_release_date.lte': '2019-12-31',
      'with_runtime.lte': 120,
      include_video: false,
      page: 2,
      with_genres: '35,10751',
      with_original_language: 'ko',
    })
    expect(buildIntentDiscoverQuery(criteria, 'tv', 2)).toMatchObject({
      'first_air_date.gte': '2010-01-01',
      'first_air_date.lte': '2019-12-31',
      page: 2,
      with_genres: '35,10751|10762',
    })
  })

  it('does not claim an exact genre mapping where TMDB has none', () => {
    const criteria: IntentSearchCriteria = {
      ...createDefaultIntentCriteria(),
      genres: ['horror'],
      media: 'tv',
    }

    expect(supportsIntentMedia(criteria, 'movie')).toBe(false)
    expect(supportsIntentMedia(criteria, 'tv')).toBe(false)
  })

  it('interleaves movie and TV results and adds match explanations', () => {
    const criteria: IntentSearchCriteria = {
      ...createDefaultIntentCriteria(),
      genres: ['comedy', 'family'],
    }
    const records = flattenIntentPages(
      [page([createMovie()])],
      [page([createShow()])],
      criteria,
    )

    expect(records.map(({ mediaType }) => mediaType)).toEqual([
      'movie',
      'tv',
    ])
    expect(records[0].matchReasons[0]).toContain('comedy + family')
  })
})
