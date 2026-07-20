/**
 * AlternativeWorlds.jsx
 *
 * Expandable cards:
 *   - Hairline 1px rgba(255,255,255,0.06) border, 16px radius, no shadow
 *   - Collapsed: one-line premise (world_name + tagline)
 *   - Expanded: full scenario via max-height CSS transition 300ms ease
 *     (NOT JS-measured height)
 */
import { useState } from 'react'

export default function AlternativeWorlds({ results }) {
  const [openIdx, setOpenIdx] = useState(null)

  const allWorlds = results.results
    .flatMap((r, i) => (r.alternative_worlds || []).map(w => ({
      ...w,
      parent_assumption: r.assumption.assumption,
      parent_score: r.blind_spot_score.score,
    })))
    .sort((a, b) => b.parent_score - a.parent_score)
    // Show up to 9 worlds max for layout sanity; backend controls actual count
    // via ALTERNATIVE_WORLDS_COUNT env var (default 3 per assumption).
    .slice(0, 9)

  if (!allWorlds.length) {
    return (
      <div style={{
        textAlign: 'center', padding: 48,
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 16, color: 'var(--smoke)',
        fontSize: 13,
      }}>
        No alternative worlds generated
      </div>
    )
  }

  return (
    <div>
      <p style={{
        fontSize: 'clamp(1.2rem, 2.5vw, 1.6rem)',
        fontWeight: '700',
        lineHeight: '1.4',
        letterSpacing: '-0.01em',
        marginBottom: 24,
        background: 'linear-gradient(135deg, #f1f5f9 0%, #c084fc 50%, #818cf8 100%)',
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
      }}>
        What reality could look like if these assumptions are wrong — ordered by impact potential.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 10 }}>
        {allWorlds.map((world, i) => {
          const isOpen = openIdx === i
          return (
            <div
              key={i}
              style={{
                border: '1px solid rgba(139,92,246,0.20)',
                borderRadius: 16,
                overflow: 'hidden',
                background: 'rgba(255,255,255,0.02)',
                boxShadow: '0 0 20px rgba(139,92,246,0.06)',
                cursor: 'pointer',
                transition: 'border 0.2s ease',
              }}
              onMouseEnter={e => e.currentTarget.style.border = '1px solid rgba(139,92,246,0.5)'}
              onMouseLeave={e => e.currentTarget.style.border = '1px solid rgba(139,92,246,0.20)'}
              onClick={() => setOpenIdx(isOpen ? null : i)}
            >
              {/* Collapsed header — always visible */}
              <div style={{ padding: '14px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: 12,
                    background: 'linear-gradient(135deg, #7c3aed, #2563eb)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, fontWeight: '700', color: '#ffffff',
                  }}>
                    {i + 1}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {world.probability && (
                      <span style={{ fontSize: 10, color: '#34d399', fontWeight: '600', fontFamily: 'monospace' }}>
                        ~{world.probability}%
                      </span>
                    )}
                    <span style={{
                      fontSize: 12, color: 'var(--smoke)',
                      transform: isOpen ? 'rotate(180deg)' : 'none',
                      transition: 'transform 300ms',
                      display: 'block',
                    }}>▾</span>
                  </div>
                </div>

                {/* One-line premise (always visible) */}
                <div style={{ fontSize: '1rem', fontWeight: '700', color: '#f1f5f9', lineHeight: 1.3 }}>
                  {world.world_name || `Alternative World ${i + 1}`}
                </div>
                {world.tagline && (
                  <p style={{ fontSize: '0.85rem', color: '#94a3b8', fontStyle: 'italic', fontWeight: '400', margin: '4px 0 0' }}>
                    "{world.tagline}"
                  </p>
                )}
              </div>

              {/* Expanded body — max-height CSS transition */}
              <div style={{
                maxHeight: isOpen ? 600 : 0,
                overflow: 'hidden',
                transition: 'max-height 300ms ease',
              }}>
                <div style={{
                  padding: '0 16px 16px',
                  borderTop: '1px solid rgba(139,92,246,0.20)',
                  paddingTop: 12,
                }}>
                  <p style={{ fontSize: 12, color: 'var(--ash)', lineHeight: 1.6, marginBottom: 12 }}>
                    {world.description}
                  </p>

                  {world.research_directions?.length > 0 && (
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 10, letterSpacing: '0.10em', color: 'var(--smoke)', textTransform: 'uppercase', marginBottom: 6 }}>
                        Research Directions
                      </div>
                      {world.research_directions.slice(0, 2).map((dir, j) => (
                        <div key={j} style={{ display: 'flex', gap: 8, fontSize: 11, color: 'var(--ash)', marginBottom: 5 }}>
                          <span style={{ color: 'var(--plum-voltage)', flexShrink: 0 }}>◆</span>
                          <span>{dir}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {world.startup_opportunity && (
                    <div style={{
                      background: 'rgba(128,82,255,0.06)',
                      border: '1px solid rgba(128,82,255,0.15)',
                      borderRadius: 10,
                      padding: '10px 12px',
                      marginBottom: 10,
                    }}>
                      <div style={{ fontSize: 10, letterSpacing: '0.08em', color: 'var(--plum-voltage)', marginBottom: 4 }}>
                        💡 Startup opportunity
                      </div>
                      <p style={{ fontSize: 11, color: 'var(--ash)', margin: 0 }}>{world.startup_opportunity}</p>
                    </div>
                  )}

                  <p style={{
                    fontSize: '0.82rem', fontStyle: 'italic', fontWeight: '500',
                    color: '#94a3b8', opacity: 1, margin: 0,
                    borderTop: '1px solid rgba(139,92,246,0.2)',
                    paddingTop: '8px', marginTop: '8px',
                  }}>
                    <span style={{ color: '#f472b6', fontWeight: '600', fontStyle: 'normal' }}>If wrong: </span>
                    "{world.parent_assumption.slice(0, 55)}…"
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
