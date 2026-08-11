import { describe, expect, it } from 'vitest'

import {
  addNotInterestedRecord,
  createDefaultRecommendationFeedback,
  getRecommendationFeedbackStorageKey,
  mergeRecommendationFeedback,
  parseRecommendationFeedback,
  RECOMMENDATION_FEEDBACK_LIMIT,
  RECOMMENDATION_FEEDBACK_STORAGE_KEY,
  removeNotInterestedRecord,
} from './recommendationFeedback'

describe('recommendation feedback', () => {
  it('creates a local default and scopes authenticated storage', () => {
    expect(createDefaultRecommendationFeedback()).toEqual({
      notInterestedRecordKeys: [],
      updatedAt: null,
    })
    expect(getRecommendationFeedbackStorageKey(null)).toBe(
      RECOMMENDATION_FEEDBACK_STORAGE_KEY,
    )
    expect(getRecommendationFeedbackStorageKey('member/id')).toBe(
      `${RECOMMENDATION_FEEDBACK_STORAGE_KEY}.user.member%2Fid`,
    )
  })

  it('parses only exact, unique, bounded feedback records', () => {
    const validFeedback = {
      notInterestedRecordKeys: ['movie:550', 'tv:1399'],
      updatedAt: '2026-08-11T12:00:00.000Z',
    }

    expect(parseRecommendationFeedback(validFeedback)).toEqual(
      validFeedback,
    )
    expect(
      parseRecommendationFeedback({
        ...validFeedback,
        injected: true,
      }),
    ).toBeNull()
    expect(
      parseRecommendationFeedback({
        ...validFeedback,
        notInterestedRecordKeys: ['movie:550', 'movie:550'],
      }),
    ).toBeNull()
    expect(
      parseRecommendationFeedback({
        ...validFeedback,
        notInterestedRecordKeys: ['person:550'],
      }),
    ).toBeNull()
    expect(
      parseRecommendationFeedback({
        ...validFeedback,
        updatedAt: 'x'.repeat(101),
      }),
    ).toBeNull()
    expect(
      parseRecommendationFeedback({
        ...validFeedback,
        notInterestedRecordKeys: Array.from(
          { length: RECOMMENDATION_FEEDBACK_LIMIT + 1 },
          (_value, index) => `movie:${index + 1}`,
        ),
      }),
    ).toBeNull()
  })

  it('merges unique feedback, keeps the latest timestamp, and caps history', () => {
    const first = {
      notInterestedRecordKeys: Array.from(
        { length: RECOMMENDATION_FEEDBACK_LIMIT },
        (_value, index) => `movie:${index + 1}`,
      ),
      updatedAt: '2026-08-11T10:00:00.000Z',
    }
    const merged = mergeRecommendationFeedback(first, {
      notInterestedRecordKeys: ['movie:1', 'tv:1399'],
      updatedAt: '2026-08-11T11:00:00.000Z',
    })

    expect(merged.notInterestedRecordKeys).toHaveLength(
      RECOMMENDATION_FEEDBACK_LIMIT,
    )
    expect(merged.notInterestedRecordKeys).not.toContain('movie:1')
    expect(merged.notInterestedRecordKeys.at(-1)).toBe('tv:1399')
    expect(merged.updatedAt).toBe('2026-08-11T11:00:00.000Z')
  })

  it('adds, refreshes, and removes a record deterministically', () => {
    const initial = {
      notInterestedRecordKeys: ['movie:1', 'tv:2'],
      updatedAt: '2026-08-11T09:00:00.000Z',
    }
    const added = addNotInterestedRecord(
      initial,
      'movie',
      1,
      '2026-08-11T10:00:00.000Z',
    )

    expect(added).toEqual({
      notInterestedRecordKeys: ['tv:2', 'movie:1'],
      updatedAt: '2026-08-11T10:00:00.000Z',
    })
    expect(
      removeNotInterestedRecord(
        added,
        'movie',
        1,
        '2026-08-11T11:00:00.000Z',
      ),
    ).toEqual({
      notInterestedRecordKeys: ['tv:2'],
      updatedAt: '2026-08-11T11:00:00.000Z',
    })
  })
})
