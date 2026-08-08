import { readFile } from 'node:fs/promises'
import { gzipSync } from 'node:zlib'

const distRoot = new URL('../dist/', import.meta.url)
const indexUrl = new URL('index.html', distRoot)
const indexHtml = await readFile(indexUrl, 'utf8')
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

function formatKilobytes(bytes) {
  return `${(bytes / 1000).toFixed(2)} kB`
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

const exceededBudgets = Object.entries(budgets).filter(
  ([measurement, budget]) =>
    totals[measurement] > budget,
)

if (exceededBudgets.length > 0) {
  const labels = exceededBudgets
    .map(([measurement]) => measurement)
    .join(' and ')

  throw new Error(
    `The initial production bundle exceeds its ${labels} budget.`,
  )
}
