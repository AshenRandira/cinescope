import type {
  FirebaseOptions,
} from 'firebase/app'
import type { Auth } from 'firebase/auth'

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

let authPromise: Promise<Auth | null> | null = null

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
    const [firebaseApp, firebaseAuth] =
      await Promise.all([
        import('firebase/app'),
        import('firebase/auth'),
      ])
    const existingApp = firebaseApp
      .getApps()
      .find((app) => app.name === FIREBASE_APP_NAME)

    if (existingApp) {
      return firebaseAuth.getAuth(existingApp)
    }

    const app = firebaseApp.initializeApp(
      getFirebaseOptions(),
      FIREBASE_APP_NAME,
    )
    const auth = firebaseAuth.initializeAuth(app, {
      persistence: firebaseAuth.browserLocalPersistence,
    })

    auth.useDeviceLanguage()

    return auth
  })()

  return authPromise
}
