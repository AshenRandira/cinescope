import { expect, test } from '@playwright/test'

import { installPublicApiFixtures } from './fixtures.js'

test.beforeEach(async ({ page }) => {
  await installPublicApiFixtures(page)
})

test('uses a spacious readable desktop header and atmospheric background', async ({ page }) => {
  await page.goto('/discover', { waitUntil: 'domcontentloaded' })

  const header = page.locator('.desktop-header')
  await expect(header).toBeVisible()
  expect((await header.boundingBox())?.height).toBeGreaterThanOrEqual(85)
  await expect(
    page.getByRole('link', { exact: true, name: 'Discover' }),
  ).toHaveCSS('font-size', '16.8px')
  expect(
    await page.locator('body').evaluate(
      (element) => element.ownerDocument.defaultView
        ?.getComputedStyle(element).backgroundImage ?? '',
    ),
  ).toContain('linear-gradient')
})

test('searches for a movie and opens its detail record', async ({ page }) => {
  await page.goto('/search?q=fixture', { waitUntil: 'domcontentloaded' })

  await expect(
    page.getByRole('heading', { name: /Results for .*fixture/i }),
  ).toBeVisible()
  const resultCard = page.locator('.search-record').filter({ hasText: 'Fixture Film' })
  const resultDetails = resultCard.locator('.search-record__copy')
  await expect(resultDetails).toHaveCSS('opacity', '0')
  await resultCard.locator('.search-record__artwork').hover()
  await expect(resultDetails).toHaveCSS('opacity', '1')
  await resultCard
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
  const recommendationCard = page
    .locator('.search-record')
    .filter({ hasText: 'Fixture Family Comedy' })
  await recommendationCard.locator('.search-record__artwork').hover()
  await expect(
    recommendationCard.getByRole('link', {
      exact: true,
      name: 'Fixture Family Comedy',
    }),
  ).toBeVisible()
  await expect(recommendationCard.getByText('Why it matches')).toBeVisible()
  await expect(
    recommendationCard.getByText(/comedy \+ family request/i),
  ).toBeVisible()
})

test('reveals Discover and TV card details from the artwork', async ({ page }) => {
  await page.goto('/discover', { waitUntil: 'domcontentloaded' })
  await page.getByRole('button', { name: 'Quiet and strange' }).click()
  const discoverCard = page.locator('.discover-card').first()
  const discoverDetails = discoverCard.locator('.discover-card__copy')
  await expect(discoverDetails).toHaveCSS('opacity', '0')
  await discoverCard.locator('.discover-card__artwork').hover()
  await expect(discoverDetails).toHaveCSS('opacity', '1')

  await page.goto('/tv', { waitUntil: 'domcontentloaded' })
  const tvCard = page.locator('.tv-card').first()
  const tvDetails = tvCard.locator('.tv-card__copy')
  await expect(tvDetails).toHaveCSS('opacity', '0')
  await tvCard.locator('.tv-card__artwork').hover()
  await expect(tvDetails).toHaveCSS('opacity', '1')
})

test('keeps catalogue controls visible and result cards compact', async ({ page }) => {
  await page.goto('/discover', { waitUntil: 'domcontentloaded' })

  const discoverChoice = page.getByRole('button', {
    name: 'Quiet and strange',
  })
  await expect(discoverChoice).toHaveCSS('cursor', 'pointer')
  expect(
    await discoverChoice.evaluate(
      (element) => element.ownerDocument.defaultView
        ?.getComputedStyle(element).backgroundColor ?? '',
    ),
  ).not.toBe('rgba(0, 0, 0, 0)')
  await discoverChoice.click()
  await expect(page.locator('.discover-card').first()).toBeVisible()
  expect(
    await page.locator('.discover-contact-sheet__grid').evaluate(
      (element) => element.ownerDocument.defaultView
        ?.getComputedStyle(element).gridTemplateColumns.split(' ').length ?? 0,
    ),
  ).toBe(4)
  expect(
    (await page.locator('.discover-card__artwork').first().boundingBox())?.height,
  ).toBeLessThanOrEqual(370)

  await page.goto('/movies', { waitUntil: 'domcontentloaded' })
  const genreChoice = page.getByRole('button', { exact: true, name: 'Drama' })
  await expect(genreChoice).toHaveCSS('cursor', 'pointer')
  expect(
    await genreChoice.evaluate(
      (element) => element.ownerDocument.defaultView
        ?.getComputedStyle(element).backgroundColor ?? '',
    ),
  ).not.toBe('rgba(0, 0, 0, 0)')

  await page.goto('/tv', { waitUntil: 'domcontentloaded' })
  const tvChoice = page.getByRole('button', { exact: true, name: /Top rated/ })
  await expect(tvChoice).toHaveCSS('cursor', 'pointer')
  expect(
    await tvChoice.evaluate(
      (element) => element.ownerDocument.defaultView
        ?.getComputedStyle(element).backgroundColor ?? '',
    ),
  ).not.toBe('rgba(0, 0, 0, 0)')
  await expect(page.locator('.tv-card').first()).toBeVisible()
  expect(
    await page.locator('.tv-contact-sheet__grid').evaluate(
      (element) => element.ownerDocument.defaultView
        ?.getComputedStyle(element).gridTemplateColumns.split(' ').length ?? 0,
    ),
  ).toBe(4)
  expect(
    (await page.locator('.tv-card__artwork').first().boundingBox())?.height,
  ).toBeLessThanOrEqual(370)

  await page.goto('/search?q=fixture', { waitUntil: 'domcontentloaded' })
  await expect(page.locator('.search-record').first()).toBeVisible()
  expect(
    (await page.locator('.search-record__artwork').first().boundingBox())?.height,
  ).toBeLessThanOrEqual(370)
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
