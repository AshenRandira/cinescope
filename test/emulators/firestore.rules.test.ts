import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
} from 'firebase/firestore'
import { readFile } from 'node:fs/promises'
import { afterAll, beforeAll, beforeEach, describe, expect, test } from 'vitest'

const PROJECT_ID = 'demo-cinescope'
const OWNER_ID = 'owner-user'
const OTHER_USER_ID = 'other-user'
const RECORD_PATH = `users/${OWNER_ID}/library/movie:550`
const PREFERENCES_PATH =
  `users/${OWNER_ID}/preferences/discovery`
const RECOMMENDATION_FEEDBACK_PATH =
  `users/${OWNER_ID}/preferences/recommendations`

const validRecord = {
  backdropPath: null,
  id: 550,
  isFavorite: false,
  isWatched: false,
  mediaType: 'movie',
  overview: 'A deterministic emulator record.',
  posterPath: null,
  releaseYear: '1999',
  savedAt: '2026-08-10T00:00:00.000Z',
  title: 'Fixture Film',
  updatedAt: '2026-08-10T00:00:00.000Z',
  userRating: null,
}

const validTvProgressRecord = {
  ...validRecord,
  id: 1396,
  mediaType: 'tv',
  title: 'Fixture Series',
  tvProgress: {
    resumeEpisode: {
      episodeNumber: 2,
      name: 'The second transmission',
      seasonNumber: 1,
      stillPath: null,
    },
    updatedAt: '2026-08-11T08:00:00.000Z',
    watchedEpisodeKeys: ['1:1'],
  },
}

const validPreferences = {
  favoriteGenres: ['drama', 'mystery'],
  preferredLanguage: 'si',
  preferredMedia: 'movie',
  updatedAt: '2026-08-11T10:00:00.000Z',
}

const validRecommendationFeedback = {
  notInterestedRecordKeys: ['movie:550', 'tv:1399'],
  updatedAt: '2026-08-11T12:00:00.000Z',
}

function getFirestoreEmulatorAddress(): {
  host: string
  port: number
} {
  const address =
    process.env.FIRESTORE_EMULATOR_HOST ??
    '127.0.0.1:8080'
  const separatorIndex = address.lastIndexOf(':')
  const host = address.slice(0, separatorIndex)
  const port = Number(address.slice(separatorIndex + 1))

  if (!host || !Number.isInteger(port) || port <= 0) {
    throw new Error(
      `Invalid FIRESTORE_EMULATOR_HOST value: ${address}`,
    )
  }

  return { host, port }
}

