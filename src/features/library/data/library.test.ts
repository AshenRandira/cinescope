import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  getContinueWatchingRecords,
  getLibraryPendingDeletionStorageKey,
  getLibraryRecordKey,
  getLibraryStorageKey,
  getLibrarySyncCopy,
  LIBRARY_STORAGE_KEY,
  mergeLibraryRecords,
  parseLibraryRecord,
  parseLibraryRecords,
  sortLibraryRecords,
  type LibraryRecord,
  type LibrarySyncStatus,
} from './library'

const baseRecord: LibraryRecord = {
  backdropPath: '/arrival-backdrop.jpg',
  id: 329865,
  isFavorite: false,
  isWatched: false,
  mediaType: 'movie',
  overview: 'A linguist works to understand visitors.',
  posterPath: '/arrival-poster.jpg',
  releaseYear: '2016',
  savedAt: '2026-08-08T10:00:00.000Z',
  title: 'Arrival',
  tvProgress: null,
  updatedAt: '2026-08-08T10:00:00.000Z',
  userRating: null,
}

function createRecord(
  overrides: Partial<LibraryRecord> = {},
): LibraryRecord {
  return {
    ...baseRecord,
    ...overrides,
  }
}

describe('library record identity', () => {
  it('builds stable record and storage keys', () => {
    expect(getLibraryRecordKey('movie', 42)).toBe(
      'movie:42',
    )
    expect(getLibraryRecordKey('tv', 1396)).toBe(
      'tv:1396',
    )
    expect(getLibraryStorageKey(null)).toBe(
      LIBRARY_STORAGE_KEY,
    )
    expect(getLibraryStorageKey('member/a b')).toBe(
      `${LIBRARY_STORAGE_KEY}.user.member%2Fa%20b`,
    )
    expect(
      getLibraryPendingDeletionStorageKey('member/a b'),
    ).toBe(
      `${LIBRARY_STORAGE_KEY}.user.member%2Fa%20b.pending-deletions`,
    )
  })
})

describe('parseLibraryRecord', () => {
  it('normalizes a valid persisted record', () => {
    const parsedRecord = parseLibraryRecord({
      ...baseRecord,
      backdropPath: 12,
      overview: undefined,
      posterPath: false,
      releaseYear: 2016,
      title: '  Arrival  ',
      userRating: '8',
    })

    expect(parsedRecord).toEqual({
      ...baseRecord,
      backdropPath: null,
      overview: null,
      posterPath: null,
      releaseYear: null,
      title: 'Arrival',
      userRating: 8,
    })
  })

  it('keeps legacy records compatible and parses valid TV progress', () => {
    const { tvProgress: _legacyProgress, ...legacyRecord } =
      baseRecord
    const parsedLegacyRecord = parseLibraryRecord(
      legacyRecord,
    )
    const parsedTvRecord = parseLibraryRecord({
      ...baseRecord,
      id: 1396,
      mediaType: 'tv',
      title: 'Fixture Series',
      tvProgress: {
        resumeEpisode: {
          episodeNumber: 2,
          name: 'Second episode',
          seasonNumber: 1,
          stillPath: null,
        },
        updatedAt: '2026-08-11T09:00:00.000Z',
        watchedEpisodeKeys: ['1:1'],
      },
    })

    expect(parsedLegacyRecord?.tvProgress).toBeNull()
    expect(
      parsedTvRecord?.tvProgress?.resumeEpisode?.episodeNumber,
    ).toBe(2)
  })

  it.each([
    null,
    [],
    { ...baseRecord, mediaType: 'person' },
    { ...baseRecord, id: 0 },
    { ...baseRecord, title: '   ' },
    { ...baseRecord, isFavorite: 'yes' },
    { ...baseRecord, isWatched: null },
    { ...baseRecord, savedAt: 42 },
    { ...baseRecord, updatedAt: null },
    { ...baseRecord, userRating: 0 },
    { ...baseRecord, userRating: 11 },
    { ...baseRecord, userRating: 1.5 },
  ])('rejects malformed record %#', (value) => {
    expect(parseLibraryRecord(value)).toBeNull()
  })
})

