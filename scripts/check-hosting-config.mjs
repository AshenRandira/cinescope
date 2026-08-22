import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const firebaseConfig = JSON.parse(
  await readFile(new URL('../firebase.json', import.meta.url), 'utf8'),
)
const hosting = firebaseConfig.hosting

assert.ok(hosting, 'firebase.json must define Hosting configuration.')
assert.equal(hosting.public, 'dist', 'Hosting must publish the Vite dist directory.')
assert.deepEqual(
  hosting.rewrites,
  [
    {
      function: {
        functionId: 'tmdbApi',
        pinTag: true,
        region: 'asia-east1',
      },
      source: '/api/tmdb/**',
    },
    { destination: '/index.html', source: '**' },
  ],
  'Hosting must route the controlled TMDB API before the final SPA rewrite.',
)
assert.equal(hosting.trailingSlash, false, 'Hosting must use canonical URLs without trailing slashes.')

const headerRules = new Map(
  hosting.headers.map((rule) => [
    rule.source ?? rule.regex,
    new Map(rule.headers.map((header) => [header.key, header.value])),
  ]),
)
assert.equal(
  hosting.headers.at(-1)?.regex,
  '^[/\\\\]assets[/\\\\].*$',
  'The immutable asset rule must remain the final cache rule.',
)
const applicationHeaders = headerRules.get('^.*$')

assert.ok(
  applicationHeaders,
  'Hosting must define global application security headers.',
)

const expectedSecurityHeaders = {
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',
  'Permissions-Policy': 'camera=(), geolocation=(), microphone=(), payment=(), usb=()',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
}

for (const [key, value] of Object.entries(expectedSecurityHeaders)) {
  assert.equal(
    applicationHeaders.get(key),
    value,
    `Hosting security header ${key} is missing or changed.`,
  )
}

const contentSecurityPolicy = applicationHeaders.get('Content-Security-Policy')

assert.ok(contentSecurityPolicy, 'Hosting must define a Content-Security-Policy.')

for (const directive of [
  "default-src 'self'",
  "connect-src 'self' https://*.googleapis.com https://*.cloudfunctions.net wss://*.firebaseio.com",
  "frame-ancestors 'none'",
  'frame-src https://www.youtube-nocookie.com',
  "img-src 'self' data: https://image.tmdb.org",
  "object-src 'none'",
  "script-src 'self'",
  "style-src 'self'",
  "style-src-attr 'unsafe-inline'",
  'upgrade-insecure-requests',
]) {
  assert.ok(
    contentSecurityPolicy.includes(`${directive};`),
    `Content-Security-Policy must include: ${directive}`,
  )
}

assert.ok(
  !contentSecurityPolicy.includes('https://api.themoviedb.org'),
  'The browser CSP must not allow direct TMDB API connections.',
)

const noStoreCacheControl =
  'no-cache, no-store, max-age=0, must-revalidate'

assert.equal(
  applicationHeaders.get('Cache-Control'),
  undefined,
  'The global security rule must not override Function cache responses.',
)
assert.equal(
  headerRules.get('^[/\\\\](?:index\\.html)?$')?.get('Cache-Control'),
  noStoreCacheControl,
  'The application shell must never be cached.',
)
assert.equal(
  headerRules
    .get(
      '^[/\\\\](?:discover|movies|tv|people|search|library|profile|login|register|credits|privacy|terms|accessibility)(?:[/\\\\].*)?$',
    )
    ?.get('Cache-Control'),
  noStoreCacheControl,
  'Known React Router paths must never be cached.',
)
assert.equal(
  headerRules.get('^[/\\\\]assets[/\\\\].*$')?.get('Cache-Control'),
  'public, max-age=31536000, immutable',
  'Vite hashed assets must be cached immutably for one year.',
)
assert.deepEqual(
  firebaseConfig.emulators.functions,
  { host: '127.0.0.1', port: 5001 },
  'The local Functions emulator must use the documented loopback address and port.',
)
assert.deepEqual(
  firebaseConfig.emulators.hosting,
  { host: '127.0.0.1', port: 5000 },
  'The local Hosting emulator must stay on the documented loopback address and port.',
)

console.log('Firebase Hosting configuration')
console.log('- dist publication and SPA rewrite: valid')
console.log('- /api/tmdb Functions rewrite: valid')
console.log('- CSP and security headers: valid')
console.log('- SPA route and immutable asset caching: valid')
console.log('- local Hosting emulator: 127.0.0.1:5000')
