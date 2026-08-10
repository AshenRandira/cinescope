// @vitest-environment jsdom

import '../../test/setup-dom'

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  Link,
  MemoryRouter,
  Route,
  Routes,
} from 'react-router'
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
    render(
      <MemoryRouter initialEntries={['/first']}>
        <Routes>
          <Route element={<AppShell />}>
            <Route
              path="/first"
              element={<Link to="/second">Next route</Link>}
            />
            <Route path="/second" element={<h1>Second route</h1>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    )

    await user.click(screen.getByRole('link', { name: 'Next route' }))

    expect(screen.getByRole('main')).toHaveFocus()
    expect(
      screen.getByRole('heading', { name: 'Second route' }),
    ).toBeVisible()
  })
})
