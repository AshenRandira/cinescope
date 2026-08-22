import { expect, test } from '@playwright/test'

import { installPublicApiFixtures } from './fixtures.js'

test.beforeEach(async ({ page }) => {
  await installPublicApiFixtures(page)
})

test('exposes a keyboard skip link that focuses the main view', async ({
  page,
}) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' })

  await page.keyboard.press('Tab')

  const skipLink = page.getByRole('link', {
    name: 'Skip to main content',
  })
  await expect(skipLink).toBeFocused()
  await expect(skipLink).toBeVisible()

  await page.keyboard.press('Enter')

  await expect(page.getByRole('main')).toBeFocused()
})

test('honors the operating system reduced-motion preference', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/', { waitUntil: 'domcontentloaded' })

  const scrollBehavior = await page.evaluate<string>(
    'getComputedStyle(document.documentElement).scrollBehavior',
  )

  expect(scrollBehavior).toBe('auto')
})

test('shows safe recovery actions when a lazy route cannot load', async ({
  page,
}) => {
  await page.route('**/assets/MoviesPage-*.js', (route) =>
    route.abort(),
  )
  await page.goto('/', { waitUntil: 'domcontentloaded' })

  await page
    .locator('nav[aria-label="Primary navigation"] a[href="/movies"]')
    .click()

  await expect(
    page.getByRole('heading', {
      name: 'The projection stopped unexpectedly.',
    }),
  ).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Reload this view' }),
  ).toBeVisible()
  await expect(
    page.getByText(/Failed to fetch dynamically imported module/i),
  ).not.toBeVisible()

  await page
    .getByRole('link', { name: 'Return to the archive' })
    .click()
  await expect(page).toHaveURL(/\/$/)
})

test('publishes readable privacy information and index metadata', async ({
  page,
}) => {
  await page.goto('/privacy', { waitUntil: 'domcontentloaded' })

  await expect(
    page.getByRole('heading', {
      level: 1,
      name: 'Your archive remains yours.',
    }),
  ).toBeVisible()
  await expect(page).toHaveTitle('Privacy — CineScope')
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    'content',
    'index, follow, max-image-preview:large',
  )
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    /\/privacy$/,
  )
})

test('keeps TMDB attribution and release assets globally verifiable', async ({
  page,
  request,
}) => {
  await page.goto('/credits', { waitUntil: 'domcontentloaded' })

  await expect(
    page.getByText(
      'This product uses the TMDB API but is not endorsed or certified by TMDB.',
    ).first(),
  ).toBeVisible()
  await expect(
    page.getByRole('img', { name: 'The Movie Database (TMDB)' }),
  ).toBeVisible()

  const manifestResponse = await request.get('/site.webmanifest')
  expect(manifestResponse.ok()).toBe(true)
  expect((await manifestResponse.json()).name).toBe(
    'CineScope — The Living Archive',
  )

  const previewResponse = await request.get(
    '/branding/social-preview.png',
  )
  expect(previewResponse.ok()).toBe(true)
  expect(previewResponse.headers()['content-type']).toContain(
    'image/png',
  )
})

test.describe('narrow mobile layout', () => {
  test.use({
    hasTouch: true,
    isMobile: true,
    viewport: { height: 800, width: 320 },
  })

  test('keeps primary routes within the viewport and navigation touch targets usable', async ({
    page,
  }) => {
    for (const route of ['/', '/search', '/movies/550']) {
      await page.goto(route, { waitUntil: 'domcontentloaded' })

      const hasHorizontalOverflow = await page.evaluate<boolean>(
        'document.documentElement.scrollWidth > document.documentElement.clientWidth',
      )

      expect(hasHorizontalOverflow).toBe(false)
    }

    const mobileNavigation = page.getByRole('navigation', {
      name: 'Mobile navigation',
    })
    await expect(mobileNavigation).toBeVisible()

    const links = mobileNavigation.getByRole('link')
    const linkCount = await links.count()
    expect(linkCount).toBe(5)

    for (let index = 0; index < linkCount; index += 1) {
      const bounds = await links.nth(index).boundingBox()

      expect(bounds?.height).toBeGreaterThanOrEqual(44)
      expect(bounds?.width).toBeGreaterThanOrEqual(44)
    }
  })
})
