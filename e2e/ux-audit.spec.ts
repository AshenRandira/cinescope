import { expect, test, type Page } from '@playwright/test'

import { installPublicApiFixtures } from './fixtures.js'

const publicRoutes = [
  '/',
  '/discover',
  '/movies',
  '/movies/550',
  '/tv',
  '/tv/1399',
  '/tv/1399/season/1',
  '/tv/1399/season/1/episode/1',
  '/people/287',
  '/search',
  '/library',
  '/login',
  '/register',
  '/credits',
  '/privacy',
  '/terms',
  '/accessibility',
] as const

type RouteAudit = {
  controlTargets: string[]
  denseText: string[]
  duplicateIds: string[]
  hasHorizontalOverflow: boolean
  headingCount: number
  imagesWithoutAlt: string[]
  mainCount: number
  tinyText: string[]
  unnamedControls: string[]
}

async function auditRoute(page: Page, route: string) {
  await page.goto(route, { waitUntil: 'domcontentloaded' })
  await page.locator('main').waitFor({ state: 'visible' })
  await page.waitForLoadState('networkidle')
  await page.evaluate('document.fonts.ready')

  return page.evaluate<RouteAudit>(`(() => {
    const isVisible = (element) => {
      const htmlElement = element
      const style = window.getComputedStyle(htmlElement)
      const bounds = htmlElement.getBoundingClientRect()

      return (
        style.display !== 'none' &&
        style.visibility !== 'hidden' &&
        Number(style.opacity) > 0 &&
        bounds.width > 0 &&
        bounds.height > 0
      )
    }

    const describe = (element) => {
      const htmlElement = element
      const identity =
        htmlElement.getAttribute('aria-label') ??
        htmlElement.getAttribute('name') ??
        htmlElement.textContent?.trim().slice(0, 54) ??
        ''

      return htmlElement.tagName.toLowerCase() + ' "' + identity + '"'
    }

    const tinyText = [...document.querySelectorAll('*')]
      .filter((element) => {
        if (!isVisible(element) || element.closest('.sr-only')) {
          return false
        }

        const hasDirectText = [...element.childNodes].some(
          (node) =>
            node.nodeType === Node.TEXT_NODE &&
            Boolean(node.textContent?.trim()),
        )

        return (
          hasDirectText &&
          Number.parseFloat(window.getComputedStyle(element).fontSize) < 12
        )
      })
      .map(describe)

    const controlTargets = [
      ...document.querySelectorAll(
        'button, input, select, textarea, [role="button"]',
      ),
    ]
      .filter(isVisible)
      .filter((element) => {
        const bounds = element.getBoundingClientRect()
        return bounds.width < 24 || bounds.height < 24
      })
      .map(describe)

    const denseText = [...document.querySelectorAll('main p')]
      .filter(isVisible)
      .filter(
        (element) =>
          (element.textContent ?? '')
            .replace(/\\s+/g, ' ')
            .trim().length > 220,
      )
      .map(describe)

    const idCounts = [...document.querySelectorAll('[id]')]
      .map((element) => element.id)
      .reduce((counts, id) => {
        counts[id] = (counts[id] ?? 0) + 1
        return counts
      }, {})

    const duplicateIds = Object.entries(idCounts)
      .filter(([, count]) => count > 1)
      .map(([id]) => id)

    const imagesWithoutAlt = [
      ...document.querySelectorAll('img:not([alt])'),
    ].map(describe)

    const unnamedControls = [
      ...document.querySelectorAll(
        'button, a[href], input, select, textarea',
      ),
    ]
      .filter(isVisible)
      .filter((element) => {
        if (element.matches('input[type="hidden"]')) {
          return false
        }

        const labelledBy = element.getAttribute('aria-labelledby')
        const referencedLabel = labelledBy
          ? labelledBy
              .split(/\\s+/)
              .map((id) => document.getElementById(id)?.textContent ?? '')
              .join(' ')
          : ''
        const associatedLabels = 'labels' in element
          ? [...(element.labels ?? [])]
              .map((label) => label.textContent ?? '')
              .join(' ')
          : ''
        const nestedImageAlt = element
          .querySelector('img[alt]')
          ?.getAttribute('alt') ?? ''
        const accessibleText = [
          element.getAttribute('aria-label') ?? '',
          referencedLabel,
          associatedLabels,
          element.getAttribute('title') ?? '',
          element.textContent ?? '',
          nestedImageAlt,
        ].join(' ').trim()

        return accessibleText.length === 0
      })
      .map(describe)

    return {
      controlTargets,
      denseText,
      duplicateIds,
      hasHorizontalOverflow:
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth,
      headingCount: document.querySelectorAll('main h1').length,
      imagesWithoutAlt,
      mainCount: document.querySelectorAll('main').length,
      tinyText,
      unnamedControls,
    }
  })()`)
}

