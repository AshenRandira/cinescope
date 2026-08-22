// @vitest-environment jsdom

import '../../test/setup-dom'

import { render, screen } from '@testing-library/react'
import { createMemoryRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { describe, expect, it, vi } from 'vitest'

import { RouteErrorBoundary } from './RouteErrorBoundary'

function BrokenRoute(): never {
  throw new Error('Private diagnostic detail')
}

describe('RouteErrorBoundary', () => {
  it('recovers from an unexpected route error without exposing diagnostics', async () => {
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined)
    const router = createMemoryRouter(
      [
        {
          path: '/',
          Component: BrokenRoute,
          ErrorBoundary: RouteErrorBoundary,
        },
      ],
      { initialEntries: ['/'] },
    )

    render(<RouterProvider router={router} />)

    expect(
      await screen.findByRole('heading', {
        name: 'The projection stopped unexpectedly.',
      }),
    ).toBeVisible()
    expect(
      screen.getByRole('button', { name: 'Reload this view' }),
    ).toBeVisible()
    expect(
      screen.getByRole('link', { name: 'Return to the archive' }),
    ).toHaveAttribute('href', '/')
    expect(
      screen.queryByText('Private diagnostic detail'),
    ).not.toBeInTheDocument()

    consoleError.mockRestore()
  })
})
