import {
  getLibraryRecordKey,
  type LibraryMediaType,
} from '../../library/data/library'

export const RECOMMENDATION_FEEDBACK_LIMIT = 100
export const RECOMMENDATION_FEEDBACK_STORAGE_KEY =
  'cinescope.recommendation-feedback.v1'

export type RecommendationFeedback = {
  notInterestedRecordKeys: string[]
  updatedAt: string | null
}

function isObject(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value)
  )
}

export function isRecommendationRecordKey(
  value: unknown,
): value is string {
  return (
    typeof value === 'string' &&
    /^(movie|tv):[1-9]\d*$/.test(value)
  )
}

export function createDefaultRecommendationFeedback(): RecommendationFeedback {
  return {
    notInterestedRecordKeys: [],
    updatedAt: null,
  }
}

export function getRecommendationFeedbackStorageKey(
  userId: string | null,
): string {
  return userId
    ? `${RECOMMENDATION_FEEDBACK_STORAGE_KEY}.user.${encodeURIComponent(
        userId,
      )}`
    : RECOMMENDATION_FEEDBACK_STORAGE_KEY
}

export function parseRecommendationFeedback(
  value: unknown,
): RecommendationFeedback | null {
  if (!isObject(value)) return null

  const keys = Object.keys(value).sort()

  if (
    keys.join('|') !==
    'notInterestedRecordKeys|updatedAt'
  ) {
    return null
  }

  if (
    !Array.isArray(value.notInterestedRecordKeys) ||
    value.notInterestedRecordKeys.length >
      RECOMMENDATION_FEEDBACK_LIMIT ||
    value.notInterestedRecordKeys.some(
      (recordKey) =>
        !isRecommendationRecordKey(recordKey),
    ) ||
    new Set(value.notInterestedRecordKeys).size !==
      value.notInterestedRecordKeys.length ||
    (value.updatedAt !== null &&
      (typeof value.updatedAt !== 'string' ||
        !value.updatedAt ||
        value.updatedAt.length > 100))
  ) {
    return null
  }

  return {
    notInterestedRecordKeys: [
      ...(value.notInterestedRecordKeys as string[]),
    ],
    updatedAt: value.updatedAt as string | null,
  }
}

export function mergeRecommendationFeedback(
  ...feedbackGroups: RecommendationFeedback[]
): RecommendationFeedback {
  const recordKeys = new Set<string>()

  feedbackGroups.forEach((feedback) => {
    feedback.notInterestedRecordKeys.forEach(
      (recordKey) => recordKeys.add(recordKey),
    )
  })

  const notInterestedRecordKeys = [
    ...recordKeys,
  ].slice(-RECOMMENDATION_FEEDBACK_LIMIT)
  const latestTimestamp = feedbackGroups
    .map(({ updatedAt }) => updatedAt)
    .filter(
      (updatedAt): updatedAt is string =>
        updatedAt !== null,
    )
    .sort()
    .at(-1)

  return {
    notInterestedRecordKeys,
    updatedAt: latestTimestamp ?? null,
  }
}

export function addNotInterestedRecord(
  feedback: RecommendationFeedback,
  mediaType: LibraryMediaType,
  id: number,
  updatedAt = new Date().toISOString(),
): RecommendationFeedback {
  const recordKey = getLibraryRecordKey(mediaType, id)

  return {
    notInterestedRecordKeys: [
      ...feedback.notInterestedRecordKeys.filter(
        (candidate) => candidate !== recordKey,
      ),
      recordKey,
    ].slice(-RECOMMENDATION_FEEDBACK_LIMIT),
    updatedAt,
  }
}

export function removeNotInterestedRecord(
  feedback: RecommendationFeedback,
  mediaType: LibraryMediaType,
  id: number,
  updatedAt = new Date().toISOString(),
): RecommendationFeedback {
  const recordKey = getLibraryRecordKey(mediaType, id)

  return {
    notInterestedRecordKeys:
      feedback.notInterestedRecordKeys.filter(
        (candidate) => candidate !== recordKey,
      ),
    updatedAt,
  }
}
