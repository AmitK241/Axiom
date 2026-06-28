/**
 * HistoryPage.jsx — AXIOM Past Analyses
 *
 * Premium glass-card list of saved reports with:
 *   - ParticleBackground (same as App/Results)
 *   - Bold intelligence-report header
 *   - Glass cards with hover glow
 *   - Matrix pill badges (epistemic = indigo, venture = amber)
 *   - Large colored score numerals
 *   - Glowing "View Report →" CTA per card
 *   - Rich empty state with brain icon
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import axios from 'axios'
import BrainIcon         from '../components/BrainIcon'
import ParticleBackground from '../components/ParticleBackground'
import StarfieldCanvas   from '../components/StarfieldCanvas'

const CUBIC = 'cubic-bezier(0.4,0,0.2,1)'

export default function HistoryPage() {
  const navigate  = useNavigate()
  const [analyses, setAnalyses] = useState([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    axios.get('/api/history')
      .then(r => setAnalyses(r.data.analyses || []))
      .catch(() => setAnalyses([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div style={{
      minHeight: '100vh',
      background: '#000000',
      color: 'var(--bone)',
      fontFamily: "'Space Grotesk','Inter',sans-serif",
    }}>

      {/* ── Starfield (same as home + results) ── */}
      <StarfieldCanvas />

      {/* ── Particle brain background ── */}
      <ParticleBackground shape="brain" targetCX={0.72} targetCY={0.38} />

      {/* ── NAVBAR ──────────────────────────────────────────────────── */}
      <Navbar />

      {/* ── Page content ── */}
      <div style={{
        maxWidth: 820, margin: '0 auto',
        padding: '80px 24px 100px',
        position: 'relative', zIndex: 1,
      }}>

        {/* ── Header ── */}
        <div style={{ marginBottom: 40 }}>
          {/* Eyebrow */}
          <div style={{
            fontSize: 9, fontWeight: '700', letterSpacing: '0.15em',
            textTransform: 'uppercase',
            marginBottom: 14,
            background: 'linear-gradient(90deg, #a78bfa, #38bdf8)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            AXIOM Intelligence Archive
          </div>

          {/* Title row: brain icon + "Past Analyses" */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 10 }}>
            <BrainIcon size={48} />
            <h1 style={{
              fontSize: 'clamp(36px, 7vw, 60px)',
              fontWeight: '800',
              letterSpacing: '-0.035em',
              margin: 0,
              lineHeight: 1.0,
              fontFamily: "'Space Grotesk','Inter',sans-serif",
              background: 'linear-gradient(135deg, #ffffff 0%, #a78bfa 50%, #38bdf8 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              Past Analyses
            </h1>
          </div>

          {/* Subtitle */}
          <p style={{
            fontSize: '1rem', fontWeight: '400',
            margin: '0 0 22px', letterSpacing: '0.01em',
            fontFamily: 'monospace',
            display: 'flex', alignItems: 'center', gap: '0.4em',
            flexWrap: 'wrap',
          }}>
            <span style={{
              background: 'linear-gradient(90deg, #a78bfa, #818cf8)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              backgroundClip: 'text', fontWeight: '700',
            }}>All AXIOM reports</span>
            <span style={{ color: '#475569', fontWeight: '400' }}>·</span>
            <span style={{
              background: 'linear-gradient(90deg, #34d399, #38bdf8)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              backgroundClip: 'text', fontWeight: '700',
            }}>Saved to MongoDB Atlas</span>
          </p>

          {/* Glowing divider */}
          <div style={{
            height: 1,
            background: 'linear-gradient(90deg, rgba(124,58,237,0.55) 0%, rgba(56,189,248,0.25) 60%, transparent 100%)',
            boxShadow: '0 0 12px rgba(124,58,237,0.20)',
          }} />
        </div>

        {/* ── Body ── */}
        {loading ? (
          <LoadingState />
        ) : analyses.length === 0 ? (
          <EmptyState onNavigate={() => navigate('/')} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {analyses.map((a, i) => (
              <HistoryCard
                key={a._id || i}
                analysis={a}
                onClick={() => navigate('/results', {
                  state: { field: a.field, analysis_id: a._id, matrix: a.matrix ?? 'epistemic' },
                })}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Loading skeleton ─────────────────────────────────────────────────────────
function LoadingState() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {[1, 2, 3].map(i => (
        <div key={i} style={{
          height: 96, borderRadius: 16,
          background: 'rgba(255,255,255,0.025)',
          border: '1px solid rgba(255,255,255,0.06)',
          animation: 'axiom-shimmer 1.6s ease-in-out infinite',
          animationDelay: `${i * 0.15}s`,
        }} />
      ))}
      <style>{`
        @keyframes axiom-shimmer {
          0%, 100% { opacity: 0.5; }
          50%       { opacity: 1; }
        }
      `}</style>
    </div>
  )
}

// ── Empty state ──────────────────────────────────────────────────────────────
function EmptyState({ onNavigate }) {
  return (
    <div style={{
      textAlign: 'center',
      padding: '64px 32px',
      background: 'rgba(255,255,255,0.018)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 24,
      backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Glow behind empty state */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(124,58,237,0.10) 0%, transparent 70%)',
      }} />

      {/* Large brain icon */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24, opacity: 0.55 }}>
        <BrainIcon size={72} />
      </div>

      <div style={{
        fontSize: 9, fontWeight: 800, letterSpacing: '0.22em',
        color: 'rgba(167,139,250,0.60)', textTransform: 'uppercase', marginBottom: 14,
      }}>
        No Reports Found
      </div>
      <h2 style={{
        fontSize: 'clamp(22px, 4vw, 32px)', fontWeight: 700,
        letterSpacing: '-0.02em', color: '#ffffff', margin: '0 0 10px',
        fontFamily: "'Space Grotesk','Inter',sans-serif",
      }}>
        No analyses yet
      </h2>
      <p style={{
        fontSize: 13, color: 'rgba(200,200,220,0.50)',
        margin: '0 0 32px', lineHeight: 1.65,
      }}>
        Run your first AXIOM analysis and uncover the hidden<br />
        assumptions shaping any field.
      </p>

      <button
        onClick={onNavigate}
        style={{
          background: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)',
          color: '#ffffff',
          border: '1px solid rgba(124,58,237,0.50)',
          borderRadius: 99,
          padding: '12px 32px',
          fontSize: 14, fontWeight: 700,
          cursor: 'pointer',
          letterSpacing: '0.02em',
          boxShadow: '0 0 24px rgba(124,58,237,0.30)',
          transition: `opacity 200ms ${CUBIC}, transform 200ms ${CUBIC}`,
          position: 'relative', zIndex: 1,
        }}
        onMouseEnter={e => { e.currentTarget.style.opacity = '0.88'; e.currentTarget.style.transform = 'translateY(-2px)' }}
        onMouseLeave={e => { e.currentTarget.style.opacity = '1';    e.currentTarget.style.transform = 'translateY(0)' }}
      >
        Run your first AXIOM analysis →
      </button>
    </div>
  )
}

// ── Individual history card ───────────────────────────────────────────────────
function HistoryCard({ analysis: a, onClick }) {
  const [hovered, setHovered] = useState(false)

  const score      = a.overall_score ?? null
  // Score gradient: ≥70 green/teal, 50-69 amber/orange, <50 red
  const scoreGradient = score == null
    ? null
    : score >= 70 ? 'linear-gradient(135deg, #34d399, #38bdf8)'
    : score >= 50 ? 'linear-gradient(135deg, #fbbf24, #fb923c)'
    :               'linear-gradient(135deg, #f87171, #e11d48)'
  const scoreGlow  = score == null ? 'transparent'
                   : score >= 70   ? 'rgba(52,211,153,0.20)'
                   : score >= 50   ? 'rgba(251,191,36,0.20)'
                   :                 'rgba(248,113,113,0.20)'

  const isVenture   = a.matrix === 'venture'
  const matrixLabel = isVenture ? '💰 Venture' : '🏛️ Epistemic'
  const matrixColor = isVenture ? '#fb923c'  : '#a78bfa'
  const matrixBg    = isVenture ? 'rgba(251,146,60,0.20)'  : 'rgba(139,92,246,0.20)'
  const matrixBdr   = isVenture ? 'rgba(251,146,60,0.40)'  : 'rgba(139,92,246,0.40)'

  const dateStr = a.created_at
    ? new Date(a.created_at).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
    : null

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 20,
        padding: '20px 24px',
        borderRadius: 18,
        background: hovered
          ? 'rgba(124,58,237,0.06)'
          : 'rgba(255,255,255,0.022)',
        border: `1px solid ${hovered ? 'rgba(139,92,246,0.50)' : 'rgba(139,92,246,0.20)'}`,
        backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
        cursor: 'pointer',
        transition: `background 200ms ${CUBIC}, border-color 200ms ${CUBIC}, box-shadow 200ms ${CUBIC}`,
        boxShadow: hovered
          ? '0 0 28px rgba(139,92,246,0.18), inset 0 1px 0 rgba(255,255,255,0.04)'
          : '0 0 20px rgba(139,92,246,0.06)',
      }}
    >
      {/* Left — field name + meta */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Field name */}
        <div style={{
          fontSize: '1.1rem',
          fontWeight: '700',
          color: '#f1f5f9',
          letterSpacing: '-0.02em',
          marginBottom: 8,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          fontFamily: "'Space Grotesk','Inter',sans-serif",
          textShadow: hovered ? '0 0 20px rgba(167,139,250,0.25)' : 'none',
          transition: `text-shadow 200ms ${CUBIC}`,
        }}>
          {a.field}
        </div>

        {/* Meta row: date + matrix pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {dateStr && (
            <span style={{
              fontSize: 11, color: '#64748b', fontWeight: '400',
              fontFamily: 'monospace', letterSpacing: '0.03em',
            }}>
              {dateStr}
            </span>
          )}
          {a.matrix && (
            <span style={{
              fontSize: 10, fontWeight: '600', letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: matrixColor,
              background: matrixBg,
              border: `1px solid ${matrixBdr}`,
              borderRadius: 99, padding: '3px 10px',
              display: 'inline-flex', alignItems: 'center', gap: 4,
            }}>
              {matrixLabel}
            </span>
          )}
        </div>
      </div>

      {/* Center — large colored score */}
      <div style={{
        textAlign: 'center',
        flexShrink: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
      }}>
        <span style={{
          fontSize: 'clamp(36px, 5vw, 52px)',
          fontWeight: '800',
          lineHeight: 1,
          fontVariantNumeric: 'tabular-nums',
          fontFamily: "'Space Grotesk','Inter',sans-serif",
          ...(scoreGradient
            ? {
                background: scoreGradient,
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                textShadow: 'none',
              }
            : { color: 'rgba(200,200,220,0.40)' }
          ),
          transition: `opacity 200ms ${CUBIC}`,
        }}>
          {score ?? '—'}
        </span>
        <span style={{
          fontSize: 9, color: '#475569', fontWeight: '500',
          letterSpacing: '0.10em', textTransform: 'uppercase',
          marginTop: 2,
        }}>
          / 100
        </span>
      </div>

      {/* Right — glowing CTA button */}
      <div style={{ flexShrink: 0 }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: hovered
            ? 'linear-gradient(135deg, rgba(124,58,237,0.9), rgba(37,99,235,0.9))'
            : 'linear-gradient(135deg, #7c3aed, #2563eb)',
          color: '#ffffff',
          border: '1px solid rgba(124,58,237,0.50)',
          borderRadius: 99,
          padding: '7px 16px',
          fontSize: 12, fontWeight: '600',
          letterSpacing: '0.02em',
          transition: `all 200ms ${CUBIC}`,
          boxShadow: hovered ? '0 0 20px rgba(124,58,237,0.35)' : '0 0 10px rgba(124,58,237,0.18)',
          opacity: hovered ? 0.9 : 1,
          whiteSpace: 'nowrap',
        }}>
          View Report →
        </span>
      </div>
    </div>
  )
}
