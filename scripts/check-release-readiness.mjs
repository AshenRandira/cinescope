import assert from 'node:assert/strict'
import { readdir, readFile } from 'node:fs/promises'

const rootUrl = new URL('../', import.meta.url)

async function readText(pathname) {
  return readFile(new URL(pathname, rootUrl), 'utf8')
}

async function listFiles(directoryUrl) {
  const entries = await readdir(directoryUrl, {
    withFileTypes: true,
  })
  const files = []

  for (const entry of entries) {
    const suffix = entry.isDirectory() ? '/' : ''
    const entryUrl = new URL(
      `${entry.name}${suffix}`,
      directoryUrl,
    )

    if (entry.isDirectory()) {
      files.push(...(await listFiles(entryUrl)))
    } else {
      files.push(entryUrl)
    }
  }

  return files
}

const indexHtml = await readText('index.html')

for (const requiredMarkup of [
  'rel="manifest" href="/site.webmanifest"',
  'name="description"',
  'name="robots"',
  'property="og:title"',
  'property="og:description"',
  'property="og:image"',
  'name="twitter:card" content="summary_large_image"',
]) {
  assert.ok(
    indexHtml.includes(requiredMarkup),
    `index.html must include release metadata: ${requiredMarkup}`,
  )
}

const manifest = JSON.parse(await readText('public/site.webmanifest'))

assert.equal(manifest.name, 'CineScope — The Living Archive')
assert.equal(manifest.start_url, '/')
assert.equal(manifest.scope, '/')
assert.equal(manifest.theme_color, '#070806')
assert.ok(
  manifest.icons.some(
    (icon) =>
      icon.src === '/favicon.svg' &&
      icon.type === 'image/svg+xml',
  ),
  'The web app manifest must reference the CineScope SVG mark.',
)

const socialPreview = await readFile(
  new URL('public/branding/social-preview.png', rootUrl),
)
const pngSignature = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
])

assert.ok(
  socialPreview.subarray(0, 8).equals(pngSignature),
  'The social preview must be a valid PNG.',
)
assert.equal(
  socialPreview.readUInt32BE(16),
  1200,
  'The social preview must be 1200 pixels wide.',
)
assert.equal(
  socialPreview.readUInt32BE(20),
  630,
  'The social preview must be 630 pixels high.',
)

const routerSource = await readText('src/app/router.tsx')
const informationSource = await readText(
  'src/pages/InformationPages.tsx',
)

for (const route of [
  'credits',
  'privacy',
  'terms',
  'accessibility',
]) {
  assert.ok(
    routerSource.includes(`path: '${route}'`),
    `The public /${route} route must be registered.`,
  )
}

assert.ok(
  informationSource.includes('/branding/tmdb-logo.svg'),
  'The credits route must display the approved TMDB logo.',
)
assert.ok(
  informationSource.includes(
    'This product uses the TMDB API but is not endorsed or certified',
  ),
  'The credits route must include the required TMDB notice.',
)

const sourceFiles = (await listFiles(new URL('src/', rootUrl))).filter(
  (fileUrl) => fileUrl.pathname.endsWith('.tsx'),
)

for (const fileUrl of sourceFiles) {
  const source = await readFile(fileUrl, 'utf8')
  const externalAnchorTags = [
    ...source.matchAll(/<a\b[^>]*target="_blank"[^>]*>/g),
  ]

  for (const [anchorTag] of externalAnchorTags) {
    assert.match(
      anchorTag,
      /rel="[^"]*(?:noreferrer|noopener)[^"]*"/,
      `${fileUrl.pathname} contains a new-tab link without opener protection.`,
    )
  }
}

for (const requiredDocument of [
  'CHANGELOG.md',
  'docs/architecture.md',
  'docs/environment-variables.md',
  'docs/product/deferred-social-community.md',
  'docs/release/v1-readiness.md',
  'docs/release/v1-release-notes.md',
]) {
  const content = await readText(requiredDocument)
  assert.ok(
    content.trim().length > 100,
    `${requiredDocument} must contain substantive release documentation.`,
  )
}

console.log('CineScope V1 release foundation')
console.log('- document and social metadata: valid')
console.log('- 1200x630 social preview: valid')
console.log('- public policy and TMDB credits routes: valid')
console.log('- protected external links: valid')
console.log('- architecture, environment, community boundary, readiness, and release documents: valid')
