// @vitest-environment jsdom

import '../../../test/setup-dom'

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, useLocation } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { SearchRecord } from '../data/search'
import { useCineScopeSearch } from '../hooks/useCineScopeSearch'
import { HeaderSearch } from './HeaderSearch'

vi.mock('../hooks/useCineScopeSearch', () => ({
  useCineScopeSearch: vi.fn(),
}))

const records: SearchRecord[] = [
  {
    dateYear: '2016',
    id: 329865,
    imagePath: null,
    imageType: 'poster',
    knownForDepartment: null,
    mediaType: 'movie',
    originalLanguage: 'en',
    overview: 'A deterministic search fixture.',
    score: 8.1,
    title: 'Arrival',
    voteCount: 100,
  },
  {
    dateYear: '2022',
    id: 100088,
    imagePath: null,
    imageType: 'poster',
    knownForDepartment: null,
    mediaType: 'tv',
    originalLanguage: 'en',
    overview: 'A second deterministic search fixture.',
    score: 7.8,
    title: 'The Last of Us',
    voteCount: 90,
  },
]

function LocationProbe() {
  const location = useLocation()

  return (
    <output data-testid="location">
      {location.pathname}
      {location.search}
    </output>
  )
}

function renderSearch() {
  return render(
    <MemoryRouter initialEntries={['/discover']}>
      <ul>
        <HeaderSearch />
      </ul>
      <LocationProbe />
    </MemoryRouter>,
  )
}

describe('HeaderSearch', () => {
  beforeEach(() => {
    vi.mocked(useCineScopeSearch).mockImplementation(
      (query) => ({
        errorMessage: null,
        hasNextPage: false,
        isEnabled: query.length >= 2,
        isFetchingNextPage: false,
        isInitialError: false,
        isNextPageError: false,
        isPending: false,
        loadNextPage: vi.fn(),
        loadedPageCount: query ? 1 : 0,
        records: query ? records : [],
        retry: vi.fn(),
        totalResults: query ? records.length : 0,
      }),
    )
  })

  it('validates short searches without leaving the current route', async () => {
    const user = userEvent.setup()
    renderSearch()

    await user.type(
      screen.getByRole('combobox', {
        name: 'Search movies, TV series, and people',
      }),
      'a',
    )
    await user.click(
      screen.getByRole('button', {
        name: 'Show all search results',
      }),
    )

    expect(
      screen.getByRole('option', {
        name: 'Enter at least 2 characters.',
      }),
    ).toBeVisible()
    expect(screen.getByTestId('location')).toHaveTextContent(
      '/discover',
    )
  })

  it('opens debounced suggestions and supports keyboard navigation', async () => {
    const user = userEvent.setup()
    renderSearch()
    const input = screen.getByRole('combobox', {
      name: 'Search movies, TV series, and people',
    })

    await user.type(input, 'arrival')

    expect(await screen.findByText('Arrival')).toBeVisible()
    expect(screen.getAllByRole('option')).toHaveLength(2)

    await user.keyboard('{ArrowDown}{Enter}')

    expect(screen.getByTestId('location')).toHaveTextContent(
      '/movies/329865',
    )
  })

  it('submits the normalized query to the full results route', async () => {
    const user = userEvent.setup()
    renderSearch()
    const input = screen.getByRole('combobox', {
      name: 'Search movies, TV series, and people',
    })

    await user.type(input, '  dune   part two  ')
    await user.click(
      screen.getByRole('button', {
        name: 'Show all search results',
      }),
    )

    expect(screen.getByTestId('location')).toHaveTextContent(
      '/search?q=dune+part+two',
    )
  })
})
