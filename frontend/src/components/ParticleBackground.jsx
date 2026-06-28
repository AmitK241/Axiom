/**
 * ParticleBackground.jsx — AXIOM Premium Particle Field v2
 * Features:
 * - Smooth cursor repulsion with spring-back to original drift
 * - Premium glow + twinkle
 * - Dense but performant particle count
 * - Particles snap back smoothly after cursor leaves
 */

import { useEffect, useRef } from 'react'
import { NAV_HEIGHT } from './Navbar'

const COLORS  = ['#c084fc', '#a855f7', '#7c3aed', '#818cf8', '#e879f9', '#38bdf8', '#ffffff']
const WEIGHTS = [0.25, 0.22, 0.18, 0.13, 0.10, 0.07, 0.05]

const N          = 270    // sweet spot — dense + smooth
const CONN_DIST  = 125    // connection line max distance
const REPEL_R    = 100    // cursor repel radius (px)
const REPEL_F    = 6.0    // repel push strength
const BASE_SPEED = 1.85   // natural drift speed
const SNAPBACK   = 80    // ms delay before snapping back after repel

function pickColor() {
  let r = Math.random(), acc = 0
  for (let i = 0; i < WEIGHTS.length; i++) {
    acc += WEIGHTS[i]
    if (r < acc) return COLORS[i]
  }
  return COLORS[0]
}

export default function ParticleBackground() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let rafId
    const mouse   = { x: -9999, y: -9999 }
    let mouseLeft = 0   // timestamp when cursor left a particle's radius

    const resize = () => {
      canvas.width  = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    // Each particle has:
    //   bvx/bvy  — base drift velocity (what it naturally wants to do)
    //   vx/vy    — current velocity (gets pushed by cursor)
    //   repelledAt — timestamp when last repelled (for snapback timing)
    const particles = Array.from({ length: N }, () => {
      const bvx = (Math.random() - 0.5) * BASE_SPEED
      const bvy = (Math.random() - 0.5) * BASE_SPEED
      return {
        x:   Math.random() * window.innerWidth,
        y:   Math.random() * window.innerHeight,
        vx:  bvx,
        vy:  bvy,
        bvx, bvy,
        r:   0.7 + Math.random() * 1.7,
        col: pickColor(),
        alpha:      0.18 + Math.random() * 0.48,
        tp:         Math.random() * Math.PI * 2,
        tf:         0.00018 + Math.random() * 0.00042,
        repelledAt: -1,
        wasRepelled: false,
      }
    })

    const onMove  = e => { mouse.x = e.clientX; mouse.y = e.clientY }
    const onLeave = () => { mouse.x = -9999; mouse.y = -9999 }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseleave', onLeave)

    const frame = (now) => {
      const w = canvas.width, h = canvas.height
      ctx.clearRect(0, 0, w, h)

      for (const p of particles) {
        const mx  = p.x - mouse.x
        const my  = p.y - mouse.y
        const md  = Math.sqrt(mx * mx + my * my)
        const inRange = md < REPEL_R && md > 0.5

        if (inRange) {
          // Push particle away from cursor
          const force = ((REPEL_R - md) / REPEL_R) * REPEL_F
          p.vx += (mx / md) * force * 0.10
          p.vy += (my / md) * force * 0.10
          p.repelledAt  = now
          p.wasRepelled = true
        } else if (p.wasRepelled) {
          // How long since repulsion ended?
          const sinceLast = now - p.repelledAt

          if (sinceLast < SNAPBACK) {
            // Still within snapback window — hold displaced position, coast gently
            p.vx *= 0.92
            p.vy *= 0.92
          } else {
            // Snapback window passed — spring smoothly back to base drift
            const snapStrength = Math.min((sinceLast - SNAPBACK) / 400, 1)
            p.vx = p.vx * (1 - snapStrength * 0.12) + p.bvx * (snapStrength * 0.12)
            p.vy = p.vy * (1 - snapStrength * 0.12) + p.bvy * (snapStrength * 0.12)

            // Once velocity is close enough to base, stop tracking
            const dvx = Math.abs(p.vx - p.bvx)
            const dvy = Math.abs(p.vy - p.bvy)
            if (dvx < 0.01 && dvy < 0.01) {
              p.vx = p.bvx
              p.vy = p.bvy
              p.wasRepelled = false
            }
          }
        }

        // Hard speed cap so particles never fly off screen
        const spd = Math.sqrt(p.vx * p.vx + p.vy * p.vy)
        if (spd > 5.5) { p.vx = (p.vx / spd) * 5.5; p.vy = (p.vy / spd) * 5.5 }

        // Move + edge wrap
        p.x += p.vx
        p.y += p.vy
        if (p.x < -12) p.x = w + 12
        if (p.x > w + 12) p.x = -12
        if (p.y < -12) p.y = h + 12
        if (p.y > h + 12) p.y = -12
      }

      // ── Connection lines ──────────────────────────────────────────
      for (let i = 0; i < N; i++) {
        for (let j = i + 1; j < N; j++) {
          const a = particles[i], b = particles[j]
          const dx = a.x - b.x, dy = a.y - b.y
          const d  = Math.sqrt(dx * dx + dy * dy)
          if (d < CONN_DIST) {
            // Fade lines near nav exclusion zone (use midpoint y)
            const midY     = (a.y + b.y) * 0.5
            const navFade  = Math.min(Math.max((midY - NAV_HEIGHT * 0.4) / (NAV_HEIGHT * 0.6), 0), 1)
            const lineAlpha = 0.11 * (1 - d / CONN_DIST) * navFade
            if (lineAlpha < 0.001) continue
            ctx.beginPath()
            ctx.moveTo(a.x, a.y)
            ctx.lineTo(b.x, b.y)
            ctx.strokeStyle = `rgba(139,92,246,${lineAlpha})`
            ctx.lineWidth   = 0.55
            ctx.stroke()
          }
        }
      }

      // ── Particles with glow + twinkle ─────────────────────────────
      for (const p of particles) {
        const tw    = 0.62 + 0.38 * Math.sin(now * p.tf + p.tp)
        // Nav exclusion zone: fade out particles in top NAV_HEIGHT px
        // 0 at y=0, ramps to 1 at y=NAV_HEIGHT+16 (soft edge)
        const navFade = Math.min(Math.max((p.y - NAV_HEIGHT * 0.4) / (NAV_HEIGHT * 0.6), 0), 1)
        const alpha = Math.min(p.alpha * tw * navFade, 0.82)

        ctx.save()
        ctx.globalAlpha = alpha
        ctx.shadowBlur  = p.r > 1.5 ? 56 : 32
        ctx.shadowColor = p.col
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = p.col
        ctx.fill()
        ctx.restore()
      }

      rafId = requestAnimationFrame(frame)
    }

    rafId = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseleave', onLeave)
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
        zIndex:        0,
        pointerEvents: 'none',
        display:       'block',
      }}
    />
  )
}