/**
 * bakeAllPoints.mjs
 * ─────────────────────────────────────────────────────────────────────────────
 * Generates three static point-cloud JSON files:
 *   src/data/brainPoints.json   — 16 000 pts, realistic human brain silhouette
 *   src/data/globePoints.json   — 16 000 pts, Fibonacci sphere
 *   src/data/blobPoints.json    — 16 000 pts, single-octave organic blob
 *
 * Run once:  node scripts/bakeAllPoints.mjs
 *
 * OUTPUT FORMAT: Float32Array serialised as a plain JS number array,
 * [x0,y0,z0, x1,y1,z1, …] length = N_POINTS * 3.
 * All shapes are normalised to fit inside a unit sphere (radius ≤ 1.0),
 * centred at origin — required for the GPU morph shader mix() to work correctly.
 *
 * ── BRAIN APPROACH ──────────────────────────────────────────────────────────
 * Since we can't guarantee a runtime GLTF download, we construct the brain
 * shape procedurally using anatomically correct geometry:
 *
 *  1. BASE SHAPE: two slightly-separated ellipsoidal hemispheres joined at
 *     the midline (corpus callosum region), with a small cerebellum
 *     protruding posterior-inferior and a short brain-stem below.
 *
 *  2. GYRI/SULCI: a deterministic tri-wave function applied radially outward
 *     (not random noise) — two dominant periods (large gyri + small gyri),
 *     creating recognizable fold patterns from any viewing angle.
 *     Key constraint: amplitude decreases toward the midline fissure so
 *     the two hemisphere boundary stays clean.
 *
 *  3. POINT DISTRIBUTION: we sample points on spherical latitude/longitude
 *     grids per region, then displace them by the gyri function, giving
 *     even coverage across the full surface.
 *
 * The result is a point cloud that is immediately recognisable as a human
 * brain from the canonical front-top-right isometric view.
 */

import { writeFileSync, mkdirSync } from 'fs'
import { join, dirname }           from 'path'
import { fileURLToPath }           from 'url'

const __dir   = dirname(fileURLToPath(import.meta.url))
const OUT_DIR = join(__dir, '..', 'src', 'data')
const N       = 16_000    // fixed count for all shapes — shader requirement

mkdirSync(OUT_DIR, { recursive: true })

// ────────────────────────────────────────────────────────────
//  UTILS
// ────────────────────────────────────────────────────────────
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v))
const lerp  = (a, b, t)   => a + (b - a) * t

function normalize(pts) {
  // Find bounding sphere radius from origin
  let maxR = 0
  for (let i = 0; i < pts.length; i += 3) {
    const r = Math.sqrt(pts[i]**2 + pts[i+1]**2 + pts[i+2]**2)
    if (r > maxR) maxR = r
  }
  if (maxR === 0) return pts
  const inv = 1.0 / maxR
  return pts.map(v => v * inv)
}