test.beforeEach(async ({ page }) => {
  await installPublicApiFixtures(page)
})

for (const viewport of [
  { height: 900, label: 'desktop', width: 1440 },
  { height: 844, label: 'mobile', width: 390 },
] as const) {
  test.describe(`${viewport.label} public route audit`, () => {
    test.use({
      hasTouch: viewport.label === 'mobile',
      isMobile: viewport.label === 'mobile',
      viewport: {
        height: viewport.height,
        width: viewport.width,
      },
    })

    test(`keeps every route readable and operable`, async ({
      page,
    }, testInfo) => {
      const browserErrors: string[] = []
      const resourceErrors: string[] = []

      page.on('console', (message) => {
        if (
          message.type() === 'error' &&
          !message.text().startsWith('Failed to load resource:')
        ) {
          browserErrors.push(message.text())
        }
      })
      page.on('pageerror', (error) => {
        browserErrors.push(error.message)
      })
      page.on('requestfailed', (request) => {
        resourceErrors.push(
          `${request.url()} (${request.failure()?.errorText ?? 'failed'})`,
        )
      })
      page.on('response', (response) => {
        if (response.status() >= 400) {
          resourceErrors.push(`${response.url()} (${response.status()})`)
        }
      })

      for (const route of publicRoutes) {
        browserErrors.length = 0
        resourceErrors.length = 0
        const audit = await auditRoute(page, route)

        expect.soft(
          audit.hasHorizontalOverflow,
          `${route} must not overflow horizontally`,
        ).toBe(false)
        expect.soft(
          audit.mainCount,
          `${route} must expose exactly one main landmark`,
        ).toBe(1)
        expect.soft(
          audit.headingCount,
          `${route} must expose exactly one primary heading`,
        ).toBe(1)
        expect.soft(
          audit.tinyText,
          `${route} must not render authored text below 12px`,
        ).toEqual([])
        expect.soft(
          audit.controlTargets,
          `${route} controls must be at least 24 by 24 CSS pixels`,
        ).toEqual([])
        expect.soft(
          audit.denseText,
          `${route} must not present dense text blocks over 220 characters`,
        ).toEqual([])
        expect.soft(
          audit.duplicateIds,
          `${route} must not expose duplicate element identifiers`,
        ).toEqual([])
        expect.soft(
          audit.imagesWithoutAlt,
          `${route} images must declare text alternatives`,
        ).toEqual([])
        expect.soft(
          audit.unnamedControls,
          `${route} controls and links must have accessible names`,
        ).toEqual([])
        expect.soft(
          browserErrors,
          `${route} must not emit browser errors`,
        ).toEqual([])
        expect.soft(
          resourceErrors,
          `${route} must load every requested resource`,
        ).toEqual([])

        if (process.env.CINESCOPE_UX_SCREENSHOTS === '1') {
          const routeName = route === '/'
            ? 'home'
            : route.slice(1).replaceAll('/', '-')

          await page.screenshot({
            fullPage: true,
            path: testInfo.outputPath(
              `${viewport.label}-${routeName}.png`,
            ),
          })
        }
      }
    })
  })
}

test.describe('mobile control visibility', () => {
  test.use({
    hasTouch: true,
    isMobile: true,
    viewport: { height: 844, width: 390 },
  })

  test('keeps the focused search field above fixed navigation', async ({
    page,
  }) => {
    await page.goto('/search', { waitUntil: 'networkidle' })

    const input = page.getByLabel('Title, name, or viewing request')
    const navigation = page.getByRole('navigation', {
      name: 'Mobile navigation',
    })

    await input.focus()
    await expect(input).toBeFocused()

    const inputBounds = await input.boundingBox()
    const navigationBounds = await navigation.boundingBox()

    expect(inputBounds).not.toBeNull()
    expect(navigationBounds).not.toBeNull()
    expect(inputBounds!.y + inputBounds!.height).toBeLessThanOrEqual(
      navigationBounds!.y,
    )
  })
})
