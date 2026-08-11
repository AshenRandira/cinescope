import {
  expect,
  test,
  type APIRequestContext,
} from '@playwright/test'

import { installPublicApiFixtures } from '../fixtures.js'

const PROJECT_ID = 'demo-cinescope'
const AUTH_EMULATOR_URL = 'http://127.0.0.1:9599'
const FIRESTORE_EMULATOR_URL = 'http://127.0.0.1:8080'
const FIREBASE_API_KEY = 'demo-api-key'
const TEST_PASSWORD = 'EmulatorPass123!'

type AuthSession = {
  idToken: string
  localId: string
}

type FirestoreField = {
  arrayValue?: { values?: FirestoreField[] }
  booleanValue?: boolean
  integerValue?: string
  mapValue?: { fields?: FirestoreFields }
  nullValue?: null
  stringValue?: string
}

type FirestoreFields = Record<string, FirestoreField>

async function resetFirebaseEmulators(
  request: APIRequestContext,
): Promise<void> {
  const [authResponse, firestoreResponse] =
    await Promise.all([
      request.delete(
        `${AUTH_EMULATOR_URL}/emulator/v1/projects/${PROJECT_ID}/accounts`,
      ),
      request.delete(
        `${FIRESTORE_EMULATOR_URL}/emulator/v1/projects/${PROJECT_ID}/databases/(default)/documents`,
      ),
    ])

  expect(
    authResponse.ok(),
    await authResponse.text(),
  ).toBe(true)
  expect(
    firestoreResponse.ok(),
    await firestoreResponse.text(),
  ).toBe(true)
}

async function submitAuthRequest(
  request: APIRequestContext,
  operation: 'signInWithPassword' | 'signUp',
  email: string,
  displayName?: string,
  password = TEST_PASSWORD,
): Promise<AuthSession> {
  const response = await request.post(
    `${AUTH_EMULATOR_URL}/identitytoolkit.googleapis.com/v1/accounts:${operation}?key=${FIREBASE_API_KEY}`,
    {
      data: {
        displayName,
        email,
        password,
        returnSecureToken: true,
      },
    },
  )

  if (!response.ok()) {
    throw new Error(
      `Auth emulator ${operation} failed: ${await response.text()}`,
    )
  }

  return (await response.json()) as AuthSession
}

function getLibraryDocumentUrl(
  userId: string,
  recordKey = 'movie:550',
): string {
  return `${FIRESTORE_EMULATOR_URL}/v1/projects/${PROJECT_ID}/databases/(default)/documents/users/${userId}/library/${encodeURIComponent(recordKey)}`
}

async function readLibraryDocument(
  request: APIRequestContext,
  session: AuthSession,
  recordKey = 'movie:550',
): Promise<{
  fields: FirestoreFields | null
  status: number
}> {
  const response = await request.get(
    getLibraryDocumentUrl(session.localId, recordKey),
    {
      headers: {
        Authorization: `Bearer ${session.idToken}`,
      },
    },
  )

  if (!response.ok()) {
    return { fields: null, status: response.status() }
  }

  const body = (await response.json()) as {
    fields?: FirestoreFields
  }

  return {
    fields: body.fields ?? null,
    status: response.status(),
  }
}

async function expectCloudRecord(
  request: APIRequestContext,
  session: AuthSession,
  predicate: (fields: FirestoreFields) => boolean,
  recordKey = 'movie:550',
): Promise<void> {
  await expect
    .poll(
      async () => {
        const { fields, status } =
          await readLibraryDocument(
            request,
            session,
            recordKey,
          )

        return status === 200 && fields
          ? predicate(fields)
          : false
      },
      { timeout: 10_000 },
    )
    .toBe(true)
}

test.beforeEach(async ({ page, request }) => {
  await resetFirebaseEmulators(request)
  await installPublicApiFixtures(page, {
    clearStorage: false,
  })
})

