import { describe, expect, it } from 'vitest'

import { validateTmdbRequest } from './allowlist.js'

describe('TMDB route and query allowlist', () => {
  it.each([
    ['/genre/movie/list', 'language=en-US'],
    [
      '/discover/movie',
      'include_adult=false&include_video=false&language=en-US&page=2&sort_by=vote_average.desc&vote_average.gte=6.4&vote_count.gte=250&with_genres=18%7C9648&without_genres=28&primary_release_date.lte=2026-08-10&with_runtime.lte=120',
    ],
    [
      '/discover/tv',
      'include_adult=false&language=en-US&page=1&sort_by=vote_average.desc&vote_count.gte=300',
    ],
    ['/trending/all/week', 'language=en-US&page=1'],
    ['/movie/now_playing', 'language=en-US&page=1'],
    ['/tv/on_the_air', 'language=en-US&page=1&timezone=Asia%2FColombo'],
    [
      '/movie/550',
      'append_to_response=credits%2Cvideos%2Crecommendations&language=en-US',
    ],
    ['/movie/550/watch/providers', ''],
    ['/movie/550/recommendations', 'language=en-US&page=1'],
    [
      '/tv/1399/season/1/episode/1',
      'append_to_response=credits%2Cimages%2Cvideos&language=en-US',
    ],
    [
      '/person/287',
      'append_to_response=combined_credits%2Cimages%2Cexternal_ids&language=en-US',
    ],
    [
      '/search/multi',
      'include_adult=false&language=en-US&page=1&query=Fight+Club',
    ],
  ])('accepts the application contract %s', (path, query) => {
    expect(
      validateTmdbRequest(path, new URLSearchParams(query)),
    ).toMatchObject({ upstreamPath: path })
  })

  it.each([
    ['/configuration', ''],
    ['/movie/../../configuration', ''],
    ['/movie/not-a-number', ''],
    ['/search/multi', 'query=a'],
    ['/search/multi', 'query=film&page=0'],
    ['/discover/movie', 'api_key=secret'],
    ['/discover/movie', 'include_adult=true'],
    ['/movie/550', 'append_to_response=account_states'],
    ['/movie/550', 'language=en-US&language=fr-FR'],
  ])('rejects unsupported input %s', (path, query) => {
    expect(() =>
      validateTmdbRequest(path, new URLSearchParams(query)),
    ).toThrow()
  })

  it('uses canonical query ordering for stable cache keys', () => {
    const first = validateTmdbRequest(
      '/movie/popular',
      new URLSearchParams('page=1&language=en-US'),
    )
    const second = validateTmdbRequest(
      '/movie/popular',
      new URLSearchParams('language=en-US&page=1'),
    )

    expect(first.cacheKey).toBe(second.cacheKey)
  })
})
