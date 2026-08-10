import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { mkdtemp, rm } from 'node:fs/promises'
import { createServer } from 'node:http'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const expectedToken = 'emulator-fixture-token'
let upstreamRequestCount = 0

const server = createServer((request, response) => {
  const requestUrl = new URL(
    request.url ?? '/',
    'http://127.0.0.1',
  )

  assert.equal(request.method, 'GET')
  assert.equal(
    request.headers.authorization,
    `Bearer ${expectedToken}`,
  )
  upstreamRequestCount += 1
  response.setHeader('Content-Type', 'application/json')

  if (requestUrl.pathname === '/3/movie/popular') {
    response.end(
      JSON.stringify({
        page: 1,
        results: [{ id: 550, title: 'Emulator Film' }],
        total_pages: 1,
        total_results: 1,
      }),
    )
    return
  }

  if (requestUrl.pathname === '/3/search/multi') {
    response.end(
      JSON.stringify({
        page: 1,
        results: [],
        total_pages: 1,
        total_results: 0,
      }),
    )
    return
  }

  response.statusCode = 404
  response.end(
    JSON.stringify({
      status_code: 34,
      status_message: 'Fixture route not found.',
    }),
  )
})

await new Promise((resolve, reject) => {
  server.once('error', reject)
  server.listen(0, '127.0.0.1', resolve)
})

const address = server.address()
assert.ok(address && typeof address === 'object')

const firebaseCli = fileURLToPath(
  new URL(
    '../node_modules/firebase-tools/lib/bin/firebase.js',
    import.meta.url,
  ),
)
const firebaseConfigHome = await mkdtemp(
  join(tmpdir(), 'cinescope-firebase-cli-'),
)
const childEnvironment = Object.fromEntries(
  Object.entries(process.env).filter(
    ([name]) =>
      !/(?:AUTH|CREDENTIAL|JWT|PASSWORD|PRIVATE|SECRET|TOKEN)/i.test(
        name,
      ) && name !== 'DEBUG',
  ),
)
const child = spawn(
  process.execPath,
  [
    firebaseCli,
    'emulators:exec',
    '--only',
    'functions,hosting',
    '--project',
    'demo-cinescope',
    'node scripts/check-tmdb-api-response.mjs',
  ],
  {
    cwd: fileURLToPath(new URL('..', import.meta.url)),
    env: {
      ...childEnvironment,
      CI: 'true',
      FIREBASE_FUNCTIONS_DISCOVERY_OUTPUT_PATH: 'true',
      FUNCTIONS_DISCOVERY_TIMEOUT: '120',
      CINESCOPE_TMDB_FIXTURE_TOKEN: expectedToken,
      TMDB_APP_CHECK_ENFORCED: 'false',
      TMDB_UPSTREAM_ORIGIN: `http://127.0.0.1:${address.port}/3/`,
      XDG_CONFIG_HOME: firebaseConfigHome,
    },
    stdio: 'inherit',
  },
)

const exitCode = await new Promise((resolve, reject) => {
  child.once('error', reject)
  child.once('exit', resolve)
})

await new Promise((resolve, reject) => {
  server.close((error) => (error ? reject(error) : resolve()))
})
await rm(firebaseConfigHome, { force: true, recursive: true })

assert.equal(exitCode, 0, 'The Firebase API emulator check must pass.')
assert.equal(
  upstreamRequestCount,
  2,
  'Only the uncached catalogue request and private search may reach the fixture upstream.',
)
