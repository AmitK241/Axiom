/**
 * AssumptionGraph.jsx — D3-force layout, React-rendered SVG.
 * Props: topicName, assumptions[{ id, text, score, risk, evidence }]
 */
import { useEffect, useLayoutEffect, useRef, useState, useCallback, useMemo } from 'react'
import * as d3 from 'd3'

const GRAPH_H = 420
const ROOT_R = 42
const PLUM = '#8052ff'
const ROOT_FILL = '#060317'

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
  const pad = 12
  const offsetX = 18
  const offsetY = -10

  let x = nodeX + offsetX
  let y = nodeY + offsetY - th * 0.35

  if (x + tw + pad > gw) x = nodeX - tw - offsetX
  if (y + th + pad > gh) y = nodeY - th - offsetY
  if (y < pad) y = pad
  if (x < pad) x = pad
  if (x + tw > gw - pad) x = gw - tw - pad

  return { x, y }
}

const LEGEND = [
  { label: 'High risk', color: '#f43f5e' },
  { label: 'Medium risk', color: '#ffb829' },
  { label: 'Lower risk', color: '#34d399' },
]

export default function AssumptionGraph({ topicName, assumptions = [] }) {
  const containerRef = useRef(null)
  const tooltipRef = useRef(null)
  const [width, setWidth] = useState(800)
  const [nodes, setNodes] = useState([])
  const [links, setLinks] = useState([])
  const [hoveredId, setHoveredId] = useState(null)
  const [tooltip, setTooltip] = useState(null)

  const topicLines = useMemo(() => splitTwoLines(topicName), [topicName])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(entries => {
      const w = entries[0]?.contentRect?.width
      if (w > 0) setWidth(w)
    })
    ro.observe(el)
    setWidth(el.clientWidth || 800)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    if (!assumptions.length || width <= 0) {
      setNodes([])
      setLinks([])
      return
    }

    const cx = width / 2
    const cy = GRAPH_H / 2

    const simNodes = [
      {
        id: '__root__',
        isRoot: true,
        x: cx,
        y: cy,
        fx: cx,
        fy: cy,
        r: ROOT_R,
      },
      ...assumptions.map(a => ({
        id: a.id,
        isRoot: false,
        text: a.text,
        score: a.score,
        risk: a.risk,
        evidence: a.evidence,
        r: nodeRadius(a.score),
        color: scoreColor(a.score),
      })),
    ]

    const simLinks = assumptions.map(a => ({
      id: a.id,
      source: '__root__',
      target: a.id,
      color: scoreColor(a.score),
    }))

    const simulation = d3
      .forceSimulation(simNodes)
      .force(
        'link',
        d3
          .forceLink(simLinks)
          .id(d => d.id)
          .distance(160)
          .strength(0.65),
      )
      .force('charge', d3.forceManyBody().strength(-180))
      .force('center', d3.forceCenter(cx, cy))
      .force('collide', d3.forceCollide(d => d.r + 8))

    const onTick = () => {
      if (simulation.alpha() < 0.01) {
        simulation.stop()
      }
      setNodes(simNodes.map(n => ({ ...n, x: n.x, y: n.y })))
      setLinks(
        simLinks.map(l => ({
          id: l.id,
          color: l.color,
          x1: l.source.x,
          y1: l.source.y,
          x2: l.target.x,
          y2: l.target.y,
        })),
      )
    }

    simulation.on('tick', onTick)
    simulation.on('end', onTick)

    return () => simulation.stop()
  }, [assumptions, width])

  const showTooltip = useCallback(
    (node) => {
      setHoveredId(node.id)
      setTooltip({ node, x: node.x + 18, y: node.y - 10 })
    },
    [],
  )

  useLayoutEffect(() => {
    if (!tooltip?.node || !tooltipRef.current) return
    const tw = tooltipRef.current.offsetWidth
    const th = tooltipRef.current.offsetHeight
    const pos = clampTooltipPos(tooltip.node.x, tooltip.node.y, tw, th, width, GRAPH_H)
    if (pos.x !== tooltip.x || pos.y !== tooltip.y) {
      setTooltip(prev => prev ? { ...prev, ...pos } : prev)
    }
  }, [tooltip?.node, width])

  const handleNodeEnter = useCallback(
    (node) => showTooltip(node),
    [showTooltip],
  )

  const handleNodeLeave = useCallback(() => {
    setHoveredId(null)
    setTooltip(null)
  }, [])

  const handleEdgeEnter = useCallback(
    (linkId) => {
      const node = nodes.find(n => n.id === linkId)
      if (node) showTooltip(node)
    },
    [nodes, showTooltip],
  )

  if (!assumptions.length) return null

  const isEdgeHovered = id => hoveredId === id
  const isNodeHovered = id => hoveredId === id

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

      <div
        ref={containerRef}
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
                  <line
                    x1={link.x1}
                    y1={link.y1}
                    x2={link.x2}
                    y2={link.y2}
                    stroke="transparent"
                    strokeWidth={14}
                    onMouseEnter={() => handleEdgeEnter(link.id)}
                    onMouseLeave={handleNodeLeave}
                  />
                  <line
                    x1={link.x1}
                    y1={link.y1}
                    x2={link.x2}
                    y2={link.y2}
                    stroke={link.color}
                    strokeWidth={active ? 2.5 : 1.5}
                    strokeOpacity={active ? 0.9 : 0.35}
                    style={{ transition: 'stroke-opacity 0.25s ease, stroke-width 0.25s ease', pointerEvents: 'none' }}
                  />
                </g>
              )
            })}
          </g>

          {/* Nodes */}
          <g>
            {nodes.map(node => {
              const hovered = isNodeHovered(node.id)
              const scale = hovered ? 1.12 : 1

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
                    <circle
                      r={ROOT_R}
                      fill={ROOT_FILL}
                      stroke={PLUM}
                      strokeWidth={2}
                    />
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
              top: tooltip.y,
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
                  <span
                    style={{
                      fontSize: 22,
                      fontWeight: 700,
                      color: tooltip.node.color,
                      lineHeight: 1,
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {tooltip.node.score}
                  </span>
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 600,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      padding: '2px 8px',
                      borderRadius: 99,
                      color: tooltip.node.color,
                      border: `1px solid ${tooltip.node.color}55`,
                      background: `${tooltip.node.color}18`,
                    }}
                  >
                    {tooltip.node.risk}
                  </span>
                </div>
                <p
                  style={{
                    fontSize: 12,
                    color: 'var(--bone)',
                    lineHeight: 1.5,
                    margin: '0 0 6px',
                  }}
                >
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

      {/* Legend */}
      <div style={{ display: 'flex', gap: 20, marginTop: 10, paddingLeft: 4 }}>
        {LEGEND.map(item => (
          <div
            key={item.label}
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--ash)' }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: item.color,
                flexShrink: 0,
              }}
            />
            {item.label}
          </div>
        ))}
      </div>
    </section>
  )
}
