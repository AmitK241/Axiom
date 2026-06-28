/**
 * gen-lowres.mjs — Pre-bake 5 000-vertex lowres point clouds
 * ─────────────────────────────────────────────────────────────
 * Run once:  node scripts/gen-lowres.mjs
 *
 * Produces:
 *   frontend/public/data/brainPoints.lowres.json   (~60 KB)
 *   frontend/public/data/globePoints.lowres.json   (~60 KB)
 *   frontend/public/data/blobPoints.lowres.json    (~60 KB)
 *
 * These are evenly-subsampled from the full 12-14k vertex originals.
 * Pre-baking vs runtime subsampling preserves consistent density
 * distribution — runtime sampling of a low-poly source produces visible
 * clumping at the poles/fissures.
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { resolve, dirname }            from 'node:path'
import { fileURLToPath }               from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR  = resolve(__dirname, '../frontend/public/data')

/**
 * Deterministically subsample a flat [x,y,z,...] array to N vertices.
 * Uses uniform stride so vertex density is preserved globally, not
 * concentrated at array-start.
 */
function subsample(arr, N) {
  const srcN = Math.floor(arr.length / 3)
  if (srcN <= N) {
    console.warn(`  ⚠  source only has ${srcN} verts, requested ${N} — returning all`)
    return arr.slice()
  }
  const step = srcN / N
  const out  = new Array(N * 3)
  for (let i = 0; i < N; i++) {
    const j      = Math.floor(i * step) * 3
    out[i * 3]   = arr[j]
    out[i * 3+1] = arr[j + 1]
    out[i * 3+2] = arr[j + 2]
  }
  return out
}

const TARGET_N = 5000

for (const name of ['brainPoints', 'globePoints', 'blobPoints']) {
  const srcPath = resolve(DATA_DIR, `${name}.json`)
  const dstPath = resolve(DATA_DIR, `${name}.lowres.json`)

  console.log(`Processing ${name}.json …`)
  const data = JSON.parse(readFileSync(srcPath, 'utf8'))
  const sub  = subsample(data, TARGET_N)

  writeFileSync(dstPath, JSON.stringify(sub))
  const srcKB = (readFileSync(srcPath).length / 1024).toFixed(0)
  const dstKB = (Buffer.byteLength(JSON.stringify(sub)) / 1024).toFixed(1)
  console.log(`  ✓  ${name}.lowres.json  ${TARGET_N} verts  ${dstKB} KB  (source: ${srcKB} KB)`)
}

console.log('\nDone. 3 lowres files written to frontend/public/data/')
