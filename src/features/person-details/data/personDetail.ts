export const PERSON_DETAIL_APPEND_TO_RESPONSE =
  'combined_credits,images,external_ids'

export function parsePersonId(
  routePersonId: string | undefined,
): number | null {
  if (!routePersonId || !/^\d+$/.test(routePersonId)) {
    return null
  }

  const personId = Number(routePersonId)

  if (
    !Number.isSafeInteger(personId) ||
    personId <= 0
  ) {
    return null
  }

  return personId
}

export function getPersonDetailQueryKey(
  personId: number | null,
) {
  return [
    'tmdb',
    'person',
    personId,
    'details',
    'en-US',
  ] as const
}