describe('parseLibraryRecords', () => {
  it('recovers safely from empty and malformed storage', () => {
    expect(parseLibraryRecords(null)).toEqual([])
    expect(parseLibraryRecords('{broken')).toEqual([])
    expect(parseLibraryRecords('{"id": 1}')).toEqual(
      [],
    )
  })

  it('filters invalid values and keeps the final duplicate', () => {
    const replacement = createRecord({
      isFavorite: true,
      updatedAt: '2026-08-08T12:00:00.000Z',
    })
    const parsedRecords = parseLibraryRecords(
      JSON.stringify([
        baseRecord,
        { ...baseRecord, id: -1 },
        replacement,
      ]),
    )

    expect(parsedRecords).toEqual([replacement])
  })
})

describe('library ordering and reconciliation', () => {
  it('sorts records without mutating the input', () => {
    const older = createRecord({
      id: 1,
      updatedAt: '2026-08-08T09:00:00.000Z',
    })
    const newer = createRecord({
      id: 2,
      updatedAt: '2026-08-08T11:00:00.000Z',
    })
    const records = [older, newer]

    expect(
      sortLibraryRecords(records).map(({ id }) => id),
    ).toEqual([2, 1])
    expect(records).toEqual([older, newer])
  })

  it('keeps the latest version and preserves the first on a tie', () => {
    const older = createRecord({
      id: 1,
      isFavorite: false,
      updatedAt: '2026-08-08T09:00:00.000Z',
    })
    const newer = createRecord({
      id: 1,
      isFavorite: true,
      updatedAt: '2026-08-08T11:00:00.000Z',
    })
    const tiedFirst = createRecord({
      id: 2,
      title: 'First copy',
      updatedAt: '2026-08-08T10:00:00.000Z',
    })
    const tiedSecond = createRecord({
      id: 2,
      title: 'Second copy',
      updatedAt: '2026-08-08T10:00:00.000Z',
    })

    expect(
      mergeLibraryRecords(
        [older, tiedFirst],
        [newer, tiedSecond],
      ),
    ).toEqual([newer, tiedFirst])
  })

  it('returns unfinished TV records in recent progress order', () => {
    const olderSeries = createRecord({
      id: 10,
      mediaType: 'tv',
      title: 'Older series',
      tvProgress: {
        resumeEpisode: null,
        updatedAt: '2026-08-11T08:00:00.000Z',
        watchedEpisodeKeys: ['1:1'],
      },
    })
    const recentSeries = createRecord({
      id: 11,
      mediaType: 'tv',
      title: 'Recent series',
      tvProgress: {
        resumeEpisode: null,
        updatedAt: '2026-08-11T10:00:00.000Z',
        watchedEpisodeKeys: ['1:1', '1:2'],
      },
    })
    const completedSeries = createRecord({
      ...recentSeries,
      id: 12,
      isWatched: true,
    })

    expect(
      getContinueWatchingRecords([
        olderSeries,
        baseRecord,
        completedSeries,
        recentSeries,
      ]).map((record) => record.id),
    ).toEqual([11, 10])
  })
})

describe('getLibrarySyncCopy', () => {
  it.each<
    [LibrarySyncStatus, string]
  >([
    ['local', 'Browser archive'],
    ['connecting', 'Connecting archive'],
    ['syncing', 'Saving changes'],
    ['synced', 'Account sync active'],
    ['error', 'Cloud sync paused'],
  ])('describes the %s state', (status, label) => {
    expect(getLibrarySyncCopy(status, null).label).toBe(
      label,
    )
  })

  it('uses a concrete cloud error when one is available', () => {
    expect(
      getLibrarySyncCopy(
        'error',
        'Firestore rules need attention.',
      ).detail,
    ).toBe('Firestore rules need attention.')
  })
})
