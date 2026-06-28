/**
 * StreamingLog.jsx — True typewriter reveal of SSE stream.
 *
 * - Characters appended as they actually arrive in `logs` prop
 * - Monospace, --ash text, blinking block cursor (--plum-voltage, 500ms)
 * - Layer chips 01–04 activate left-to-right as backend layers complete
 */
import { useState, useEffect, useRef } from 'react'

// Layer chip activation thresholds by log type
const LAYER_KEYS = ['status', 'found', 'debating', 'done']

const TYPE_COLOR = {
  status:   'var(--smoke)',
  found:    'var(--lichen)',
  debating: 'var(--plum-voltage)',
  done:     '#22c55e',
  error:    '#ef4444',
}

// Typewriter: reveals text char-by-char via rAF
function TypewriterLine({ text, color, index }) {
  const [displayed, setDisplayed] = useState('')
  const posRef = useRef(0)
  const rafRef = useRef(null)

  useEffect(() => {
    posRef.current = 0
    setDisplayed('')

    const reveal = () => {
      posRef.current++
      setDisplayed(text.slice(0, posRef.current))
      if (posRef.current < text.length) {
        // ~30 chars/sec feels natural but fast enough not to lag
        rafRef.current = setTimeout(reveal, 18)
      }
    }
    rafRef.current = setTimeout(reveal, 0)
    return () => clearTimeout(rafRef.current)
  }, [text])

  return (
    <div style={{
      display: 'flex', gap: 10, marginBottom: 6,
      fontFamily: '"JetBrains Mono", "Fira Code", monospace',
      fontSize: 11, lineHeight: 1.5,
    }}>
      <span style={{ color: '#475569', fontWeight: '600', flexShrink: 0 }}>
        {String(index + 1).padStart(2, '0')}
      </span>
      <span style={{ color: color || 'var(--ash)' }}>
        {displayed}
        {displayed.length < text.length && (
          <span className="typewriter-cursor" />
        )}
      </span>
    </div>
  )
}

export default function StreamingLog({ logs }) {
  const endRef = useRef(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  // Determine which layers have activated
  const activeTypes = new Set(logs.map(l => l.type))
  const layerDone = [
    activeTypes.has('status'),
    activeTypes.has('found'),
    activeTypes.has('debating'),
    activeTypes.has('done') || activeTypes.has('complete'),
  ]

  return (
    <div style={{
      padding: '4px 0',
      fontFamily: '"JetBrains Mono", monospace',
    }}>
      {/* Pulse keyframe — injected once */}
      <style>{`
        @keyframes axiom-pulse {
          0%, 100% { box-shadow: 0 0 20px rgba(124,58,237,0.6); }
          50%       { box-shadow: 0 0 35px rgba(124,58,237,0.9); }
        }
      `}</style>

      {/* Pipeline step indicators */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {['01 Extract', '02 Found', '03 Debate', '04 Done'].map((label, i) => {
          // Determine step state
          // finalDone = true when 04 Done has been reached (or loaded from history)
          // If finalDone, ALL steps are completed regardless of individual log types
          const finalDone = layerDone[3]
          const completed = finalDone || layerDone[i]
          // Active = currently running: only when final step NOT yet done
          const active = !finalDone && !layerDone[i] && (i === 0 || layerDone[i - 1])

          let stepStyle
          if (completed && !active) {
            stepStyle = {
              background: 'rgba(52,211,153,0.10)',
              border: '1px solid rgba(52,211,153,0.35)',
              color: '#34d399',
              fontWeight: '600',
            }
          } else if (active) {
            stepStyle = {
              background: 'linear-gradient(90deg, #7c3aed, #4f46e5)',
              border: 'none',
              color: '#ffffff',
              fontWeight: '700',
              animation: 'axiom-pulse 1.5s ease-in-out infinite',
            }
          } else {
            stepStyle = {
              background: 'transparent',
              border: '1px solid rgba(100,116,139,0.25)',
              color: '#475569',
              fontWeight: '500',
            }
          }

          return (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                fontSize: 10,
                letterSpacing: '0.08em',
                padding: '4px 12px',
                borderRadius: 24,
                whiteSpace: 'nowrap',
                transition: 'all 300ms ease',
                ...stepStyle,
              }}>
                {(completed && !active) ? `✓ ${label}` : label}
              </div>

              {/* Connector line — not after last item */}
              {i < 3 && (
                <div style={{
                  width: 24, height: 1, flexShrink: 0,
                  background: (finalDone || layerDone[i])
                    ? '#34d399'
                    : 'rgba(100,116,139,0.2)',
                  transition: 'background 400ms ease',
                }} />
              )}
            </div>
          )
        })}
      </div>

      {/* Log lines — typewriter per line */}
      <div style={{ maxHeight: 220, overflowY: 'auto' }}>
        <div style={{
          fontSize: '0.85rem', letterSpacing: '0.12em',
          fontWeight: '700', textTransform: 'uppercase', marginBottom: 10,
          background: 'linear-gradient(90deg, #c084fc, #818cf8)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>
          AXIOM Live Log
        </div>
        {logs.map((log, i) => (
          <TypewriterLine
            key={i}
            text={log.message}
            color={TYPE_COLOR[log.type]}
            index={i}
          />
        ))}
        {/* Active blinking cursor on last line if still streaming */}
        {logs.length > 0 && !layerDone[3] && (
          <div style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--smoke)' }}>
            <span className="typewriter-cursor" />
          </div>
        )}
        <div ref={endRef} />
      </div>
    </div>
  )
}
