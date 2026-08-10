import assert from 'node:assert/strict'

const origin =
  process.env.CINESCOPE_HOSTING_ORIGIN?.trim() ||
  'http://127.0.0.1:5000'

async function request(pathname, options) {
  const response = await fetch(new URL(pathname, origin), options)
  const responseText = await response.text()
  let body

  try {
    body = JSON.parse(responseText)
  } catch {
    body = responseText
  }

  return { body, headers: response.headers, status: response.status }
}

const first = await request(
  '/api/tmdb/movie/popular?language=en-US&page=1',
)
const second = await request(
  '/api/tmdb/movie/popular?page=1&language=en-US',
)

assert.equal(
  first.status,
  200,
  `The first catalogue request failed: ${String(first.body)}`,
)
assert.deepEqual(first.body, {
  page: 1,
  results: [{ id: 550, title: 'Emulator Film' }],
  total_pages: 1,
  total_results: 1,
})
assert.equal(
  second.status,
  200,
  `The cached catalogue request failed: ${String(second.body)}`,
)
assert.match(
  first.headers.get('cache-control') ?? '',
  /s-maxage=300/,
)
assert.equal(
  first.headers.get('x-content-type-options'),
  'nosniff',
)
assert.ok(first.headers.get('x-request-id'))

const search = await request(
  '/api/tmdb/search/multi?include_adult=false&language=en-US&page=1&query=Fixture',
)

assert.equal(search.status, 200)
assert.equal(
  search.headers.get('cache-control'),
  'private, no-store, max-age=0',
)

const invalidRoute = await request('/api/tmdb/configuration')
assert.equal(invalidRoute.status, 404)
assert.equal(invalidRoute.body.error.code, 'not_found')

const invalidParameter = await request(
  '/api/tmdb/movie/popular?api_key=not-allowed',
)
assert.equal(invalidParameter.status, 400)
assert.equal(invalidParameter.body.error.code, 'invalid_request')

const unsupportedMethod = await request(
  '/api/tmdb/movie/popular',
  { method: 'POST' },
)
assert.equal(unsupportedMethod.status, 405)
assert.equal(unsupportedMethod.headers.get('allow'), 'GET')

console.log('TMDB API emulator contract')
console.log('- Hosting rewrite to Functions: valid')
console.log('- successful catalogue response and caching policy: valid')
console.log('- private search caching policy: valid')
console.log('- route, query, and method rejection: valid')
