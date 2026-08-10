import { expect, test } from '@playwright/test'

import { installPublicApiFixtures } from './fixtures.js'

test.beforeEach(async ({ page }) => {
  await installPublicApiFixtures(page)
})

test('searches for a movie and opens its detail record', async ({ page }) => {
  await page.goto('/search?q=fixture', { waitUntil: 'domcontentloaded' })

  await expect(
    page.getByRole('heading', { name: /Results for .*fixture/i }),
  ).toBeVisible()
  await page
    .getByRole('link', { name: 'Open movie record for Fixture Film' })
    .click()

  await expect(page).toHaveURL(/\/movies\/550$/)
  await expect(
    page.getByRole('heading', { name: 'Fixture Film', level: 1 }),
  ).toBeVisible()
  await expect(page).toHaveTitle('Fixture Film — CineScope')
})

test('opens a header suggestion using only the keyboard', async ({ page }) => {
  await page.goto('/search', { waitUntil: 'domcontentloaded' })
  const search = page.getByRole('combobox', {
    name: 'Search movies, TV series, and people',
  })

  await search.fill('fixture')
  await expect(page.getByRole('option').filter({ hasText: 'Fixture Film' })).toBeVisible()
  await search.press('ArrowDown')
  await search.press('Enter')

  await expect(page).toHaveURL(/\/movies\/550$/)
  await expect(
    page.getByRole('heading', { name: 'Fixture Film', level: 1 }),
  ).toBeVisible()
})

test('navigates from television to a season and episode, then back', async ({ page }) => {
  await page.goto('/tv', { waitUntil: 'domcontentloaded' })

  const seriesLink = page
    .getByRole('link', { name: 'Open series record' })
    .first()
  await seriesLink.focus()
  await seriesLink.press('Enter')
  await expect(page).toHaveURL(/\/tv\/1399$/)

  const seasonLink = page
    .getByRole('link', { name: 'Open Season 1 episode register' })
  await seasonLink.focus()
  await seasonLink.press('Enter')
  await expect(page).toHaveURL(/\/tv\/1399\/season\/1$/)

  const episodeLink = page
    .getByRole('link', { name: 'Open episode record for Pilot Projection' })
  await episodeLink.focus()
  await episodeLink.press('Enter')
  await expect(page).toHaveURL(/\/tv\/1399\/season\/1\/episode\/1$/)
  await expect(
    page.getByRole('heading', { name: 'Pilot Projection', level: 1 }),
  ).toBeVisible()

  const backLink = page.getByRole('link', {
    name: /Season 1 episode register/,
  })
  await backLink.focus()
  await backLink.press('Enter')
  await expect(page).toHaveURL(/\/tv\/1399\/season\/1$/)
})

test('restores focus after closing the movie media dialog', async ({ page }) => {
  await page.goto('/movies/550', { waitUntil: 'domcontentloaded' })
  const playButton = page.getByRole('button', { name: 'Play Fixture Trailer' })

  await playButton.click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await expect(page.getByTitle('Fixture Trailer video')).toBeVisible()

  await page.getByRole('button', { name: 'Close video projection' }).click()

  await expect(page.getByRole('dialog')).not.toBeVisible()
  await expect(playButton).toBeFocused()
})

test('renders appropriate states for unknown and malformed deep routes', async ({ page }) => {
  await page.goto('/this-route-does-not-exist', {
    waitUntil: 'domcontentloaded',
  })

  await expect(
    page.getByRole('heading', { name: 'This page left the theatre.' }),
  ).toBeVisible()
  await expect(page).toHaveTitle('Page not found — CineScope')

  await page.goto('/movies/not-a-number', { waitUntil: 'domcontentloaded' })

  await expect(
    page.getByRole('heading', { name: 'Invalid movie record.' }),
  ).toBeVisible()
  await expect(page.getByRole('link', { name: /Return to the movie register/ })).toBeVisible()
})
