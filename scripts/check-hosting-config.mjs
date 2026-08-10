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
  [{ destination: '/index.html', source: '**' }],
  'Hosting must preserve React Router deep links with one final SPA rewrite.',
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
  'The immutable asset rule must be last so it overrides the broad document cache policy.',
)
const applicationHeaders = headerRules.get('^.*$')

assert.ok(
  applicationHeaders,
  'Hosting must define application-document security and cache headers.',
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
  "connect-src 'self' https://api.themoviedb.org https://*.googleapis.com wss://*.firebaseio.com",
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

assert.equal(
  applicationHeaders.get('Cache-Control'),
  'no-cache, no-store, max-age=0, must-revalidate',
  'Application routes and unhashed files must always be revalidated.',
)
assert.equal(
  headerRules.get('^[/\\\\]assets[/\\\\].*$')?.get('Cache-Control'),
  'public, max-age=31536000, immutable',
  'Vite hashed assets must be cached immutably for one year.',
)
assert.deepEqual(
  firebaseConfig.emulators.hosting,
  { host: '127.0.0.1', port: 5000 },
  'The local Hosting emulator must stay on the documented loopback address and port.',
)

console.log('Firebase Hosting configuration')
console.log('- dist publication and SPA rewrite: valid')
console.log('- CSP and security headers: valid')
console.log('- HTML and immutable asset caching: valid')
console.log('- local Hosting emulator: 127.0.0.1:5000')