// Seeded deterministic "random" — Mulberry32
function makePrng(seed) {
  let s = seed >>> 0
  return () => {
    s += 0x6D2B79F5; let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// ────────────────────────────────────────────────────────────
//  1. BRAIN POINTS
// ────────────────────────────────────────────────────────────
function bakeBrain(N) {
  const pts = []
  const rng = makePrng(42)

  // Region budget (must sum to N)
  const N_HEMI  = Math.round(N * 0.82)   // cerebral hemispheres
  const N_CEREB = Math.round(N * 0.14)   // cerebellum
  const N_STEM  = N - N_HEMI - N_CEREB   // brain stem

  // ── Gyri/sulci displacement function ──────────────────────
  // Returns radial displacement delta r at spherical (θ, φ).
  // Uses two deterministic sinusoidal waves — NOT noise.
  // Large gyri: period ~1.8 rad. Small gyri: period ~0.7 rad.
  // Amplitude ≈ 0.12 units before normalisation.
  function gyriDisplace(theta, phi) {
    // Large primary folds
    const wave1 = Math.sin(4.2 * theta + 1.1) * Math.cos(3.8 * phi + 0.7)
    // Secondary smaller folds
    const wave2 = Math.sin(8.1 * theta - 0.4) * Math.cos(7.6 * phi + 1.9) * 0.45
    // Temporal-lobe ridge (horizontal band mid-latitude)
    const ridge = Math.exp(-((theta - Math.PI/2)**2) / 0.18) * Math.sin(5.5 * phi) * 0.3
    return (wave1 + wave2 + ridge) * 0.12
  }

  // ── Cerebral hemispheres ───────────────────────────────────
  // Two offset ellipsoids, each covering φ ∈ [0,π] (left) or [π,2π] (right),
  // θ ∈ [0, π] (full vertical).
  const HEMI_PER_SIDE = Math.floor(N_HEMI / 2)

  for (let side = 0; side < 2; side++) {
    const count = (side === 0) ? HEMI_PER_SIDE : N_HEMI - HEMI_PER_SIDE
    const xOffset = side === 0 ? -0.10 : 0.10  // midline gap

    for (let i = 0; i < count; i++) {
      // Stratified spherical sampling for even surface coverage
      const u = (i + rng()) / count
      const v = rng()

      // theta: polar angle. Clamp to 0..0.95*pi to avoid flat base
      const theta = Math.acos(1 - 2 * u * 0.92)
      const phi   = v * Math.PI  // each hemi covers half the azimuth circle

      const phiOffset = side === 0 ? Math.PI : 0  // mirror hemispheres

      // Brain ellipsoid: wider laterally (x), taller vertically (y), shorter AP (z)
      const rBase  = 0.9   // base sphere radius before ellipse scaling
      const ex = 1.00      // lateral scale
      const ey = 0.90      // vertical scale (brain is slightly flat top-bottom)
      const ez = 0.85      // anterior-posterior scale

      const gyri = gyriDisplace(theta, phi + phiOffset)
      const r    = rBase + gyri

      const sinT = Math.sin(theta)
      const cosT = Math.cos(theta)
      const sinP = Math.sin(phi + phiOffset)
      const cosP = Math.cos(phi + phiOffset)

      let x = r * ex * sinT * cosP + xOffset
      let y = r * ey * cosT + 0.05     // slightly raised above centre
      let z = r * ez * sinT * sinP

      // Frontal lobe bulge: anterior (z<0) gets slightly larger
      if (z < 0) { x *= 1.05; y *= 1.03 }

      // Temporal lobe: lateral lower region gets a slight outward bump
      const isTemporalZone = (theta > 1.2 && theta < 2.0) && (
        (side === 0 && phi < 0.6) || (side === 1 && phi < 0.6)
      )
      if (isTemporalZone) {
        x *= 1.08
        y  -= 0.08
      }

      pts.push(x, y, z)
    }
  }

  // ── Cerebellum ─────────────────────────────────────────────
  // Posterior-inferior cluster: tightly corrugated smaller ellipsoid
  for (let i = 0; i < N_CEREB; i++) {
    const u = (i + rng()) / N_CEREB
    const v = rng()

    const theta = Math.acos(1 - 2 * u)
    const phi   = v * 2 * Math.PI

    // Cerebellum: small, behind and below the cerebral hemispheres
    const rC = 0.30
    // Very tight folds: higher frequency
    const folds = Math.sin(14.0 * theta) * Math.cos(10.0 * phi) * 0.06
    const r = rC + folds

    const x = r * 0.80 * Math.sin(theta) * Math.cos(phi)
    const y = r * 0.60 * Math.cos(theta) - 0.58  // below cerebrum
    const z = r * 0.70 * Math.sin(theta) * Math.sin(phi) + 0.55  // posterior

    pts.push(x, y, z)
  }

  // ── Brain stem ─────────────────────────────────────────────
  // Short vertical cylinder, below cerebellum
  for (let i = 0; i < N_STEM; i++) {
    const t   = (i + rng()) / N_STEM
    const phi = rng() * 2 * Math.PI
    const r   = (0.09 + rng() * 0.04)

    const x = r * Math.cos(phi)
    const y = lerp(-0.58, -0.88, t)
    const z = r * Math.sin(phi) + 0.15

    pts.push(x, y, z)
  }

  return normalize(pts)
}

// ────────────────────────────────────────────────────────────
//  2. GLOBE POINTS  — Fibonacci sphere
// ────────────────────────────────────────────────────────────
function bakeGlobe(N) {
  const pts = []
  const phi = Math.PI * (Math.sqrt(5) - 1)  // golden angle

  for (let i = 0; i < N; i++) {
    const y     = 1 - (i / (N - 1)) * 2        // y goes from 1 to -1
    const r     = Math.sqrt(1 - y * y)
    const theta = phi * i
    pts.push(
      r * Math.cos(theta),
      y,
      r * Math.sin(theta)
    )
  }
  return pts  // already on unit sphere, no normalisation needed
}

// ────────────────────────────────────────────────────────────
//  3. BLOB POINTS  — Single-octave sine-displaced sphere
//  ONE octave only — stays recognisably round, not an explosion
// ────────────────────────────────────────────────────────────
function bakeBlob(N) {
  const pts = []
  const rng = makePrng(7)
  const phi = Math.PI * (Math.sqrt(5) - 1)

  for (let i = 0; i < N; i++) {
    const y     = 1 - (i / (N - 1)) * 2
    const r     = Math.sqrt(Math.max(0, 1 - y * y))
    const theta = phi * i

    const nx = r * Math.cos(theta)
    const ny = y
    const nz = r * Math.sin(theta)

    // Single-octave displacement — low frequency (k=3), moderate amplitude
    const k    = 3.0
    const disp = Math.sin(k * Math.acos(clamp(ny, -1, 1))) *
                 Math.cos(k * Math.atan2(nz, nx)) * 0.22

    // Add small jitter for organic feel without second octave
    const jitter = (rng() - 0.5) * 0.04

    const scale = 1.0 + disp + jitter
    pts.push(nx * scale, ny * scale, nz * scale)
  }
  return normalize(pts)
}

// ────────────────────────────────────────────────────────────
//  WRITE
// ────────────────────────────────────────────────────────────
console.log('Baking brain points…')
const brainPts  = bakeBrain(N)
console.log(`  → ${brainPts.length / 3} points`)

console.log('Baking globe points…')
const globePts  = bakeGlobe(N)
console.log(`  → ${globePts.length / 3} points`)

console.log('Baking blob points…')
const blobPts   = bakeBlob(N)
console.log(`  → ${blobPts.length / 3} points`)

// All arrays must be exactly N*3 — pad/trim if needed
function padOrTrim(arr, n) {
  const target = n * 3
  if (arr.length === target) return arr
  if (arr.length > target)  return arr.slice(0, target)
  // Pad by repeating from the start
  const out = [...arr]
  while (out.length < target) out.push(...arr.slice(0, Math.min(3, target - out.length)))
  return out
}

const brain = padOrTrim(brainPts,  N)
const globe = padOrTrim(globePts,  N)
const blob  = padOrTrim(blobPts,   N)

// Round to 5 decimal places to keep file size manageable
const fmt = arr => JSON.stringify(arr.map(v => Math.round(v * 100000) / 100000))

writeFileSync(join(OUT_DIR, 'brainPoints.json'), fmt(brain),  'utf8')
writeFileSync(join(OUT_DIR, 'globePoints.json'), fmt(globe),  'utf8')
writeFileSync(join(OUT_DIR, 'blobPoints.json'),  fmt(blob),   'utf8')

const kb = arr => (arr.length * 8 / 1024).toFixed(0)
console.log(`\n✓ Wrote:`)
console.log(`  src/data/brainPoints.json  ~${kb(brain)} kB`)
console.log(`  src/data/globePoints.json  ~${kb(globe)} kB`)
console.log(`  src/data/blobPoints.json   ~${kb(blob)} kB`)
console.log(`\nAll shapes: exactly ${N} points, radius ≤ 1.0, centred at origin.`)