test('migrates a guest save into the new member cloud archive', async ({
  page,
  request,
}) => {
  const email = 'guest-migration@example.test'

  await page.goto('/movies/550', {
    waitUntil: 'domcontentloaded',
  })
  await page
    .getByRole('button', { name: 'Save to library' })
    .click()
  await expect(
    page.getByRole('button', {
      name: 'Saved to library',
    }),
  ).toBeVisible()

  await page.goto('/register', {
    waitUntil: 'domcontentloaded',
  })
  await page.getByLabel('Display name').fill('Guest Migrator')
  await page.getByLabel('Email address').fill(email)
  await page.getByLabel('Password', { exact: true }).fill(TEST_PASSWORD)
  await page.getByLabel('Confirm password').fill(TEST_PASSWORD)
  await page
    .getByRole('button', {
      name: 'Create CineScope account',
    })
    .click()

  await expect(page).toHaveURL(/\/profile$/, {
    timeout: 15_000,
  })
  await expect(
    page.getByRole('heading', {
      level: 1,
      name: 'Guest Migrator',
    }),
  ).toBeVisible()

  const session = await submitAuthRequest(
    request,
    'signInWithPassword',
    email,
  )

  await expectCloudRecord(
    request,
    session,
    (fields) =>
      fields.title?.stringValue === 'Fixture Film' &&
      fields.isFavorite?.booleanValue === false,
  )

  const storageState = await page.evaluate((userId) => {
    const browserGlobal = globalThis as typeof globalThis & {
      localStorage: {
        getItem: (key: string) => string | null
      }
    }

    return {
      guest: browserGlobal.localStorage.getItem(
        'cinescope.library.v1',
      ),
      member: browserGlobal.localStorage.getItem(
        `cinescope.library.v1.user.${encodeURIComponent(userId)}`,
      ),
    }
  }, session.localId)

  expect(storageState.guest).toBeNull()
  expect(storageState.member).toContain('Fixture Film')
})

test('returns to a protected route and preserves signed-in library edits through reconnect and reload', async ({
  context,
  page,
  request,
}) => {
  const email = 'member-persistence@example.test'
  const session = await submitAuthRequest(
    request,
    'signUp',
    email,
    'Persistent Member',
  )

  await page.goto('/profile?panel=identity', {
    waitUntil: 'domcontentloaded',
  })
  await expect(page).toHaveURL(/\/login$/)

  await page.getByLabel('Email address').fill(email)
  await page.getByLabel('Password').fill(TEST_PASSWORD)
  await page
    .getByRole('button', {
      name: 'Sign in to CineScope',
    })
    .click()

  await expect(page).toHaveURL(
    /\/profile\?panel=identity$/,
  )
  await expect(
    page.getByText('Firebase session active'),
  ).toBeVisible()

  await page.goto('/movies/550', {
    waitUntil: 'domcontentloaded',
  })
  await page
    .getByRole('button', { name: 'Save to library' })
    .click()
  await expectCloudRecord(
    request,
    session,
    (fields) =>
      fields.title?.stringValue === 'Fixture Film',
  )

  await page
    .getByRole('button', { name: 'Mark watched' })
    .click()
  await expectCloudRecord(
    request,
    session,
    (fields) => fields.isWatched?.booleanValue === true,
  )

  await page
    .getByRole('button', { name: 'Mark favourite' })
    .click()
  await expectCloudRecord(
    request,
    session,
    (fields) => fields.isFavorite?.booleanValue === true,
  )

  await page
    .getByLabel('Your rating for Fixture Film')
    .selectOption('9')
  await expectCloudRecord(
    request,
    session,
    (fields) => fields.userRating?.integerValue === '9',
  )

  await page.evaluate((userId) => {
    const browserGlobal = globalThis as typeof globalThis & {
      localStorage: { removeItem: (key: string) => void }
    }

    browserGlobal.localStorage.removeItem(
      `cinescope.library.v1.user.${encodeURIComponent(userId)}`,
    )
  }, session.localId)
  await page.reload({ waitUntil: 'domcontentloaded' })

  await expect(
    page.getByRole('button', {
      name: 'Saved to library',
    }),
  ).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Watched' }),
  ).toHaveAttribute('aria-pressed', 'true')
  await expect(
    page.getByRole('button', { name: 'Favourite' }),
  ).toHaveAttribute('aria-pressed', 'true')
  await expect(
    page.getByLabel('Your rating for Fixture Film'),
  ).toHaveValue('9')

  await context.setOffline(true)
  await page
    .getByRole('button', { name: 'Favourite' })
    .click()
  await expect(
    page.getByRole('button', { name: 'Mark favourite' }),
  ).toHaveAttribute('aria-pressed', 'false')
  await context.setOffline(false)

  await expectCloudRecord(
    request,
    session,
    (fields) => fields.isFavorite?.booleanValue === false,
  )

  await page
    .getByRole('button', { name: 'Saved to library' })
    .click()
  await expect
    .poll(
      async () =>
        (await readLibraryDocument(request, session))
          .status,
      { timeout: 10_000 },
    )
    .toBe(404)
})

