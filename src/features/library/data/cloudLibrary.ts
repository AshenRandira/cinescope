import { getFirebaseFirestore } from '../../../config/firebase'

import {
  getLibraryRecordKey,
  parseLibraryRecord,
  type LibraryMediaType,
  type LibraryRecord,
} from './library'

export type CloudLibraryChange = {
  record: LibraryRecord | null
  recordKey: string
  type: 'added' | 'modified' | 'removed'
}

type CloudLibrarySubscription = {
  onChange: (changes: CloudLibraryChange[]) => void
  onError: (error: unknown) => void
}

async function getLibraryCollection(userId: string) {
  const [firestore, firebaseFirestore] =
    await Promise.all([
      getFirebaseFirestore(),
      import('firebase/firestore'),
    ])

  if (!firestore) {
    throw new Error(
      'Firebase is not configured for cloud library sync.',
    )
  }

  return {
    collection: firebaseFirestore.collection(
      firestore,
      'users',
      userId,
      'library',
    ),
    firebaseFirestore,
  }
}

export async function loadCloudLibrary(
  userId: string,
): Promise<LibraryRecord[]> {
  const { collection, firebaseFirestore } =
    await getLibraryCollection(userId)
  const snapshot = await firebaseFirestore.getDocs(
    collection,
  )

  return snapshot.docs
    .map((document) =>
      parseLibraryRecord(document.data()),
    )
    .filter(
      (record): record is LibraryRecord =>
        record !== null,
    )
}

export async function saveCloudLibraryRecord(
  userId: string,
  record: LibraryRecord,
): Promise<void> {
  const { collection, firebaseFirestore } =
    await getLibraryCollection(userId)
  const document = firebaseFirestore.doc(
    collection,
    getLibraryRecordKey(record.mediaType, record.id),
  )

  await firebaseFirestore.setDoc(document, record)
}

export async function deleteCloudLibraryRecord(
  userId: string,
  mediaType: LibraryMediaType,
  id: number,
): Promise<void> {
  const { collection, firebaseFirestore } =
    await getLibraryCollection(userId)
  const document = firebaseFirestore.doc(
    collection,
    getLibraryRecordKey(mediaType, id),
  )

  await firebaseFirestore.deleteDoc(document)
}

export async function subscribeToCloudLibrary(
  userId: string,
  subscription: CloudLibrarySubscription,
): Promise<() => void> {
  const { collection, firebaseFirestore } =
    await getLibraryCollection(userId)

  return firebaseFirestore.onSnapshot(
    collection,
    (snapshot) => {
      const changes = snapshot.docChanges().map((change) => ({
        record:
          change.type === 'removed'
            ? null
            : parseLibraryRecord(change.doc.data()),
        recordKey: change.doc.id,
        type: change.type,
      }))

      subscription.onChange(changes)
    },
    subscription.onError,
  )
}
