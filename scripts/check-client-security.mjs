import assert from 'node:assert/strict'
import { readdir, readFile, stat } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const repositoryRoot = fileURLToPath(new URL('..', import.meta.url))
const scannedTargets = [
  'src',
  '.env.example',
  '.env.e2e',
  '.env.emulator',
  '.env.preview.example',
  '.env.production.example',
  '.github/workflows',
  'dist/assets',
]
const forbiddenValues = [
  'VITE_TMDB_READ_ACCESS_TOKEN',
  'https://api.themoviedb.org/3/',
]

async function getFiles(target) {
  const targetPath = path.join(repositoryRoot, target)
  const targetStats = await stat(targetPath)

  if (targetStats.isFile()) return [targetPath]

  const entries = await readdir(targetPath, { withFileTypes: true })
  const nestedFiles = await Promise.all(
    entries.map((entry) =>
      entry.isDirectory()
        ? getFiles(path.join(target, entry.name))
        : [path.join(targetPath, entry.name)],
    ),
  )

  return nestedFiles.flat()
}

const files = (
  await Promise.all(scannedTargets.map(getFiles))
).flat()
let builtApiReferenceFound = false

for (const file of files) {
  const contents = await readFile(file, 'utf8')

  for (const forbiddenValue of forbiddenValues) {
    assert.ok(
      !contents.includes(forbiddenValue),
      `${path.relative(repositoryRoot, file)} contains forbidden client boundary value: ${forbiddenValue}`,
    )
  }

  if (
    file.includes(`${path.sep}dist${path.sep}assets${path.sep}`) &&
    contents.includes('/api/tmdb/')
  ) {
    builtApiReferenceFound = true
  }
}

assert.ok(
  builtApiReferenceFound,
  'The production browser bundle must call the same-origin /api/tmdb boundary.',
)

console.log('TMDB client security boundary')
console.log('- no Vite TMDB token variable: valid')
console.log('- no direct TMDB API origin in browser sources or bundle: valid')
console.log('- same-origin /api/tmdb request path in bundle: valid')
