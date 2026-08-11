import { useContext } from 'react'

import { RecommendationFeedbackContext } from '../context/RecommendationFeedbackContext'

export function useRecommendationFeedback() {
  const context = useContext(
    RecommendationFeedbackContext,
  )

  if (!context) {
    throw new Error(
      'useRecommendationFeedback must be used within RecommendationFeedbackProvider.',
    )
  }

  return context
}
