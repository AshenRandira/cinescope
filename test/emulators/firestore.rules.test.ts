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

describe('Firestore library security rules', () => {
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
})
