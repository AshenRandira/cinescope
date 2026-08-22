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
    .getByRole('link', { name: 'View movie details for Fixture Film' })
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
    name: 'Search titles and people, or describe what you want to watch',
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

test('turns a natural-language viewing need into editable recommendations', async ({ page }) => {
  await page.goto('/search', { waitUntil: 'domcontentloaded' })
  const search = page.getByRole('combobox', {
    name: 'Search titles and people, or describe what you want to watch',
  })

  await search.fill('a funny family movie under two hours')
  await search.press('Enter')

  await expect(page).toHaveURL(/mode=intent/)
  await expect(
    page.getByRole('heading', { name: 'Review the filters.' }),
  ).toBeVisible()
  await expect(page.getByLabel('Medium')).toHaveValue('movie')
  await expect(page.getByLabel('Maximum runtime')).toHaveValue('120')
  await expect(
    page.getByRole('heading', { name: 'Fixture Family Comedy' }),
  ).toBeVisible()
  await expect(page.getByText('Why it matches')).toBeVisible()
  await expect(page.getByText(/comedy \+ family request/i)).toBeVisible()
})

test('navigates from television to a season and episode, then back', async ({ page }) => {
  await page.goto('/tv', { waitUntil: 'domcontentloaded' })

  const seriesLink = page
    .getByRole('link', { name: 'View series details' })
    .first()
  await seriesLink.focus()
  await seriesLink.press('Enter')
  await expect(page).toHaveURL(/\/tv\/1399$/)

  const seasonLink = page
    .getByRole('link', { name: 'Open episodes in Season 1' })
  await seasonLink.focus()
  await seasonLink.press('Enter')
  await expect(page).toHaveURL(/\/tv\/1399\/season\/1$/)

  const episodeLink = page
    .getByRole('link', { name: 'View episode details for Pilot Projection' })
  await episodeLink.focus()
  await episodeLink.press('Enter')
  await expect(page).toHaveURL(/\/tv\/1399\/season\/1\/episode\/1$/)
  await expect(
    page.getByRole('heading', { name: 'Pilot Projection', level: 1 }),
  ).toBeVisible()

  const backLink = page.getByRole('link', {
    name: /Season 1 episodes/,
  })
  await backLink.focus()
  await backLink.press('Enter')
  await expect(page).toHaveURL(/\/tv\/1399\/season\/1$/)
})

test('records episode progress and resumes the next transmission from the library', async ({ page }) => {
  await page.goto('/tv/1399/season/1', {
    waitUntil: 'domcontentloaded',
  })

  await expect(
    page.getByText(
      '0 of 2 episodes watched — 0% complete.',
    ),
  ).toBeVisible()

  await page
    .getByRole('button', {
      name: 'Record S01E01 watched',
    })
    .click()

  await expect(
    page.getByRole('button', {
      name: 'Mark S01E01 unwatched',
    }),
  ).toHaveAttribute('aria-pressed', 'true')
  await expect(
    page.getByText(
      '1 of 2 episodes watched — 50% complete.',
    ),
  ).toBeVisible()

  await page.goto('/library', {
    waitUntil: 'domcontentloaded',
  })
  await expect(
    page.getByRole('heading', {
      name: 'Continue watching.',
    }),
  ).toBeVisible()

  await page.reload({ waitUntil: 'domcontentloaded' })
  const resumeLink = page
    .getByRole('link')
    .filter({ hasText: 'The Second Transmission' })

  await expect(resumeLink).toBeVisible()
  await resumeLink.click()

  await expect(page).toHaveURL(
    /\/tv\/1399\/season\/1\/episode\/2$/,
  )
  await expect(
    page.getByRole('heading', {
      level: 1,
      name: 'The Second Transmission',
    }),
  ).toBeVisible()
})

test('restores focus after closing the movie media dialog', async ({ page }) => {
  await page.goto('/movies/550', { waitUntil: 'domcontentloaded' })
  const playButton = page.getByRole('button', { name: 'Play Fixture Trailer' })

  await playButton.click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await expect(page.getByTitle('Fixture Trailer video')).toBeVisible()

  await page.getByRole('button', { name: 'Close video' }).click()

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
    page.getByRole('heading', { name: 'Invalid movie address.' }),
  ).toBeVisible()
  await expect(page.getByRole('link', { name: /Return to Movies/ })).toBeVisible()
})
