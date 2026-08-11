import { describe, expect, it } from 'vitest'

import type { AuthUser } from '../../auth/context/AuthContext'
import type { LibraryRecord } from '../../library/data/library'
import { createDefaultPreferences } from '../../preferences/data/preferences'
import {
  ACCOUNT_EXPORT_SCHEMA_VERSION,
  buildAccountExport,
} from './accountExport'

const user: AuthUser = {
  createdAt: '2026-01-01T00:00:00.000Z',
  displayName: 'Archive Member',
  email: 'member@example.test',
  emailVerified: true,
  lastSignInAt: '2026-08-11T00:00:00.000Z',
  uid: 'member-123',
}

function createRecord(
  id: number,
  updatedAt: string,
): LibraryRecord {
  return {
    backdropPath: null,
    id,
    isFavorite: false,
    isWatched: false,
    mediaType: 'movie',
    overview: null,
    posterPath: null,
    releaseYear: '2026',
    savedAt: updatedAt,
    title: `Film ${id}`,
    tvProgress: null,
    updatedAt,
    userRating: null,
  }
}

describe('account export', () => {
  it('creates a versioned, deterministic snapshot without credentials', () => {
    const accountExport = buildAccountExport({
      exportedAt: '2026-08-11T01:02:03.000Z',
      preferences: {
        ...createDefaultPreferences(),
        favoriteGenres: ['drama', 'mystery'],
        preferredLanguage: 'en',
        preferredMedia: 'movie',
        updatedAt: '2026-08-10T12:00:00.000Z',
      },
      recommendationFeedback: {
        notInterestedRecordKeys: ['movie:550', 'tv:1399'],
        updatedAt: '2026-08-11T00:30:00.000Z',
      },
      records: [
        createRecord(1, '2026-08-01T00:00:00.000Z'),
        createRecord(2, '2026-08-02T00:00:00.000Z'),
      ],
      syncStatus: 'synced',
      user,
    })

    expect(accountExport.schemaVersion).toBe(
      ACCOUNT_EXPORT_SCHEMA_VERSION,
    )
    expect(
      accountExport.archive.records.map(
        (record) => record.id,
      ),
    ).toEqual([2, 1])
    expect(accountExport.preferences).toMatchObject({
      favoriteGenres: ['drama', 'mystery'],
      preferredLanguage: 'en',
      preferredMedia: 'movie',
    })
    expect(accountExport.recommendationFeedback).toEqual({
      notInterestedRecordKeys: ['movie:550', 'tv:1399'],
      updatedAt: '2026-08-11T00:30:00.000Z',
    })
    expect(JSON.stringify(accountExport)).not.toMatch(
      /password|token/i,
    )
  })
})
