// @vitest-environment jsdom

import '../../test/setup-dom'

import {
  act,
  render,
  screen,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  createMemoryRouter,
  Link,
} from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { describe, expect, it, vi } from 'vitest'

import { AppShell } from './AppShell'

vi.mock('./DesktopHeader', () => ({
  DesktopHeader: () => <header>Desktop navigation</header>,
}))

vi.mock('./MobileBottomNavigation', () => ({
  MobileBottomNavigation: () => <nav>Mobile navigation</nav>,
}))

describe('AppShell', () => {
  it('moves focus to main content after client-side navigation', async () => {
    const user = userEvent.setup()
    const router = createMemoryRouter(
      [
        {
          element: <AppShell />,
          children: [
            {
              path: '/first',
              element: <Link to="/second">Next route</Link>,
            },
            {
              path: '/second',
              element: <h1>Second route</h1>,
            },
          ],
        },
      ],
      { initialEntries: ['/first'] },
    )

    render(<RouterProvider router={router} />)

    await user.click(screen.getByRole('link', { name: 'Next route' }))

    expect(screen.getByRole('main')).toHaveFocus()
    expect(
      screen.getByRole('heading', { name: 'Second route' }),
    ).toBeVisible()
  })

  it('announces a route while its data is loading', async () => {
    const user = userEvent.setup()
    let finishLoading: (() => void) | undefined
    const loadingGate = new Promise<void>((resolve) => {
      finishLoading = resolve
    })
    const router = createMemoryRouter(
      [
        {
          element: <AppShell />,
          children: [
            {
              path: '/first',
              element: <Link to="/second">Next route</Link>,
            },
            {
              path: '/second',
              loader: () => loadingGate,
              element: <h1>Second route</h1>,
            },
          ],
        },
      ],
      { initialEntries: ['/first'] },
    )

    const { container } = render(
      <RouterProvider router={router} />,
    )

    await user.click(screen.getByRole('link', { name: 'Next route' }))

    expect(screen.getByRole('status')).toHaveTextContent(
      'Loading the next archive view.',
    )
    expect(
      container.querySelector('.route-progress'),
    ).toHaveAttribute('data-active', 'true')

    await act(async () => {
      finishLoading?.()
      await loadingGate
    })

    expect(
      await screen.findByRole('heading', { name: 'Second route' }),
    ).toBeVisible()
    expect(screen.getByRole('status')).toBeEmptyDOMElement()
    expect(
      container.querySelector('.route-progress'),
    ).toHaveAttribute('data-active', 'false')
  })
})
