import type {
  FirebaseApp,
  FirebaseOptions,
} from 'firebase/app'
import type { Auth } from 'firebase/auth'
import type { AppCheck } from 'firebase/app-check'
import type { Firestore } from 'firebase/firestore'
import type { Functions } from 'firebase/functions'

const FIREBASE_APP_NAME = 'cinescope-web'
export const FIREBASE_FUNCTIONS_REGION = 'asia-east1'
const isEmulatorMode = import.meta.env.MODE === 'emulator'

export const FIREBASE_REQUIRED_ENV_NAMES = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_APP_ID',
] as const

export type FirebaseEnvironmentName =
  (typeof FIREBASE_REQUIRED_ENV_NAMES)[number]

const firebaseEnvironmentValues: Record<
  FirebaseEnvironmentName,
  string | undefined
> = {
  VITE_FIREBASE_API_KEY:
    import.meta.env.VITE_FIREBASE_API_KEY,
  VITE_FIREBASE_APP_ID:
    import.meta.env.VITE_FIREBASE_APP_ID,
  VITE_FIREBASE_AUTH_DOMAIN:
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  VITE_FIREBASE_PROJECT_ID:
    import.meta.env.VITE_FIREBASE_PROJECT_ID,
}

function getFirebaseEnvironmentValue(
  name: FirebaseEnvironmentName,
): string {
  return firebaseEnvironmentValues[name]?.trim() ?? ''
}

export const missingFirebaseEnvironmentNames =
  FIREBASE_REQUIRED_ENV_NAMES.filter(
    (name) => !getFirebaseEnvironmentValue(name),
  )

export const isFirebaseConfigured =
  missingFirebaseEnvironmentNames.length === 0

let appPromise: Promise<FirebaseApp | null> | null = null
let authPromise: Promise<Auth | null> | null = null
let appCheckPromise: Promise<AppCheck | null> | null = null
let firestorePromise: Promise<Firestore | null> | null =
  null
let functionsPromise: Promise<Functions | null> | null =
  null
let isAuthEmulatorConnected = false
let isFirestoreEmulatorConnected = false
let isFunctionsEmulatorConnected = false

function getOptionalEnvironmentValue(
  value: string | undefined,
): string {
  return value?.trim() ?? ''
}

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

    const authEmulatorUrl = getOptionalEnvironmentValue(
      import.meta.env.VITE_FIREBASE_AUTH_EMULATOR_URL,
    )

    if (
      isEmulatorMode &&
      authEmulatorUrl &&
      !isAuthEmulatorConnected
    ) {
      firebaseAuth.connectAuthEmulator(
        auth,
        authEmulatorUrl,
        { disableWarnings: true },
      )
      isAuthEmulatorConnected = true
    }

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

export async function getFirebaseAppCheckToken(): Promise<
  string | null
> {
  const siteKey = getOptionalEnvironmentValue(
    import.meta.env.VITE_FIREBASE_APP_CHECK_SITE_KEY,
  )

  if (!isFirebaseConfigured || !siteKey) {
    return null
  }

  if (!appCheckPromise) {
    appCheckPromise = (async () => {
      const [app, firebaseAppCheck] = await Promise.all([
        getFirebaseApp(),
        import('firebase/app-check'),
      ])

      if (!app) return null

      return firebaseAppCheck.initializeAppCheck(app, {
        isTokenAutoRefreshEnabled: true,
        provider:
          new firebaseAppCheck.ReCaptchaEnterpriseProvider(
            siteKey,
          ),
      })
    })()
  }

  const appCheck = await appCheckPromise

  if (!appCheck) return null

  const { token } = await import('firebase/app-check').then(
    ({ getToken }) => getToken(appCheck),
  )

  return token
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

    if (!app) return null

    const firestore =
      firebaseFirestore.getFirestore(app)
    const firestoreEmulatorHost =
      getOptionalEnvironmentValue(
        import.meta.env.VITE_FIRESTORE_EMULATOR_HOST,
      )
    const firestoreEmulatorPort = Number(
      getOptionalEnvironmentValue(
        import.meta.env.VITE_FIRESTORE_EMULATOR_PORT,
      ),
    )

    if (
      isEmulatorMode &&
      firestoreEmulatorHost &&
      Number.isInteger(firestoreEmulatorPort) &&
      firestoreEmulatorPort > 0 &&
      !isFirestoreEmulatorConnected
    ) {
      firebaseFirestore.connectFirestoreEmulator(
        firestore,
        firestoreEmulatorHost,
        firestoreEmulatorPort,
      )
      isFirestoreEmulatorConnected = true
    }

    return firestore
  })()

  return firestorePromise
}

export async function getFirebaseFunctions(): Promise<Functions | null> {
  if (!isFirebaseConfigured) {
    return null
  }

  if (functionsPromise) {
    return functionsPromise
  }

  functionsPromise = (async () => {
    const [app, firebaseFunctions] =
      await Promise.all([
        getFirebaseApp(),
        import('firebase/functions'),
      ])

    if (!app) return null

    const functions = firebaseFunctions.getFunctions(
      app,
      FIREBASE_FUNCTIONS_REGION,
    )
    const emulatorHost = getOptionalEnvironmentValue(
      import.meta.env.VITE_FIREBASE_FUNCTIONS_EMULATOR_HOST,
    )
    const emulatorPort = Number(
      getOptionalEnvironmentValue(
        import.meta.env.VITE_FIREBASE_FUNCTIONS_EMULATOR_PORT,
      ),
    )

    if (
      isEmulatorMode &&
      emulatorHost &&
      Number.isInteger(emulatorPort) &&
      emulatorPort > 0 &&
      !isFunctionsEmulatorConnected
    ) {
      firebaseFunctions.connectFunctionsEmulator(
        functions,
        emulatorHost,
        emulatorPort,
      )
      isFunctionsEmulatorConnected = true
    }

    return functions
  })()

  return functionsPromise
}
