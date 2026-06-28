/**
 * BlindSpotScore.jsx — "Spark blind spot moments" (Rule-Compliant Edition)
 *
 * Layout (RULE 2 — 50/50 split):
 *   Desktop: Two-column flex row.
 *     Left  ~45% — text block: section headline, subtext, 3-dimension bars,
 *       per-assumption score rows, "Reveal Blind Spot" button.
 *       Glass panel treatment (RULE 3) around the entire left content block.
 *     Right ~55% — ParticleLayer shape="blob" at minimumVisibleDensity,
 *       edge-to-edge. Blob is VISIBLE AT IDLE (not empty void).
 *       Score counter appears in the right column, centered over the particle
 *       visual AFTER ignite, with an exclusion zone so the flare doesn't
 *       wash out the number.
 *
 *   Mobile: Vertical stack — text/controls on top, particle band below.
 *
 * Ignite sequence (RULE 4 timing):
 *   1. User clicks "Reveal Blind Spot" → igniteOn=true
 *   2. ParticleLayer blob fires:  dim → full color over 400ms
 *      bloom 0.4 → 1.4 → 1.1 (brief flare, settle at 1.1)
 *   3. Score counter ticks 0 → real score with easeOutCubic
 *   4. Score text rect is registered as an exclusion zone in the particle
 *      canvas so the ignite flare CANNOT wash out the revealed number.
 *
 * Architecture note on the score exclusion zone:
 *   The score numeral is positioned inside the right (particle) column.
 *   After ignite the score div's getBoundingClientRect() is computed
 *   relative to the ParticleLayer container and passed as exclusionRects.
 *   Because ParticleLayer 3D uses the CSS mask approach (opaque overlay div),
 *   the mask is transparent (matching the column bg) NOT var(--void), so it
 *   only blocks the particle canvas without obscuring the number.
 *   This works because the score sits on top of the particle canvas via z-index.
 */
import { useState, useEffect, useRef, useCallback } from 'react'

const easeOutCubic = t => 1 - Math.pow(1 - t, 3)
const CUBIC = 'cubic-bezier(0.4,0,0.2,1)'

const GLASS_PANEL = {
  background:           'rgba(0,0,0,0.62)',
  backdropFilter:       'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border:               '1px solid rgba(255,255,255,0.08)',
  borderRadius:         20,
}

const RISK_COLOR = {
  catastrophic: '#ef4444',
  high:         '#f97316',
  medium:       '#eab308',
  low:          '#22c55e',
}

function playIgniteTick() {
  try {
    const ctx  = new (window.AudioContext || window.webkitAudioContext)()
    const osc  = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain); gain.connect(ctx.destination)
    osc.type = 'sine'
    osc.frequency.setValueAtTime(200, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.06)
    gain.gain.setValueAtTime(0.07, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.08)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.09)
    osc.onended = () => ctx.close()
  } catch {}
}

