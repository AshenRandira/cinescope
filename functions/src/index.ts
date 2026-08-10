import { getApps, initializeApp } from 'firebase-admin/app'
import { getAppCheck } from 'firebase-admin/app-check'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
import { logger } from 'firebase-functions'
import {
  defineBoolean,
  defineSecret,
} from 'firebase-functions/params'
import {
  onCall,
  onRequest,
} from 'firebase-functions/v2/https'

import { createDeleteAccountHandler } from './account/deleteAccount.js'
import { createTmdbApiHandler } from './tmdb/proxy.js'

if (getApps().length === 0) initializeApp()

const tmdbReadAccessToken = defineSecret(
  'TMDB_READ_ACCESS_TOKEN',
)
const tmdbAppCheckEnforced = defineBoolean(
  'TMDB_APP_CHECK_ENFORCED',
  { default: false },
)
const accountAppCheckEnforced = defineBoolean(
  'ACCOUNT_APP_CHECK_ENFORCED',
  { default: false },
)
const fixtureToken =
  process.env.CINESCOPE_TMDB_FIXTURE_TOKEN?.trim()

function getUpstreamOrigin(): string {
  if (
    process.env.FUNCTIONS_EMULATOR === 'true' &&
    process.env.TMDB_UPSTREAM_ORIGIN
  ) {
    return process.env.TMDB_UPSTREAM_ORIGIN
  }

  return 'https://api.themoviedb.org/3/'
}

const handler = createTmdbApiHandler({
  enforceAppCheck: () => tmdbAppCheckEnforced.value(),
  getSecret: () =>
    process.env.FUNCTIONS_EMULATOR === 'true' && fixtureToken
      ? fixtureToken
      : tmdbReadAccessToken.value(),
  getUpstreamOrigin,
  logger,
  verifyAppCheck: async (token) => {
    const claims = await getAppCheck().verifyToken(token)
    return { appId: claims.appId }
  },
})

export const tmdbApi = onRequest(
  {
    concurrency: 40,
    cors: false,
    maxInstances: 10,
    memory: '256MiB',
    region: 'asia-east1',
    secrets: fixtureToken ? [] : [tmdbReadAccessToken],
    timeoutSeconds: 15,
  },
  handler,
)

const deleteAccountHandler = createDeleteAccountHandler({
  deleteAuthUser: (userId) =>
    getAuth().deleteUser(userId),
  deleteUserData: (userId) => {
    const firestore = getFirestore()

    return firestore.recursiveDelete(
      firestore.doc(`users/${userId}`),
    )
  },
  logger,
})

export const deleteAccount = onCall(
  {
    consumeAppCheckToken: accountAppCheckEnforced,
    enforceAppCheck: accountAppCheckEnforced,
    maxInstances: 10,
    memory: '256MiB',
    region: 'asia-east1',
    timeoutSeconds: 60,
  },
  deleteAccountHandler,
)
