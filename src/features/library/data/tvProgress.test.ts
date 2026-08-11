import { describe, expect, it } from 'vitest'

import {
  areTvProgressEqual,
  getTvEpisodeProgressKey,
  getTvSeasonProgress,
  isTvEpisodeWatched,
  parseTvProgress,
  setTvEpisodeWatched,
  type TvEpisodePointer,
} from './tvProgress'

const firstEpisode: TvEpisodePointer = {
  episodeNumber: 1,
  name: 'The first transmission',
  seasonNumber: 1,
  stillPath: '/episode-one.jpg',
}

const secondEpisode: TvEpisodePointer = {
  episodeNumber: 2,
  name: 'The second transmission',
  seasonNumber: 1,
  stillPath: null,
}

describe('TV episode progress', () => {
  it('builds stable episode keys and records a resume pointer', () => {
    const progress = setTvEpisodeWatched(
      null,
      firstEpisode,
      secondEpisode,
      true,
      '2026-08-11T08:00:00.000Z',
    )

    expect(getTvEpisodeProgressKey(1, 2)).toBe('1:2')
    expect(progress).toEqual({
      resumeEpisode: secondEpisode,
      updatedAt: '2026-08-11T08:00:00.000Z',
      watchedEpisodeKeys: ['1:1'],
    })
    expect(isTvEpisodeWatched(progress, 1, 1)).toBe(
      true,
    )
  })

  it('makes an unwatched episode the next resume point and removes empty progress', () => {
    const twoEpisodes = setTvEpisodeWatched(
      setTvEpisodeWatched(
        null,
        firstEpisode,
        secondEpisode,
        true,
      ),
      secondEpisode,
      null,
      true,
    )
    const oneEpisode = setTvEpisodeWatched(
      twoEpisodes,
      firstEpisode,
      secondEpisode,
      false,
      '2026-08-11T09:00:00.000Z',
    )

    expect(oneEpisode?.resumeEpisode).toEqual(
      firstEpisode,
    )
    expect(oneEpisode?.watchedEpisodeKeys).toEqual([
      '1:2',
    ])
    expect(
      setTvEpisodeWatched(
        oneEpisode,
        secondEpisode,
        null,
        false,
      ),
    ).toBeNull()
  })

  it('calculates a deterministic season rollup', () => {
    const progress = setTvEpisodeWatched(
      null,
      firstEpisode,
      secondEpisode,
      true,
    )

    expect(
      getTvSeasonProgress(progress, 1, [1, 2, 2, 3]),
    ).toEqual({
      isComplete: false,
      percentage: 33,
      total: 3,
      watched: 1,
    })
  })

  it('parses and normalizes persisted progress while rejecting malformed payloads', () => {
    const parsed = parseTvProgress({
      resumeEpisode: secondEpisode,
      updatedAt: '2026-08-11T08:00:00.000Z',
      watchedEpisodeKeys: ['2:1', '1:2', '1:2'],
    })

    expect(parsed?.watchedEpisodeKeys).toEqual([
      '1:2',
      '2:1',
    ])
    expect(
      parseTvProgress({
        resumeEpisode: null,
        updatedAt: '2026-08-11T08:00:00.000Z',
        watchedEpisodeKeys: ['broken'],
      }),
    ).toBeNull()
  })

  it('compares nested progress without relying on object identity', () => {
    const first = setTvEpisodeWatched(
      null,
      firstEpisode,
      secondEpisode,
      true,
      '2026-08-11T08:00:00.000Z',
    )
    const copy = first
      ? {
          ...first,
          resumeEpisode: first.resumeEpisode
            ? { ...first.resumeEpisode }
            : null,
          watchedEpisodeKeys: [
            ...first.watchedEpisodeKeys,
          ],
        }
      : null

    expect(areTvProgressEqual(first, copy)).toBe(true)
    expect(
      areTvProgressEqual(first, {
        ...copy!,
        watchedEpisodeKeys: ['1:2'],
      }),
    ).toBe(false)
  })
})
