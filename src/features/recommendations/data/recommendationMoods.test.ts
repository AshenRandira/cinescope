import { describe, expect, it } from 'vitest'

import type { DiscoverRecord } from '../../discovery/data/discoverExperience'
import {
  getRecommendationMoodDefinition,
  getRecommendationMoodMatchCount,
  parseRecommendationMood,
  recommendationMoodDefinitions,
} from './recommendationMoods'

function createRecord(
  mediaType: 'movie' | 'tv',
  genreIds: number[],
): DiscoverRecord {
  return {
    backdropPath: '/backdrop.jpg',
    genreIds,
    id: 1,
    mediaType,
    originalLanguage: 'en',
    overview: 'A recommendation fixture.',
    posterPath: '/poster.jpg',
    recommendationReasons: [],
    dateYear: '2026',
    score: 8,
    title: 'Fixture record',
    voteCount: 100,
  }
}

describe('recommendation moods', () => {
  it('accepts known URL values and falls back to open', () => {
    expect(parseRecommendationMood('reflective')).toBe('reflective')
    expect(parseRecommendationMood('unknown')).toBe('open')
    expect(parseRecommendationMood(null)).toBe('open')
  })

  it('keeps five stable, inspectable mood definitions', () => {
    expect(
      recommendationMoodDefinitions.map(({ value }) => value),
    ).toEqual([
      'open',
      'comfort',
      'reflective',
      'tense',
      'transporting',
    ])
    expect(getRecommendationMoodDefinition('tense').label).toBe(
      'High tension',
    )
  })

  it('uses media-specific genre signals without changing the record', () => {
    expect(
      getRecommendationMoodMatchCount(
        createRecord('movie', [35, 10749]),
        'comfort',
      ),
    ).toBe(2)
    expect(
      getRecommendationMoodMatchCount(
        createRecord('tv', [10768]),
        'tense',
      ),
    ).toBe(1)
    expect(
      getRecommendationMoodMatchCount(
        createRecord('movie', [35]),
        'open',
      ),
    ).toBe(0)
  })
})