// ── Score counter — easeOutCubic 0→target ──────────────────────────────────
function ScoreCounter({ target, color }) {
  const [display, setDisplay] = useState(0)
  const rafRef   = useRef(null)
  const startRef = useRef(null)

  useEffect(() => {
    if (target == null) return
    const dur = 1000
    startRef.current = performance.now()
    const tick = now => {
      const t = Math.min((now - startRef.current) / dur, 1)
      setDisplay(Math.round(easeOutCubic(t) * target))
      if (t < 1) rafRef.current = requestAnimationFrame(tick)
      else        setDisplay(target)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => rafRef.current && cancelAnimationFrame(rafRef.current)
  }, [target])

  return (
    <div style={{
      fontSize:          72,
      fontWeight:        200,
      letterSpacing:     '-0.04em',
      color,
      fontVariantNumeric:'tabular-nums',
      lineHeight:        1,
    }}>
      {display}
      <span style={{ fontSize: 22, color: 'var(--smoke)', fontWeight: 400 }}>/100</span>
    </div>
  )
}

// ── Animated dimension bar ──────────────────────────────────────────────────
function DimBar({ label, value, delay }) {
  const [width, setWidth] = useState(0)
  useEffect(() => {
    const t = setTimeout(() => setWidth(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 11, color: '#e2e8f0', fontWeight: '600', letterSpacing: '0.04em' }}>{label}</span>
        <span style={{ fontSize: 11, color: 'var(--plum-voltage)', fontVariantNumeric: 'tabular-nums' }}>{value}</span>
      </div>
      <div style={{ height: 2, borderRadius: 2, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: 2,
          background: 'var(--plum-voltage)',
          width: `${width}%`,
          transition: `width 700ms ${CUBIC}`,
        }} />
      </div>
    </div>
  )
}

// ── Main component ──────────────────────────────────────────────────────────
export default function BlindSpotScore({ results }) {
  const [barsVisible, setBarsVisible] = useState(false)

  const overallScore = results.overall_blind_spot_score

  // Auto-reveal bars on mount (no button needed in borderless layout)
  useEffect(() => {
    const t = setTimeout(() => setBarsVisible(true), 300)
    return () => clearTimeout(t)
  }, [])

  // Compute dimension averages
  const dims = results.results.reduce((acc, r) => {
    const s = r.blind_spot_score
    acc.hiddenness += r.assumption.confidence || 50
    acc.evidence   += s.score
    acc.paradigm   +=
      s.risk_level === 'catastrophic' ? 95 :
      s.risk_level === 'high'         ? 75 :
      s.risk_level === 'medium'       ? 50 : 25
    return acc
  }, { hiddenness: 0, evidence: 0, paradigm: 0 })
  const count = results.results.length || 1
  const hid = Math.round(dims.hiddenness / count)
  const evi = Math.round(dims.evidence   / count)
  const par = Math.round(dims.paradigm   / count)

  const verdict = overallScore > 70
    ? '🔴 Critical epistemic risk — foundational assumptions are highly vulnerable'
    : overallScore > 45
    ? '🟡 Moderate blind spot detected — key assumptions need examination'
    : '🟢 Relatively low blind spot risk — assumptions are reasonably grounded'

  return (
    <div style={{ textAlign: 'center', padding: '8px 0 24px' }}>

      {/* ── Heading ── */}
      <h2 style={{
        fontSize: 'clamp(2rem, 4vw, 3rem)',
        fontWeight: '800',
        letterSpacing: '-0.02em',
        lineHeight: 1.15,
        margin: '0 0 10px',
        fontFamily: "'Space Grotesk','Inter',sans-serif",
      }}>
        <span style={{ color: '#ffffff' }}>Spark</span>{' '}
        <span style={{
          background: 'linear-gradient(90deg, #a78bfa, #818cf8, #38bdf8, #34d399)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>blind spot moments</span>
      </h2>

      {/* ── Subtitle ── */}
      <p style={{
        fontSize: '1.05rem', fontWeight: '500',
        color: '#94a3b8', marginBottom: 36,
        fontFamily: 'Inter,sans-serif',
      }}>
        Where the analysis identified the deepest cognitive traps.
      </p>

      {/* ── Overall score (hero number) ── */}
      <div style={{ marginBottom: 8 }}>
        <span style={{
          display: 'block',
          fontSize: 'clamp(3.5rem, 6vw, 5rem)',
          fontWeight: '800',
          lineHeight: 1,
          fontFamily: "'Space Grotesk','Inter',sans-serif",
          fontVariantNumeric: 'tabular-nums',
          background: 'linear-gradient(135deg, #fb923c, #f59e0b)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>
          {overallScore}
        </span>
        <span style={{
          display: 'block', marginTop: 4,
          fontSize: '0.75rem', fontWeight: '600',
          color: '#64748b', letterSpacing: '0.1em',
          textTransform: 'uppercase',
        }}>
          Overall Blind Spot Score
        </span>
      </div>

      {/* ── Verdict text ── */}
      <p style={{
        fontSize: '1rem', fontWeight: '500',
        color: '#e2e8f0', marginBottom: 40,
        lineHeight: 1.6, fontFamily: 'Inter,sans-serif',
      }}>
        {verdict}
      </p>

      {/* ── 3-Dimension Breakdown ── */}
      <div style={{ maxWidth: 480, margin: '0 auto 32px', textAlign: 'left' }}>
        {/* Label */}
        <div style={{
          fontSize: '0.7rem', fontWeight: '700', letterSpacing: '0.15em',
          textTransform: 'uppercase', marginBottom: 16, textAlign: 'center',
          background: 'linear-gradient(90deg, #a78bfa, #38bdf8)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>
          3-Dimension Breakdown
        </div>

        {/* Bars */}
        {[
          { label: 'Hiddenness',        value: hid, delay: 0   },
          { label: 'Evidence Weakness', value: evi, delay: 150 },
          { label: 'Paradigm Impact',   value: par, delay: 300 },
        ].map(({ label, value, delay }) => (
          <DimBar key={label} label={label} value={value} delay={barsVisible ? delay : 99999} />
        ))}
      </div>

      {/* ── Per-assumption scores ── */}
      <div style={{ maxWidth: 480, margin: '0 auto' }}>
        {/* Label */}
        <div style={{
          fontSize: '0.7rem', fontWeight: '700', letterSpacing: '0.12em',
          textTransform: 'uppercase', marginBottom: 12, textAlign: 'center',
          background: 'linear-gradient(90deg, #f472b6, #a78bfa)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>
          Per-Assumption Scores
        </div>

        {results.results.map((r, i) => {
          const s = r.blind_spot_score
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <span style={{
                fontSize: '0.85rem', fontFamily: 'monospace',
                color: '#fb923c', fontWeight: '700',
                fontVariantNumeric: 'tabular-nums', minWidth: 26, textAlign: 'right',
              }}>
                {s.score}
              </span>
              <div style={{ flex: 1, height: 2, borderRadius: 2, background: 'rgba(255,255,255,0.08)' }}>
                <div style={{
                  height: '100%', borderRadius: 2,
                  background: 'var(--plum-voltage)',
                  width: `${s.score}%`, transition: 'width 700ms ease',
                }} />
              </div>
              <span style={{
                fontSize: '0.8rem', color: '#94a3b8', fontWeight: '400',
                maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {r.assumption.assumption.slice(0, 35)}…
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}



// ── ScoreArc — semi-circle neon arc meter (named export for ResultsPage) ─────
export function ScoreArc({ score = 0, size = 200 }) {
  const [display, setDisplay] = useState(0)
  const rafRef   = useRef(null)
  const startRef = useRef(null)

  useEffect(() => {
    if (score == null) return
    const dur = 1400
    startRef.current = performance.now()
    const tick = now => {
      const t = Math.min((now - startRef.current) / dur, 1)
      setDisplay(Math.round(easeOutCubic(t) * score))
      if (t < 1) rafRef.current = requestAnimationFrame(tick)
      else        setDisplay(score)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => rafRef.current && cancelAnimationFrame(rafRef.current)
  }, [score])

  const scoreColor =
    score > 70 ? '#ef4444' :
    score > 45 ? '#f97316' : '#22c55e'

  const cx = size / 2
  const cy = size * 0.62
  const r  = size * 0.38
  const circumference = Math.PI * r
  const filled = circumference * (score / 100)
  const gap    = circumference - filled
  const startX = cx - r, startY = cy
  const endX   = cx + r, endY   = cy

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <div style={{
        fontSize: 9, fontWeight: '700', letterSpacing: '0.14em',
        textTransform: 'uppercase', marginBottom: 2,
        background: 'linear-gradient(90deg, #f472b6, #fb923c)',
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
      }}>Final Cognitive Audit Score</div>

      <svg
        width={size} height={size * 0.72}
        viewBox={`0 0 ${size} ${size * 0.72}`}
        className="arc-glow"
        style={{ overflow: 'visible' }}
      >
        <path
          d={`M ${startX} ${startY} A ${r} ${r} 0 0 1 ${endX} ${endY}`}
          fill="none" stroke="rgba(255,255,255,0.07)"
          strokeWidth={size * 0.06} strokeLinecap="round"
        />
        <path
          d={`M ${startX} ${startY} A ${r} ${r} 0 0 1 ${endX} ${endY}`}
          fill="none" stroke={scoreColor}
          strokeWidth={size * 0.06} strokeLinecap="round"
          strokeDasharray={`${circumference}`}
          strokeDashoffset={`${gap}`}
          style={{ transition: 'stroke-dashoffset 1.4s cubic-bezier(0.4,0,0.2,1)' }}
        />
        <text x={cx} y={cy - r * 0.1} textAnchor="middle" dominantBaseline="middle"
          fill={scoreColor} fontSize={size * 0.22} fontWeight="200"
          fontFamily="'Space Grotesk','Inter',sans-serif" letterSpacing="-0.04em">
          {display}
        </text>
        <text x={cx} y={cy + r * 0.28} textAnchor="middle"
          fill="rgba(255,255,255,0.3)" fontSize={size * 0.09}
          fontFamily="'Space Grotesk','Inter',sans-serif">
          / 100
        </text>
        <text x={startX - 4} y={startY + 14} textAnchor="end"
          fill="rgba(255,255,255,0.2)" fontSize={size * 0.07} fontFamily="sans-serif">0</text>
        <text x={endX + 4} y={endY + 14} textAnchor="start"
          fill="rgba(255,255,255,0.2)" fontSize={size * 0.07} fontFamily="sans-serif">100</text>
      </svg>

      <div style={{
        fontSize: 11, color: scoreColor, fontWeight: 600, letterSpacing: '0.05em',
        background: `${scoreColor}18`, border: `1px solid ${scoreColor}44`,
        borderRadius: 20, padding: '3px 12px',
      }}>
        {score > 70 ? '🔴 Critical Risk' : score > 45 ? '🟡 Moderate Risk' : '🟢 Low Risk'}
      </div>
    </div>
  )
}
