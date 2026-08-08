import type {
  FirebaseApp,
  FirebaseOptions,
} from 'firebase/app'
import type { Auth } from 'firebase/auth'
import type { Firestore } from 'firebase/firestore'

const FIREBASE_APP_NAME = 'cinescope-web'

export const FIREBASE_REQUIRED_ENV_NAMES = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_APP_ID',
] as const

export type FirebaseEnvironmentName =
  (typeof FIREBASE_REQUIRED_ENV_NAMES)[number]

function getFirebaseEnvironmentValue(
  name: FirebaseEnvironmentName,
): string {
  return import.meta.env[name]?.trim() ?? ''
}

export const missingFirebaseEnvironmentNames =
  FIREBASE_REQUIRED_ENV_NAMES.filter(
    (name) => !getFirebaseEnvironmentValue(name),
  )

export const isFirebaseConfigured =
  missingFirebaseEnvironmentNames.length === 0

let appPromise: Promise<FirebaseApp | null> | null = null
let authPromise: Promise<Auth | null> | null = null
let firestorePromise: Promise<Firestore | null> | null =
  null

function getFirebaseOptions(): FirebaseOptions {
  return {
    apiKey: getFirebaseEnvironmentValue(
      'VITE_FIREBASE_API_KEY',
    ),
    appId: getFirebaseEnvironmentValue(
      'VITE_FIREBASE_APP_ID',
    ),
    authDomain: getFirebaseEnvironmentValue(
      'VITE_FIREBASE_AUTH_DOMAIN',
    ),
    projectId: getFirebaseEnvironmentValue(
      'VITE_FIREBASE_PROJECT_ID',
    ),
  }
}

export async function getFirebaseAuth(): Promise<Auth | null> {
  if (!isFirebaseConfigured) {
    return null
  }

  if (authPromise) {
    return authPromise
  }

  authPromise = (async () => {
    const [app, firebaseAuth] = await Promise.all([
      getFirebaseApp(),
      import('firebase/auth'),
    ])

    if (!app) return null

    const auth = firebaseAuth.getAuth(app)

    await firebaseAuth.setPersistence(
      auth,
      firebaseAuth.browserLocalPersistence,
    )

    auth.useDeviceLanguage()

    return auth
  })()

  return authPromise
}

async function getFirebaseApp(): Promise<FirebaseApp | null> {
  if (!isFirebaseConfigured) {
    return null
  }

  if (appPromise) {
    return appPromise
  }

  appPromise = (async () => {
    const firebaseApp = await import('firebase/app')
    const existingApp = firebaseApp
      .getApps()
      .find((app) => app.name === FIREBASE_APP_NAME)

    return (
      existingApp ??
      firebaseApp.initializeApp(
        getFirebaseOptions(),
        FIREBASE_APP_NAME,
      )
    )
  })()

  return appPromise
}

export async function getFirebaseFirestore(): Promise<Firestore | null> {
  if (!isFirebaseConfigured) {
    return null
  }

  if (firestorePromise) {
    return firestorePromise
  }

  firestorePromise = (async () => {
    const [app, firebaseFirestore] =
      await Promise.all([
        getFirebaseApp(),
        import('firebase/firestore'),
      ])

    return app
      ? firebaseFirestore.getFirestore(app)
      : null
  })()

  return firestorePromise
}
