/**
 * AssumptionGraph.jsx — D3-force layout, React-rendered SVG.
 * Props: topicName, assumptions[{ id, text, score, risk, evidence }]
 *
 * Performance strategy: the D3 simulation is run SYNCHRONOUSLY before
 * the first React paint. We call .stop() immediately, then manually tick
 * 300 iterations so positions are fully stable in one JS microtask — no
 * live animation loop, no per-frame setState, no 5-second stabilisation lag.
 */
import { useEffect, useLayoutEffect, useRef, useState, useCallback, useMemo } from 'react'
import * as d3 from 'd3'

const GRAPH_H = 420
const ROOT_R  = 42
const PLUM     = '#8052ff'
const ROOT_FILL = '#060317'

// How many synchronous pre-warm ticks to run before first render.
// 300 is enough for any realistic assumption count (3–10 nodes) to reach
// near-zero alpha, while running in < 2 ms on a mid-range machine.
const PREWARM_TICKS = 300

function scoreColor(score) {
  if (score > 70) return '#f43f5e'
  if (score > 45) return '#ffb829'
  return '#34d399'
}

function nodeRadius(score) {
  return 24 + (score / 100) * 22
}

function splitTwoLines(text) {
  const words = (text || '').trim().split(/\s+/).filter(Boolean)
  if (words.length <= 1) return [text || '', '']
  const mid = Math.ceil(words.length / 2)
  return [words.slice(0, mid).join(' '), words.slice(mid).join(' ')]
}

function clampTooltipPos(nodeX, nodeY, tw, th, gw, gh) {
  const pad     = 12
  const offsetX = 18
  const offsetY = -10
  let x = nodeX + offsetX
  let y = nodeY + offsetY - th * 0.35
  if (x + tw + pad > gw) x = nodeX - tw - offsetX
  if (y + th + pad > gh) y = nodeY - th - offsetY
  if (y < pad)           y = pad
  if (x < pad)           x = pad
  if (x + tw > gw - pad) x = gw - tw - pad
  return { x, y }
}

const LEGEND = [
  { label: 'High risk',   color: '#f43f5e' },
  { label: 'Medium risk', color: '#ffb829' },
  { label: 'Lower risk',  color: '#34d399' },
]