test('syncs TV episode progress and restores the continue-watching checkpoint', async ({
  page,
  request,
}) => {
  const email = 'tv-progress@example.test'
  const session = await submitAuthRequest(
    request,
    'signUp',
    email,
    'Progress Member',
  )

  await page.goto('/login', {
    waitUntil: 'domcontentloaded',
  })
  await page.getByLabel('Email address').fill(email)
  await page.getByLabel('Password').fill(TEST_PASSWORD)
  await page
    .getByRole('button', { name: 'Sign in to CineScope' })
    .click()
  await expect(page).toHaveURL(/\/profile$/)

  await page.goto('/tv/1399/season/1', {
    waitUntil: 'domcontentloaded',
  })
  await page
    .getByRole('button', {
      name: 'Record S01E01 watched',
    })
    .click()

  await expectCloudRecord(
    request,
    session,
    (fields) => {
      const progress =
        fields.tvProgress?.mapValue?.fields
      const watchedEpisodeKeys =
        progress?.watchedEpisodeKeys?.arrayValue?.values

      return (
        watchedEpisodeKeys?.[0]?.stringValue === '1:1' &&
        progress?.resumeEpisode?.mapValue?.fields
          ?.episodeNumber?.integerValue === '2'
      )
    },
    'tv:1399',
  )

  await page.reload({ waitUntil: 'domcontentloaded' })
  await expect(
    page.getByText(
      '1 of 2 episodes watched — 50% complete.',
    ),
  ).toBeVisible()

  await page.goto('/library', {
    waitUntil: 'domcontentloaded',
  })
  await expect(
    page
      .getByRole('link')
      .filter({ hasText: 'The Second Transmission' }),
  ).toBeVisible()
})

test('changes a password and permanently deletes account data behind fresh credentials', async ({
  page,
  request,
}) => {
  const email = 'account-security@example.test'
  const newPassword = 'NewEmulatorPass456!'
  const session = await submitAuthRequest(
    request,
    'signUp',
    email,
    'Security Member',
  )

  await page.goto('/login', {
    waitUntil: 'domcontentloaded',
  })
  await page.getByLabel('Email address').fill(email)
  await page.getByLabel('Password').fill(TEST_PASSWORD)
  await page
    .getByRole('button', { name: 'Sign in to CineScope' })
    .click()
  await expect(page).toHaveURL(/\/profile$/)

  await page.goto('/movies/550', {
    waitUntil: 'domcontentloaded',
  })
  await page
    .getByRole('button', { name: 'Save to library' })
    .click()
  await expectCloudRecord(
    request,
    session,
    (fields) => fields.title?.stringValue === 'Fixture Film',
  )

  await page.goto('/profile', {
    waitUntil: 'domcontentloaded',
  })
  const passwordCard = page
    .getByRole('article')
    .filter({
      has: page.getByRole('heading', {
        name: 'Change the access key.',
      }),
    })

  await passwordCard
    .getByLabel('Current password')
    .fill(TEST_PASSWORD)
  await passwordCard
    .getByLabel('New password', { exact: true })
    .fill(newPassword)
  await passwordCard
    .getByLabel('Confirm new password')
    .fill(newPassword)
  await passwordCard
    .getByRole('button', { name: 'Change password' })
    .click()
  await expect(
    passwordCard.getByText(
      'Your password was changed securely.',
    ),
  ).toBeVisible()

  const oldPasswordResponse = await request.post(
    `${AUTH_EMULATOR_URL}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`,
    {
      data: {
        email,
        password: TEST_PASSWORD,
        returnSecureToken: true,
      },
    },
  )

  expect(oldPasswordResponse.ok()).toBe(false)

  const dangerCard = page
    .getByRole('article')
    .filter({
      has: page.getByRole('heading', {
        name: 'Close the archive.',
      }),
    })

  await dangerCard
    .getByLabel('Current password')
    .fill(newPassword)
  await dangerCard
    .getByLabel('Type DELETE MY ACCOUNT to confirm')
    .fill('DELETE MY ACCOUNT')
  await dangerCard
    .getByRole('button', {
      name: 'Permanently delete my account',
    })
    .click()

  await expect(page).toHaveURL(/\/login$/, {
    timeout: 15_000,
  })
  await expect(
    page.getByText(
      'Your CineScope account and archive were permanently deleted.',
    ),
  ).toBeVisible()

  const deletedAccountResponse = await request.post(
    `${AUTH_EMULATOR_URL}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`,
    {
      data: {
        email,
        password: newPassword,
        returnSecureToken: true,
      },
    },
  )

  expect(deletedAccountResponse.ok()).toBe(false)
  await expect
    .poll(
      async () =>
        (await readLibraryDocument(request, session)).status,
      { timeout: 10_000 },
    )
    .toBe(404)

  const memberStorage = await page.evaluate((userId) => {
    return globalThis.localStorage.getItem(
      `cinescope.library.v1.user.${encodeURIComponent(userId)}`,
    )
  }, session.localId)

  expect(memberStorage).toBeNull()
})
