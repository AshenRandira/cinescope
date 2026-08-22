import { readFile } from 'node:fs/promises'
import { gzipSync } from 'node:zlib'

const distRoot = new URL('../dist/', import.meta.url)
const indexUrl = new URL('index.html', distRoot)
const manifestUrl = new URL('.vite/manifest.json', distRoot)
const indexHtml = await readFile(indexUrl, 'utf8')
const manifest = JSON.parse(await readFile(manifestUrl, 'utf8'))
const initialAssetPattern =
  /(?:href|src)="(\/assets\/[^"?]+\.(?:css|js))"/g
const initialAssetPaths = [
  ...new Set(
    [...indexHtml.matchAll(initialAssetPattern)].map(
      ([, assetPath]) => assetPath,
    ),
  ),
]

if (initialAssetPaths.length === 0) {
  throw new Error(
    'No initial JavaScript or CSS assets were found in dist/index.html. Run the production build first.',
  )
}

const assets = await Promise.all(
  initialAssetPaths.map(async (assetPath) => {
    const content = await readFile(
      new URL(`.${assetPath}`, distRoot),
    )

    return {
      assetPath,
      gzipBytes: gzipSync(content).byteLength,
      rawBytes: content.byteLength,
    }
  }),
)
const totals = assets.reduce(
  (current, asset) => ({
    gzipBytes: current.gzipBytes + asset.gzipBytes,
    rawBytes: current.rawBytes + asset.rawBytes,
  }),
  { gzipBytes: 0, rawBytes: 0 },
)
const budgets = {
  gzipBytes: 170_000,
  rawBytes: 550_000,
}
const routeBudgets = {
  gzipBytes: 30_000,
  rawBytes: 100_000,
}
const deferredDependencyBudgets = {
  gzipBytes: 180_000,
  rawBytes: 600_000,
}

function formatKilobytes(bytes) {
  return `${(bytes / 1000).toFixed(2)} kB`
}

async function measureAssetPaths(assetPaths) {
  const measuredAssets = await Promise.all(
    [...assetPaths].map(async (assetPath) => {
      const content = await readFile(
        new URL(assetPath, distRoot),
      )

      return {
        assetPath,
        gzipBytes: gzipSync(content).byteLength,
        rawBytes: content.byteLength,
      }
    }),
  )

  return measuredAssets.reduce(
    (current, asset) => ({
      gzipBytes: current.gzipBytes + asset.gzipBytes,
      rawBytes: current.rawBytes + asset.rawBytes,
    }),
    { gzipBytes: 0, rawBytes: 0 },
  )
}

function collectStaticEntryAssets(entryKey, visited = new Set()) {
  if (visited.has(entryKey)) return new Set()
  visited.add(entryKey)

  const entry = manifest[entryKey]
  if (!entry) return new Set()

  const assetPaths = new Set([entry.file, ...(entry.css ?? [])])

  for (const importKey of entry.imports ?? []) {
    for (const assetPath of collectStaticEntryAssets(
      importKey,
      visited,
    )) {
      assetPaths.add(assetPath)
    }
  }

  return assetPaths
}

function getExceededMeasurements(measurements, limits) {
  return Object.entries(limits)
    .filter(
      ([measurement, limit]) =>
        measurements[measurement] > limit,
    )
    .map(([measurement]) => measurement)
}

console.log('Initial production bundle')

for (const asset of assets) {
  console.log(
    `- ${asset.assetPath}: ${formatKilobytes(asset.rawBytes)} raw / ${formatKilobytes(asset.gzipBytes)} gzip`,
  )
}

console.log(
  `Total: ${formatKilobytes(totals.rawBytes)} raw / ${formatKilobytes(totals.gzipBytes)} gzip`,
)
console.log(
  `Budget: ${formatKilobytes(budgets.rawBytes)} raw / ${formatKilobytes(budgets.gzipBytes)} gzip`,
)

const exceededBudgets = getExceededMeasurements(totals, budgets)

if (exceededBudgets.length > 0) {
  const labels = exceededBudgets.join(' and ')

  throw new Error(
    `The initial production bundle exceeds its ${labels} budget.`,
  )
}

const initialAssetSet = new Set(
  initialAssetPaths.map((assetPath) => assetPath.slice(1)),
)
const routeEntries = Object.entries(manifest).filter(
  ([sourcePath, entry]) =>
    sourcePath.startsWith('src/') && entry.isDynamicEntry,
)
const measuredRoutes = await Promise.all(
  routeEntries.map(async ([sourcePath]) => {
    const routeAssets = collectStaticEntryAssets(sourcePath)
    const incrementalAssets = new Set(
      [...routeAssets].filter(
        (assetPath) => !initialAssetSet.has(assetPath),
      ),
    )

    return {
      sourcePath,
      ...(await measureAssetPaths(incrementalAssets)),
    }
  }),
)

console.log('\nLazy route increments')

for (const route of measuredRoutes) {
  console.log(
    `- ${route.sourcePath}: ${formatKilobytes(route.rawBytes)} raw / ${formatKilobytes(route.gzipBytes)} gzip`,
  )
}

console.log(
  `Per-route budget: ${formatKilobytes(routeBudgets.rawBytes)} raw / ${formatKilobytes(routeBudgets.gzipBytes)} gzip`,
)

const oversizedRoute = measuredRoutes.find(
  (route) =>
    getExceededMeasurements(route, routeBudgets).length > 0,
)

if (oversizedRoute) {
  throw new Error(
    `${oversizedRoute.sourcePath} exceeds the lazy route budget.`,
  )
}

const deferredDependencyEntries = Object.entries(manifest).filter(
  ([sourcePath, entry]) =>
    sourcePath.startsWith('node_modules/') &&
    entry.isDynamicEntry,
)
const measuredDeferredDependencies = await Promise.all(
  deferredDependencyEntries.map(async ([sourcePath, entry]) => ({
    sourcePath,
    ...(await measureAssetPaths(
      new Set([entry.file, ...(entry.css ?? [])]),
    )),
  })),
)

console.log('\nDeferred dependencies')

for (const dependency of measuredDeferredDependencies) {
  console.log(
    `- ${dependency.sourcePath}: ${formatKilobytes(dependency.rawBytes)} raw / ${formatKilobytes(dependency.gzipBytes)} gzip`,
  )
}

console.log(
  `Per-dependency budget: ${formatKilobytes(deferredDependencyBudgets.rawBytes)} raw / ${formatKilobytes(deferredDependencyBudgets.gzipBytes)} gzip`,
)

const oversizedDependency = measuredDeferredDependencies.find(
  (dependency) =>
    getExceededMeasurements(
      dependency,
      deferredDependencyBudgets,
    ).length > 0,
)

if (oversizedDependency) {
  throw new Error(
    `${oversizedDependency.sourcePath} exceeds the deferred dependency budget.`,
  )
}