describe('Firestore account data security rules', () => {
  let testEnvironment: RulesTestEnvironment

  beforeAll(async () => {
    const { host, port } = getFirestoreEmulatorAddress()
    const rules = await readFile(
      new URL('../../firestore.rules', import.meta.url),
      'utf8',
    )

    testEnvironment = await initializeTestEnvironment({
      firestore: { host, port, rules },
      projectId: PROJECT_ID,
    })
  })

  beforeEach(async () => {
    await testEnvironment.clearFirestore()
  })

  afterAll(async () => {
    await testEnvironment.cleanup()
  })

  test('allows an owner to create, query, update, read, and delete a valid record', async () => {
    const ownerFirestore = testEnvironment
      .authenticatedContext(OWNER_ID)
      .firestore()
    const recordDocument = doc(
      ownerFirestore,
      RECORD_PATH,
    )

    await assertSucceeds(
      setDoc(recordDocument, validRecord),
    )

    const librarySnapshot = await assertSucceeds(
      getDocs(
        collection(
          ownerFirestore,
          `users/${OWNER_ID}/library`,
        ),
      ),
    )
    expect(librarySnapshot.docs).toHaveLength(1)

    await assertSucceeds(
      updateDoc(recordDocument, {
        isFavorite: true,
        updatedAt: '2026-08-10T01:00:00.000Z',
        userRating: 9,
      }),
    )

    const updatedRecord = await assertSucceeds(
      getDoc(recordDocument),
    )
    expect(updatedRecord.data()).toMatchObject({
      isFavorite: true,
      userRating: 9,
    })

    await assertSucceeds(deleteDoc(recordDocument))
    expect(
      (await assertSucceeds(getDoc(recordDocument))).exists(),
    ).toBe(false)
  })

  test('accepts bounded TV progress while preserving legacy records without it', async () => {
    const ownerFirestore = testEnvironment
      .authenticatedContext(OWNER_ID)
      .firestore()

    await assertSucceeds(
      setDoc(
        doc(
          ownerFirestore,
          `users/${OWNER_ID}/library/tv:1396`,
        ),
        validTvProgressRecord,
      ),
    )
    await assertSucceeds(
      setDoc(
        doc(ownerFirestore, RECORD_PATH),
        validRecord,
      ),
    )
  })

  test('allows an owner to manage one valid discovery preference document', async () => {
    const ownerFirestore = testEnvironment
      .authenticatedContext(OWNER_ID)
      .firestore()
    const preferenceDocument = doc(
      ownerFirestore,
      PREFERENCES_PATH,
    )

    await assertSucceeds(
      setDoc(preferenceDocument, validPreferences),
    )
    await assertSucceeds(getDoc(preferenceDocument))
    await assertSucceeds(
      updateDoc(preferenceDocument, {
        favoriteGenres: ['drama', 'comedy'],
        preferredMedia: 'tv',
        updatedAt: '2026-08-11T11:00:00.000Z',
      }),
    )
    await assertSucceeds(deleteDoc(preferenceDocument))
  })

  test('allows an owner to manage one bounded recommendation feedback document', async () => {
    const ownerFirestore = testEnvironment
      .authenticatedContext(OWNER_ID)
      .firestore()
    const feedbackDocument = doc(
      ownerFirestore,
      RECOMMENDATION_FEEDBACK_PATH,
    )

    await assertSucceeds(
      setDoc(
        feedbackDocument,
        validRecommendationFeedback,
      ),
    )
    await assertSucceeds(getDoc(feedbackDocument))
    await assertSucceeds(
      updateDoc(feedbackDocument, {
        notInterestedRecordKeys: ['movie:551'],
        updatedAt: '2026-08-11T13:00:00.000Z',
      }),
    )
    await assertSucceeds(deleteDoc(feedbackDocument))
  })

  test('denies anonymous, cross-user, and unexpected preference-document access', async () => {
    const anonymousFirestore = testEnvironment
      .unauthenticatedContext()
      .firestore()
    const otherFirestore = testEnvironment
      .authenticatedContext(OTHER_USER_ID)
      .firestore()
    const ownerFirestore = testEnvironment
      .authenticatedContext(OWNER_ID)
      .firestore()

    await assertFails(
      setDoc(
        doc(anonymousFirestore, PREFERENCES_PATH),
        validPreferences,
      ),
    )
    await assertFails(
      getDoc(doc(otherFirestore, PREFERENCES_PATH)),
    )
    await assertFails(
      setDoc(
        doc(
          anonymousFirestore,
          RECOMMENDATION_FEEDBACK_PATH,
        ),
        validRecommendationFeedback,
      ),
    )
    await assertFails(
      getDoc(
        doc(
          otherFirestore,
          RECOMMENDATION_FEEDBACK_PATH,
        ),
      ),
    )
    await assertFails(
      setDoc(
        doc(
          ownerFirestore,
          `users/${OWNER_ID}/preferences/unexpected`,
        ),
        validPreferences,
      ),
    )
  })

  test.each([
    [
      'more than five genres',
      {
        ...validPreferences,
        favoriteGenres: [
          'action',
          'animation',
          'comedy',
          'crime',
          'drama',
          'mystery',
        ],
      },
    ],
    [
      'duplicate genres',
      {
        ...validPreferences,
        favoriteGenres: ['drama', 'drama'],
      },
    ],
    [
      'an unsupported genre',
      {
        ...validPreferences,
        favoriteGenres: ['drama', 'reality'],
      },
    ],
    [
      'an unsupported language',
      { ...validPreferences, preferredLanguage: 'xx' },
    ],
    [
      'an unsupported media preference',
      { ...validPreferences, preferredMedia: 'person' },
    ],
    [
      'an unexpected field',
      { ...validPreferences, injected: true },
    ],
  ])('rejects preferences with %s', async (_description, record) => {
    const ownerFirestore = testEnvironment
      .authenticatedContext(OWNER_ID)
      .firestore()

    await assertFails(
      setDoc(
        doc(ownerFirestore, PREFERENCES_PATH),
        record,
      ),
    )
  })

  test.each([
    [
      'more than one hundred record keys',
      {
        ...validRecommendationFeedback,
        notInterestedRecordKeys: Array.from(
          { length: 101 },
          (_value, index) => `movie:${index + 1}`,
        ),
      },
    ],
    [
      'duplicate record keys',
      {
        ...validRecommendationFeedback,
        notInterestedRecordKeys: ['movie:550', 'movie:550'],
      },
    ],
    [
      'an empty timestamp',
      {
        ...validRecommendationFeedback,
        updatedAt: '',
      },
    ],
    [
      'an unexpected field',
      {
        ...validRecommendationFeedback,
        injected: true,
      },
    ],
  ])(
    'rejects recommendation feedback with %s',
    async (_description, feedback) => {
      const ownerFirestore = testEnvironment
        .authenticatedContext(OWNER_ID)
        .firestore()

      await assertFails(
        setDoc(
          doc(
            ownerFirestore,
            RECOMMENDATION_FEEDBACK_PATH,
          ),
          feedback,
        ),
      )
    },
  )

  test('denies every unauthenticated library operation', async () => {
    const anonymousFirestore = testEnvironment
      .unauthenticatedContext()
      .firestore()
    const recordDocument = doc(
      anonymousFirestore,
      RECORD_PATH,
    )

    await assertFails(setDoc(recordDocument, validRecord))
    await assertFails(getDoc(recordDocument))
    await assertFails(deleteDoc(recordDocument))
  })

  test('prevents one authenticated user from accessing another user archive', async () => {
    await testEnvironment.withSecurityRulesDisabled(
      async (context) => {
        await setDoc(
          doc(context.firestore(), RECORD_PATH),
          validRecord,
        )
      },
    )

    const otherFirestore = testEnvironment
      .authenticatedContext(OTHER_USER_ID)
      .firestore()
    const ownerDocument = doc(
      otherFirestore,
      RECORD_PATH,
    )

    await assertFails(getDoc(ownerDocument))
    await assertFails(
      getDocs(
        collection(
          otherFirestore,
          `users/${OWNER_ID}/library`,
        ),
      ),
    )
    await assertFails(
      setDoc(ownerDocument, {
        ...validRecord,
        isFavorite: true,
      }),
    )
    await assertFails(deleteDoc(ownerDocument))
  })

  test.each([
    ['an unexpected field', { ...validRecord, injected: true }],
    ['an invalid media type', { ...validRecord, mediaType: 'person' }],
    ['an invalid rating', { ...validRecord, userRating: 11 }],
    ['an empty title', { ...validRecord, title: '' }],
  ])('rejects %s', async (_description, record) => {
    const ownerFirestore = testEnvironment
      .authenticatedContext(OWNER_ID)
      .firestore()

    await assertFails(
      setDoc(doc(ownerFirestore, RECORD_PATH), record),
    )
  })

  test.each([
    [
      'progress on a movie record',
      { ...validTvProgressRecord, mediaType: 'movie' },
    ],
    [
      'an empty watched-episode list',
      {
        ...validTvProgressRecord,
        tvProgress: {
          ...validTvProgressRecord.tvProgress,
          watchedEpisodeKeys: [],
        },
      },
    ],
    [
      'an unexpected progress field',
      {
        ...validTvProgressRecord,
        tvProgress: {
          ...validTvProgressRecord.tvProgress,
          injected: true,
        },
      },
    ],
    [
      'an oversized watched-episode list',
      {
        ...validTvProgressRecord,
        tvProgress: {
          ...validTvProgressRecord.tvProgress,
          watchedEpisodeKeys: Array.from(
            { length: 2_001 },
            (_value, index) => `1:${index + 1}`,
          ),
        },
      },
    ],
  ])('rejects %s', async (_description, record) => {
    const ownerFirestore = testEnvironment
      .authenticatedContext(OWNER_ID)
      .firestore()

    await assertFails(
      setDoc(
        doc(
          ownerFirestore,
          `users/${OWNER_ID}/library/tv:1396`,
        ),
        record,
      ),
    )
  })
})
