import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const separatorIndex = process.argv.indexOf('--')
assert.ok(separatorIndex > 2, 'Pass emulator options before --.')

const runnerArguments = process.argv.slice(2, separatorIndex)
const onlyIndex = runnerArguments.indexOf('--only')
assert.ok(onlyIndex >= 0, 'Specify emulators with --only.')

const emulators = runnerArguments[onlyIndex + 1]
const command = process.argv.slice(separatorIndex + 1).join(' ').trim()

assert.ok(emulators, 'The --only emulator list cannot be empty.')
assert.ok(command, 'Pass a validation command after --.')

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
      !/(?:CREDENTIAL|JWT|PASSWORD|PRIVATE|SECRET|TOKEN)/i.test(
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
    emulators,
    '--project',
    'demo-cinescope',
    command,
  ],
  {
    cwd: fileURLToPath(new URL('..', import.meta.url)),
    env: {
      ...childEnvironment,
      CI: process.env.CI || 'true',
      FIREBASE_FUNCTIONS_DISCOVERY_OUTPUT_PATH: 'true',
      XDG_CONFIG_HOME: firebaseConfigHome,
    },
    stdio: 'inherit',
  },
)

const exitCode = await new Promise((resolve, reject) => {
  child.once('error', reject)
  child.once('exit', resolve)
})

await rm(firebaseConfigHome, { force: true, recursive: true })
assert.equal(exitCode, 0, 'The Firebase emulator command must pass.')
