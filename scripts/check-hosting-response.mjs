import assert from 'node:assert/strict'

const origin =
  process.env.CINESCOPE_HOSTING_ORIGIN?.trim() ||
  'http://127.0.0.1:5000'

async function fetchPath(pathname) {
  const response = await fetch(new URL(pathname, origin))
  const body = await response.text()

  assert.equal(
    response.status,
    200,
    `${pathname} must return HTTP 200 from the Hosting emulator.`,
  )

  return { body, headers: response.headers }
}

function expectHeader(headers, key, expectedValue) {
  assert.equal(
    headers.get(key),
    expectedValue,
    `${key} must match the reviewed Hosting policy.`,
  )
}

const root = await fetchPath('/')
const deepRoute = await fetchPath('/movies/550')
const privacyRoute = await fetchPath('/privacy')
const manifest = await fetchPath('/site.webmanifest')

assert.ok(
  root.body.includes('<div id="root"></div>'),
  'The Hosting root must serve the built CineScope application shell.',
)
assert.equal(
  deepRoute.body,
  root.body,
  'A direct React Router deep link must be rewritten to the application shell.',
)
assert.equal(
  privacyRoute.body,
  root.body,
  'A direct policy-route link must be rewritten to the application shell.',
)
assert.equal(
  JSON.parse(manifest.body).name,
  'CineScope — The Living Archive',
  'Hosting must serve the reviewed web app manifest.',
)

expectHeader(
  root.headers,
  'cache-control',
  'no-cache, no-store, max-age=0, must-revalidate',
)
expectHeader(
  deepRoute.headers,
  'cache-control',
  'no-cache, no-store, max-age=0, must-revalidate',
)
expectHeader(
  privacyRoute.headers,
  'cache-control',
  'no-cache, no-store, max-age=0, must-revalidate',
)
expectHeader(root.headers, 'cross-origin-opener-policy', 'same-origin')
expectHeader(root.headers, 'cross-origin-resource-policy', 'same-origin')
expectHeader(
  root.headers,
  'permissions-policy',
  'camera=(), geolocation=(), microphone=(), payment=(), usb=()',
)
expectHeader(root.headers, 'referrer-policy', 'strict-origin-when-cross-origin')
expectHeader(
  root.headers,
  'strict-transport-security',
  'max-age=31536000; includeSubDomains',
)
expectHeader(root.headers, 'x-content-type-options', 'nosniff')
expectHeader(root.headers, 'x-frame-options', 'DENY')

const contentSecurityPolicy = root.headers.get('content-security-policy')

assert.ok(
  contentSecurityPolicy?.includes("frame-ancestors 'none'"),
  'The served CSP must prevent framing.',
)
assert.ok(
  !contentSecurityPolicy?.includes('https://api.themoviedb.org'),
  'The served CSP must block direct TMDB API connections.',
)

const scriptPath = root.body.match(/src="(\/assets\/[^"]+\.js)"/)?.[1]

assert.ok(scriptPath, 'The built application shell must reference a hashed JavaScript asset.')

const script = await fetchPath(scriptPath)

expectHeader(
  script.headers,
  'cache-control',
  'public, max-age=31536000, immutable',
)

console.log('Firebase Hosting emulator responses')
console.log('- application shell: HTTP 200 with reviewed security headers')
console.log('- /movies/550: SPA rewrite returns the application shell')
console.log('- /privacy: policy deep link returns the application shell')
console.log('- web app manifest: available')
console.log('- hashed JavaScript: one-year immutable cache policy')
