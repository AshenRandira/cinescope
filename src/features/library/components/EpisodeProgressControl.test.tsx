// @vitest-environment jsdom

import '../../../test/setup-dom'

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'

import { LibraryContext } from '../context/LibraryContext'
import type {
  LibraryCandidate,
  LibraryRecord,
  LibraryRecordPatch,
} from '../data/library'
import type { TvEpisodePointer } from '../data/tvProgress'
import { EpisodeProgressControl } from './EpisodeProgressControl'

const candidate: LibraryCandidate = {
  backdropPath: '/series.jpg',
  id: 1396,
  mediaType: 'tv',
  overview: 'A deterministic series fixture.',
  posterPath: '/series-poster.jpg',
  releaseYear: '2008',
  title: 'Fixture Series',
}

const episode: TvEpisodePointer = {
  episodeNumber: 1,
  name: 'Pilot',
  seasonNumber: 1,
  stillPath: '/pilot.jpg',
}

const nextEpisode: TvEpisodePointer = {
  episodeNumber: 2,
  name: 'The second frame',
  seasonNumber: 1,
  stillPath: null,
}

function ProgressHarness() {
  const [record, setRecord] =
    useState<LibraryRecord | null>(null)

  function updateRecord(
    nextCandidate: LibraryCandidate,
    patch: LibraryRecordPatch = {},
  ): void {
    setRecord((currentRecord) => ({
      ...nextCandidate,
      isFavorite: currentRecord?.isFavorite ?? false,
      isWatched:
        patch.isWatched ??
        currentRecord?.isWatched ??
        false,
      savedAt:
        currentRecord?.savedAt ??
        '2026-08-11T00:00:00.000Z',
      tvProgress:
        'tvProgress' in patch
          ? patch.tvProgress ?? null
          : currentRecord?.tvProgress ?? null,
      updatedAt: '2026-08-11T00:00:00.000Z',
      userRating: currentRecord?.userRating ?? null,
    }))
  }

  return (
    <LibraryContext.Provider
      value={{
        clearAccountData: () => undefined,
        getRecord: () => record,
        records: record ? [record] : [],
        removeRecord: () => setRecord(null),
        retrySync: () => undefined,
        syncError: null,
        syncStatus: 'local',
        updateRecord,
      }}
    >
      <EpisodeProgressControl
        candidate={candidate}
        episode={episode}
        nextEpisode={nextEpisode}
      />
    </LibraryContext.Provider>
  )
}

describe('EpisodeProgressControl', () => {
  it('records and clears episode progress through the library context', async () => {
    const user = userEvent.setup()
    render(<ProgressHarness />)

    const progressButton = screen.getByRole('button', {
      name: 'Record S01E01 watched',
    })

    await user.click(progressButton)
    expect(
      screen.getByRole('button', {
        name: 'Mark S01E01 unwatched',
      }),
    ).toHaveAttribute('aria-pressed', 'true')

    await user.click(
      screen.getByRole('button', {
        name: 'Mark S01E01 unwatched',
      }),
    )
    expect(
      screen.getByRole('button', {
        name: 'Record S01E01 watched',
      }),
    ).toHaveAttribute('aria-pressed', 'false')
  })
})
