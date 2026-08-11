import { getFirebaseFirestore } from '../../../config/firebase'

import {
  parseRecommendationFeedback,
  type RecommendationFeedback,
} from './recommendationFeedback'

type CloudFeedbackSubscription = {
  onChange: (
    feedback: RecommendationFeedback | null,
  ) => void
  onError: (error: unknown) => void
}

async function getFeedbackDocument(userId: string) {
  const [firestore, firebaseFirestore] =
    await Promise.all([
      getFirebaseFirestore(),
      import('firebase/firestore'),
    ])

  if (!firestore) {
    throw new Error(
      'Firebase is not configured for recommendation feedback sync.',
    )
  }

  return {
    document: firebaseFirestore.doc(
      firestore,
      'users',
      userId,
      'preferences',
      'recommendations',
    ),
    firebaseFirestore,
  }
}

export async function loadCloudRecommendationFeedback(
  userId: string,
): Promise<RecommendationFeedback | null> {
  const { document, firebaseFirestore } =
    await getFeedbackDocument(userId)
  const snapshot = await firebaseFirestore.getDoc(document)

  return snapshot.exists()
    ? parseRecommendationFeedback(snapshot.data())
    : null
}

export async function saveCloudRecommendationFeedback(
  userId: string,
  feedback: RecommendationFeedback,
): Promise<void> {
  const { document, firebaseFirestore } =
    await getFeedbackDocument(userId)

  await firebaseFirestore.setDoc(document, feedback)
}

export async function subscribeToCloudRecommendationFeedback(
  userId: string,
  subscription: CloudFeedbackSubscription,
): Promise<() => void> {
  const { document, firebaseFirestore } =
    await getFeedbackDocument(userId)

  return firebaseFirestore.onSnapshot(
    document,
    (snapshot) => {
      subscription.onChange(
        snapshot.exists()
          ? parseRecommendationFeedback(
              snapshot.data(),
            )
          : null,
      )
    },
    subscription.onError,
  )
}
