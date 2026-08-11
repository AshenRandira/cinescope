import { getFirebaseFirestore } from '../../../config/firebase'

import {
  parseUserPreferences,
  type UserPreferences,
} from './preferences'

type CloudPreferenceSubscription = {
  onChange: (preferences: UserPreferences | null) => void
  onError: (error: unknown) => void
}

async function getPreferenceDocument(userId: string) {
  const [firestore, firebaseFirestore] =
    await Promise.all([
      getFirebaseFirestore(),
      import('firebase/firestore'),
    ])

  if (!firestore) {
    throw new Error(
      'Firebase is not configured for preference sync.',
    )
  }

  return {
    document: firebaseFirestore.doc(
      firestore,
      'users',
      userId,
      'preferences',
      'discovery',
    ),
    firebaseFirestore,
  }
}

export async function loadCloudPreferences(
  userId: string,
): Promise<UserPreferences | null> {
  const { document, firebaseFirestore } =
    await getPreferenceDocument(userId)
  const snapshot = await firebaseFirestore.getDoc(document)

  return snapshot.exists()
    ? parseUserPreferences(snapshot.data())
    : null
}

export async function saveCloudPreferences(
  userId: string,
  preferences: UserPreferences,
): Promise<void> {
  const { document, firebaseFirestore } =
    await getPreferenceDocument(userId)

  await firebaseFirestore.setDoc(document, preferences)
}

export async function subscribeToCloudPreferences(
  userId: string,
  subscription: CloudPreferenceSubscription,
): Promise<() => void> {
  const { document, firebaseFirestore } =
    await getPreferenceDocument(userId)

  return firebaseFirestore.onSnapshot(
    document,
    (snapshot) => {
      subscription.onChange(
        snapshot.exists()
          ? parseUserPreferences(snapshot.data())
          : null,
      )
    },
    subscription.onError,
  )
}