// ─── Skeleton placeholder ─────────────────────────────────────────────────────
// Shown while width is still 0 (before ResizeObserver fires) or while the
// assumptions array is empty. Keeps the layout space reserved so no jump.
function GraphSkeleton({ height }) {
  return (
    <div
      style={{
        height,
        borderRadius: 16,
        border: '1px solid rgba(128,82,255,0.18)',
        background: 'rgba(6,3,23,0.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Neon pulse rings */}
      {[0, 1, 2].map(i => (
        <div
          key={i}
          style={{
            position: 'absolute',
            width:  80 + i * 80,
            height: 80 + i * 80,
            borderRadius: '50%',
            border: '1px solid rgba(128,82,255,0.22)',
            animation: `agPulse 2.2s ease-in-out ${i * 0.4}s infinite`,
          }}
        />
      ))}
      {/* Central plum dot */}
      <div style={{
        width: 36, height: 36, borderRadius: '50%',
        background: 'rgba(128,82,255,0.35)',
        border: '2px solid rgba(128,82,255,0.70)',
        boxShadow: '0 0 20px rgba(128,82,255,0.45)',
        animation: 'agPulse 1.8s ease-in-out infinite',
        zIndex: 1,
      }} />
      {/* Skeleton spoke lines radiating outward */}
      {[45, 135, 225, 315].map((deg, i) => {
        const rad = (deg * Math.PI) / 180
        const len = 110 + i * 10
        return (
          <div
            key={deg}
            style={{
              position: 'absolute',
              width: len, height: 1,
              background: 'linear-gradient(90deg, rgba(128,82,255,0.35), transparent)',
              transformOrigin: '0 50%',
              transform: `rotate(${deg}deg)`,
              left: '50%', top: '50%',
              marginTop: -0.5,
              opacity: 0.55,
            }}
          />
        )
      })}
      {/* Skeleton leaf circles */}
      {[0, 72, 144, 216, 288].map((deg, i) => {
        const rad = (deg * Math.PI) / 180
        const dist = 130
        const cx = 50 + Math.cos(rad) * (dist / 4)
        const cy = 50 + Math.sin(rad) * (dist / 4)
        return (
          <div
            key={deg}
            style={{
              position: 'absolute',
              width:  32 + i * 6, height: 32 + i * 6,
              borderRadius: '50%',
              border: '1px solid rgba(128,82,255,0.25)',
              background: 'rgba(128,82,255,0.06)',
              left: `calc(50% + ${Math.cos(rad) * dist}px)`,
              top:  `calc(50% + ${Math.sin(rad) * dist}px)`,
              transform: 'translate(-50%,-50%)',
              animation: `agPulse 2s ease-in-out ${i * 0.25}s infinite`,
            }}
          />
        )
      })}
      <style>{`
        @keyframes agPulse {
          0%, 100% { opacity: 0.55; transform: scale(1);    }
          50%       { opacity: 1;    transform: scale(1.06); }
        }
      `}</style>
    </div>
  )
}

// ─── Main layout computation — pure synchronous D3 ────────────────────────────
// Returns { nodes, links } with final stable coordinates already applied.
// No simulation object is returned; we throw it away after ticking.
function computeLayout(assumptions, width) {
  const cx = width / 2
  const cy = GRAPH_H / 2

  const simNodes = [
    { id: '__root__', isRoot: true, x: cx, y: cy, fx: cx, fy: cy, r: ROOT_R },
    ...assumptions.map(a => ({
      id:       a.id,
      isRoot:   false,
      text:     a.text,
      score:    a.score,
      risk:     a.risk,
      evidence: a.evidence,
      r:        nodeRadius(a.score),
      color:    scoreColor(a.score),
    })),
  ]

  const simLinks = assumptions.map(a => ({
    id:     a.id,
    source: '__root__',
    target: a.id,
    color:  scoreColor(a.score),
  }))

  // ── Pre-warmed synchronous simulation ──────────────────────────────────────
  // .stop() prevents the internal requestAnimationFrame loop from starting.
  // We then manually tick PREWARM_TICKS times — this runs entirely in the JS
  // call stack (< 2 ms for typical assumption counts) so the first React paint
  // already receives stable, fully-settled coordinates. No live ticking needed.
  const simulation = d3
    .forceSimulation(simNodes)
    .force(
      'link',
      d3.forceLink(simLinks).id(d => d.id).distance(160).strength(0.65),
    )
    .force('charge',  d3.forceManyBody().strength(-180))
    .force('center',  d3.forceCenter(cx, cy))
    .force('collide', d3.forceCollide(d => d.r + 8))
    .stop()   // ← critical: prevents the async rAF loop from starting

  for (let i = 0; i < PREWARM_TICKS; ++i) simulation.tick()

  // Snapshot final positions into plain objects (D3 mutates in place)
  const nodes = simNodes.map(n => ({ ...n, x: n.x ?? cx, y: n.y ?? cy }))
  const links = simLinks.map(l => ({
    id:    l.id,
    color: l.color,
    // After ticking, source/target are resolved to node objects
    x1: (l.source).x ?? cx,
    y1: (l.source).y ?? cy,
    x2: (l.target).x ?? cx,
    y2: (l.target).y ?? cy,
  }))

  return { nodes, links }
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function AssumptionGraph({ topicName, assumptions = [] }) {
  const containerRef = useRef(null)
  const tooltipRef   = useRef(null)
  const [width, setWidth]       = useState(0)      // 0 = not measured yet → show skeleton
  const [nodes, setNodes]       = useState([])
  const [links, setLinks]       = useState([])
  const [hoveredId, setHoveredId] = useState(null)
  const [tooltip, setTooltip]   = useState(null)

  const topicLines = useMemo(() => splitTwoLines(topicName), [topicName])

  // ── Measure container width ───────────────────────────────────────────────
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(entries => {
      const w = entries[0]?.contentRect?.width
      if (w > 0) setWidth(w)
    })
    ro.observe(el)
    const w = el.clientWidth
    if (w > 0) setWidth(w)
    return () => ro.disconnect()
  }, [])

  // ── Run pre-warmed layout synchronously whenever inputs change ────────────
  useEffect(() => {
    if (!assumptions.length || width <= 0) {
      setNodes([])
      setLinks([])
      return
    }
    // computeLayout is purely synchronous — no async ticks, no rAF loop.
    // setNodes/setLinks are called exactly once per input change.
    const { nodes: n, links: l } = computeLayout(assumptions, width)
    setNodes(n)
    setLinks(l)
  }, [assumptions, width])

  // ── Tooltip helpers ───────────────────────────────────────────────────────
  const showTooltip = useCallback((node) => {
    setHoveredId(node.id)
    setTooltip({ node, x: node.x + 18, y: node.y - 10 })
  }, [])

  useLayoutEffect(() => {
    if (!tooltip?.node || !tooltipRef.current) return
    const tw  = tooltipRef.current.offsetWidth
    const th  = tooltipRef.current.offsetHeight
    const pos = clampTooltipPos(tooltip.node.x, tooltip.node.y, tw, th, width, GRAPH_H)
    if (pos.x !== tooltip.x || pos.y !== tooltip.y) {
      setTooltip(prev => prev ? { ...prev, ...pos } : prev)
    }
  }, [tooltip?.node, width])

  const handleNodeEnter = useCallback((node) => showTooltip(node), [showTooltip])
  const handleNodeLeave = useCallback(() => { setHoveredId(null); setTooltip(null) }, [])
  const handleEdgeEnter = useCallback((linkId) => {
    const node = nodes.find(n => n.id === linkId)
    if (node) showTooltip(node)
  }, [nodes, showTooltip])

  if (!assumptions.length) return null

  const isEdgeHovered = id => hoveredId === id
  const isNodeHovered = id => hoveredId === id

  // Show skeleton while width hasn't been measured yet or nodes aren't ready
  const showSkeleton = width <= 0 || nodes.length === 0

  return (
    <section style={{ marginBottom: 20 }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--plum-voltage)',
          marginBottom: 10,
        }}
      >
        Assumption Graph
      </div>

      {/* Width probe div — always rendered so ResizeObserver can measure */}
      <div ref={containerRef} style={{ width: '100%' }}>
        {showSkeleton ? (
          <GraphSkeleton height={GRAPH_H} />
        ) : (
          <div
            style={{
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 16,
              background: 'transparent',
              overflow: 'hidden',
              position: 'relative',
            }}
            onMouseLeave={handleNodeLeave}
          >
            <svg width={width} height={GRAPH_H} style={{ display: 'block' }}>
              {/* Edges */}
              <g>
                {links.map(link => {
                  const active = isEdgeHovered(link.id) || isNodeHovered(link.id)
                  return (
                    <g key={link.id}>
                      {/* Fat transparent hit area for easier hover */}
                      <line
                        x1={link.x1} y1={link.y1} x2={link.x2} y2={link.y2}
                        stroke="transparent" strokeWidth={14}
                        onMouseEnter={() => handleEdgeEnter(link.id)}
                        onMouseLeave={handleNodeLeave}
                      />
                      {/* Visible edge */}
                      <line
                        x1={link.x1} y1={link.y1} x2={link.x2} y2={link.y2}
                        stroke={link.color}
                        strokeWidth={active ? 2.5 : 1.5}
                        strokeOpacity={active ? 0.9 : 0.35}
                        style={{
                          transition: 'stroke-opacity 0.25s ease, stroke-width 0.25s ease',
                          pointerEvents: 'none',
                        }}
                      />
                    </g>
                  )
                })}
              </g>

              {/* Nodes */}
              <g>
                {nodes.map(node => {
                  const hovered = isNodeHovered(node.id)
                  const scale   = hovered ? 1.12 : 1

                  if (node.isRoot) {
                    const [line1, line2] = topicLines
                    return (
                      <g
                        key={node.id}
                        transform={`translate(${node.x},${node.y}) scale(${scale})`}
                        style={{ transition: 'transform 0.25s ease', cursor: 'default' }}
                        onMouseEnter={() => handleNodeEnter(node)}
                        onMouseLeave={handleNodeLeave}
                      >
                        <circle r={ROOT_R} fill={ROOT_FILL} stroke={PLUM} strokeWidth={2} />
                        <text
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fill="var(--bone)"
                          style={{ fontSize: 11, fontWeight: 600, pointerEvents: 'none' }}
                        >
                          <tspan x={0} dy={line2 ? -6 : 0}>{line1}</tspan>
                          {line2 && <tspan x={0} dy={14}>{line2}</tspan>}
                        </text>
                      </g>
                    )
                  }

                  return (
                    <g
                      key={node.id}
                      transform={`translate(${node.x},${node.y}) scale(${scale})`}
                      style={{ transition: 'transform 0.25s ease', cursor: 'pointer' }}
                      onMouseEnter={() => handleNodeEnter(node)}
                      onMouseLeave={handleNodeLeave}
                    >
                      <circle
                        r={node.r}
                        fill={node.color}
                        fillOpacity={0.22}
                        stroke={node.color}
                        strokeWidth={2}
                      />
                      <text
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill={node.color}
                        style={{ fontSize: 12, fontWeight: 700, pointerEvents: 'none' }}
                      >
                        {node.score}
                      </text>
                    </g>
                  )
                })}
              </g>
            </svg>

            {/* Tooltip */}
            {tooltip && (
              <div
                ref={tooltipRef}
                style={{
                  position: 'absolute',
                  left: tooltip.x,
                  top:  tooltip.y,
                  zIndex: 10,
                  maxWidth: 260,
                  padding: '12px 14px',
                  borderRadius: 12,
                  background: 'rgba(6,3,23,0.92)',
                  border: '1px solid rgba(255,255,255,0.10)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  pointerEvents: 'none',
                }}
              >
                {tooltip.node.isRoot ? (
                  <>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--bone)', marginBottom: 4 }}>
                      {topicName}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--ash)' }}>
                      {assumptions.length} assumption{assumptions.length !== 1 ? 's' : ''}
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <span style={{
                        fontSize: 22, fontWeight: 700, color: tooltip.node.color,
                        lineHeight: 1, fontVariantNumeric: 'tabular-nums',
                      }}>
                        {tooltip.node.score}
                      </span>
                      <span style={{
                        fontSize: 9, fontWeight: 600, letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                        padding: '2px 8px', borderRadius: 99,
                        color: tooltip.node.color,
                        border: `1px solid ${tooltip.node.color}55`,
                        background: `${tooltip.node.color}18`,
                      }}>
                        {tooltip.node.risk}
                      </span>
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--bone)', lineHeight: 1.5, margin: '0 0 6px' }}>
                      {tooltip.node.text}
                    </p>
                    <div style={{ fontSize: 10, color: 'var(--ash)' }}>
                      {tooltip.node.evidence} evidence
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 20, marginTop: 10, paddingLeft: 4 }}>
        {LEGEND.map(item => (
          <div
            key={item.label}
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--ash)' }}
          >
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: item.color, flexShrink: 0 }} />
            {item.label}
          </div>
        ))}
      </div>
    </section>
  )
}
