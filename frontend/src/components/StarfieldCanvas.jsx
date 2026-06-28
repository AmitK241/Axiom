/**
 * StarfieldCanvas.jsx — AXIOM Ambient Starfield (v2)
 * ─────────────────────────────────────────────────────────────────────────────
 * Full-viewport fixed canvas, z-index: 0.
 * Enforces: position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
 *            pointer-events: none; z-index: -1 (below particle canvas)
 *
 * v2 changes:
 *   - Zone-stratified placement: viewport divided into 7×5 grid, one star
 *     seeded per cell + random offset. Guarantees no blank corners.
 *   - 280 stars total for richer field at high-DPI screens
 *   - Color variety: 85% white, 8% blue-tint, 4% purple-tint, 3% gold
 *   - Slow drift with full-viewport wrapping (no off-canvas dead zones)
 */

import { useEffect, useRef } from 'react'

const COLS      = 8
const ROWS      = 5
const EXTRA     = 80   // random extras on top of the grid to fill gaps
const MAX_ALPHA = 0.36
const MIN_ALPHA = 0.04
const STAR_COLORS = [
  { hex: '#ffffff', weight: 0.82 },
  { hex: '#bfdbfe', weight: 0.09 },  // blue-tint
  { hex: '#ddd6fe', weight: 0.05 },  // purple-tint
  { hex: '#fef3c7', weight: 0.04 },  // gold-tint
]

function pickStarColor() {
  const r = Math.random()
  let acc = 0
  for (const c of STAR_COLORS) {
    acc += c.weight
    if (r < acc) return c.hex
  }
  return '#ffffff'
}

function makeStar(x, y) {
  return {
    x,
    y,
    r:         0.25 + Math.random() * 1.1,
    vx:        (Math.random() - 0.5) * 0.055,
    vy:        (Math.random() - 0.5) * 0.045,
    phase:     Math.random() * Math.PI * 2,
    freq:      0.00015 + Math.random() * 0.00035,
    baseAlpha: MIN_ALPHA + Math.random() * (MAX_ALPHA - MIN_ALPHA),
    color:     pickStarColor(),
  }
}

function buildStars(W, H) {
  const stars = []

  // Zone-stratified: guarantee coverage in every cell
  const cellW = W / COLS
  const cellH = H / ROWS
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      stars.push(makeStar(
        col * cellW + Math.random() * cellW,
        row * cellH + Math.random() * cellH,
      ))
    }
  }

  // Additional random stars for density variety
  for (let i = 0; i < EXTRA; i++) {
    stars.push(makeStar(Math.random() * W, Math.random() * H))
  }

  return stars
}

export default function StarfieldCanvas() {
  const canvasRef = useRef(null)
  const rafRef    = useRef(null)
  const starsRef  = useRef([])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const resize = () => {
      canvas.width  = window.innerWidth
      canvas.height = window.innerHeight
      starsRef.current = buildStars(canvas.width, canvas.height)
    }

    resize()
    window.addEventListener('resize', resize)

    const draw = (now) => {
      const ctx = canvas.getContext('2d')
      const W   = canvas.width
      const H   = canvas.height
      ctx.clearRect(0, 0, W, H)

      for (const s of starsRef.current) {
        // Gentle drift
        s.x += s.vx
        s.y += s.vy
        // Seamless wrap at exact viewport edges
        if (s.x < 0)    s.x += W
        if (s.x > W)    s.x -= W
        if (s.y < 0)    s.y += H
        if (s.y > H)    s.y -= H

        // Smooth twinkle oscillation
        const twinkle = 0.5 + 0.5 * Math.sin(now * s.freq + s.phase)
        const alpha   = s.baseAlpha * (0.50 + 0.50 * twinkle)

        ctx.save()
        ctx.globalAlpha = Math.min(alpha, MAX_ALPHA)
        ctx.shadowBlur  = s.r > 0.9 ? 4 : 0   // only larger stars glow
        ctx.shadowColor = s.color
        ctx.fillStyle   = s.color
        ctx.beginPath()
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      }

      rafRef.current = requestAnimationFrame(draw)
    }

    rafRef.current = requestAnimationFrame(draw)

    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(rafRef.current)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position:      'fixed',
        top:           0,
        left:          0,
        width:         '100vw',
        height:        '100vh',
        zIndex:        -1,   // strictly below ParticleBackground (zIndex: 0)
        pointerEvents: 'none',
        display:       'block',
      }}
    />
  )
}
