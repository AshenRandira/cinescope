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
import { LibraryControls } from './LibraryControls'

const candidate: LibraryCandidate = {
  backdropPath: null,
  id: 550,
  mediaType: 'movie',
  overview: 'A deterministic library fixture.',
  posterPath: null,
  releaseYear: '1999',
  title: 'Fixture Film',
}

function LibraryHarness({ variant }: { variant?: 'full' | 'save' }) {
  const [record, setRecord] = useState<LibraryRecord | null>(null)

  function updateRecord(
    nextCandidate: LibraryCandidate,
    patch: LibraryRecordPatch = {},
  ): void {
    setRecord((currentRecord) => ({
      ...nextCandidate,
      isFavorite: currentRecord?.isFavorite ?? false,
      isWatched: currentRecord?.isWatched ?? false,
      savedAt: currentRecord?.savedAt ?? '2026-08-10T00:00:00.000Z',
      updatedAt: '2026-08-10T00:00:00.000Z',
      userRating: currentRecord?.userRating ?? null,
      ...patch,
    }))
  }

  return (
    <LibraryContext.Provider
      value={{
        getRecord: () => record,
        records: record ? [record] : [],
        removeRecord: () => setRecord(null),
        retrySync: () => undefined,
        syncError: null,
        syncStatus: 'local',
        updateRecord,
      }}
    >
      <LibraryControls candidate={candidate} variant={variant} />
    </LibraryContext.Provider>
  )
}

describe('LibraryControls', () => {
  it('saves, annotates, rates, and removes a full library record', async () => {
    const user = userEvent.setup()
    render(<LibraryHarness />)

    await user.click(screen.getByRole('button', { name: 'Save to library' }))
    expect(
      screen.getByRole('button', { name: 'Saved to library' }),
    ).toHaveAttribute('aria-pressed', 'true')

    await user.click(screen.getByRole('button', { name: 'Mark watched' }))
    await user.click(screen.getByRole('button', { name: 'Mark favourite' }))
    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Your rating for Fixture Film' }),
      '9',
    )

    expect(screen.getByRole('button', { name: 'Watched' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getByRole('button', { name: 'Favourite' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(
      screen.getByRole('combobox', { name: 'Your rating for Fixture Film' }),
    ).toHaveValue('9')

    await user.click(screen.getByRole('button', { name: 'Saved to library' }))
    expect(
      screen.getByRole('button', { name: 'Save to library' }),
    ).toHaveAttribute('aria-pressed', 'false')
  })

  it('exposes an accessible compact save control', async () => {
    const user = userEvent.setup()
    render(<LibraryHarness variant="save" />)

    const saveButton = screen.getByRole('button', {
      name: 'Save Fixture Film to library',
    })
    await user.click(saveButton)

    expect(
      screen.getByRole('button', {
        name: 'Remove Fixture Film from library',
      }),
    ).toHaveAttribute('aria-pressed', 'true')
  })
})
