import { describe, expect, it } from 'vitest'

import { getRouteMetadata } from './documentMetadata'

describe('document metadata', () => {
  it('keeps public editorial and policy routes indexable', () => {
    expect(getRouteMetadata('/').indexable).toBe(true)
    expect(getRouteMetadata('/movies/550').indexable).toBe(true)
    expect(getRouteMetadata('/tv/1399/season/1').indexable).toBe(
      true,
    )
    expect(getRouteMetadata('/privacy').indexable).toBe(true)
  })

  it('keeps account, library, search, and unknown routes out of search indexes', () => {
    expect(getRouteMetadata('/profile').indexable).toBe(false)
    expect(getRouteMetadata('/library').indexable).toBe(false)
    expect(getRouteMetadata('/search').indexable).toBe(false)
    expect(getRouteMetadata('/missing').indexable).toBe(false)
    expect(getRouteMetadata('/movies-and-more').indexable).toBe(false)
  })

  it('provides specific descriptions for catalogue records', () => {
    expect(getRouteMetadata('/movies/550').description).toContain(
      'movie records',
    )
    expect(getRouteMetadata('/tv/1399').description).toContain(
      'television series',
    )
    expect(getRouteMetadata('/people/287').description).toContain(
      'contributor record',
    )
  })
})
