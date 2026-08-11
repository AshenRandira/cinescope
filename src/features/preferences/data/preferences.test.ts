import { describe, expect, it } from 'vitest'

import {
  createDefaultPreferences,
  getPreferenceGenreIds,
  getPreferenceSummary,
  getPreferencesStorageKey,
  normalizePreferenceInput,
  parseUserPreferences,
  type UserPreferences,
} from './preferences'

const storedPreferences = {
  favoriteGenres: ['drama', 'mystery'],
  preferredLanguage: 'si',
  preferredMedia: 'movie',
  updatedAt: '2026-08-11T10:00:00.000Z',
}

describe('user preferences', () => {
  it('provides a neutral guest-safe default', () => {
    expect(createDefaultPreferences()).toEqual({
      favoriteGenres: [],
      preferredLanguage: 'any',
      preferredMedia: 'balanced',
      updatedAt: null,
    })
  })

  it('parses the exact bounded persisted shape', () => {
    expect(parseUserPreferences(storedPreferences)).toEqual(
      storedPreferences,
    )
    expect(
      parseUserPreferences({
        ...storedPreferences,
        favoriteGenres: [
          'action',
          'animation',
          'comedy',
          'crime',
          'drama',
          'mystery',
        ],
      }),
    ).toBeNull()
    expect(
      parseUserPreferences({
        ...storedPreferences,
        favoriteGenres: ['drama', 'drama'],
      }),
    ).toBeNull()
    expect(
      parseUserPreferences({
        ...storedPreferences,
        injected: true,
      }),
    ).toBeNull()
  })

  it('normalizes invalid input into a bounded supported value', () => {
    expect(
      normalizePreferenceInput({
        favoriteGenres: [
          'drama',
          'drama',
          'mystery',
          'action',
          'comedy',
          'crime',
          'western',
        ],
        preferredLanguage: 'any',
        preferredMedia: 'balanced',
      }),
    ).toEqual({
      favoriteGenres: [
        'drama',
        'mystery',
        'action',
        'comedy',
        'crime',
      ],
      preferredLanguage: 'any',
      preferredMedia: 'balanced',
    })
  })

  it('maps canonical genres across movie and television taxonomies', () => {
    const preferences: UserPreferences = {
      ...createDefaultPreferences(),
      favoriteGenres: ['action', 'science-fiction'],
    }

    expect(
      [...getPreferenceGenreIds(preferences, 'movie')],
    ).toEqual([28, 878])
    expect(
      [...getPreferenceGenreIds(preferences, 'tv')],
    ).toEqual([10759, 10765])
  })

  it('creates an inspectable summary and user-scoped cache key', () => {
    expect(
      getPreferenceSummary({
        ...storedPreferences,
        favoriteGenres: ['drama', 'mystery'],
        preferredLanguage: 'si',
        preferredMedia: 'movie',
      }),
    ).toBe('Film leaning / Sinhala / Drama, Mystery')
    expect(getPreferencesStorageKey('member/123')).toBe(
      'cinescope.preferences.v1.user.member%2F123',
    )
  })
})
