/**
 * Navbar.jsx — AXIOM Transparent Floating Nav
 *
 * - Outer bar: fully transparent, no background/border/shadow at any scroll depth
 * - Hides on scroll-down, reappears on scroll-up (cubic-bezier slide)
 * - Logo + About text render directly on the particle background
 * - "Past Analyses" keeps its own pill gradient — unaffected by outer transparency
 * - Active-route states via useLocation
 * - All three items (Logo, About, Past Analyses) are visible at every viewport width
 */
import { useState, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useHideOnScroll } from '../hooks/useHideOnScroll'

// ── Navbar height constant — pages pad-top by this amount ─────────────────────
export const NAV_HEIGHT = 64

// ── Brain SVG icon ─────────────────────────────────────────────────────────────
function BrainMark({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none"
      aria-hidden="true" style={{ display: 'block', flexShrink: 0 }}>
      <path d="M15 6C10 6 6 10 6 15c0 3 1.5 5.5 4 7v3h5V6Z"
        fill="none" stroke="#a78bfa" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M17 6c5 0 9 4 9 9 0 3-1.5 5.5-4 7v3h-5V6Z"
        fill="none" stroke="#06b6d4" strokeWidth="1.8" strokeLinejoin="round" />
      <line x1="16" y1="6" x2="16" y2="25"
        stroke="rgba(255,255,255,0.18)" strokeWidth="1" />
    </svg>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
export default function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const path     = location.pathname
  const hidden   = useHideOnScroll()
  const navRef   = useRef(null)

  const [aboutHover,   setAboutHover]   = useState(false)
  const [historyHover, setHistoryHover] = useState(false)

  // ── Active states ────────────────────────────────────────────────────────────
  const isAbout   = path === '/about'
  const isHistory = path === '/history'

  // ── Outer nav bar — fully transparent, no fill ever ─────────────────────────
  const navStyle = {
    position:       'fixed',
    top:            0,
    left:           0,
    right:          0,
    zIndex:         50,
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'space-between',
    // clamp padding so items don't get clipped on narrow phones (375 px)
    padding:        'clamp(10px, 3vw, 14px) clamp(12px, 4vw, 28px)',
    height:         NAV_HEIGHT,
    // ── transparency: NO background, NO border, NO shadow, NO backdrop ──────
    background:     'none',
    border:         'none',
    boxShadow:      'none',
    backdropFilter: 'none',
    // ── hide-on-scroll slide ─────────────────────────────────────────────────
    transform:      hidden ? 'translateY(-100%)' : 'translateY(0)',
    transition:     'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
  }

  // ── About ghost button ───────────────────────────────────────────────────────
  const aboutStyle = {
    background:    isAbout
      ? 'rgba(124,58,237,0.14)'
      : aboutHover ? 'rgba(255,255,255,0.07)' : 'transparent',
    color:         isAbout ? '#a78bfa' : aboutHover ? '#ffffff' : 'rgba(200,200,220,0.82)',
    border:        'none',
    borderRadius:  999,
    // tighter horizontal padding on narrow screens so it fits beside the pill CTA
    padding:       'clamp(6px, 1.5vw, 8px) clamp(8px, 2.5vw, 16px)',
    fontSize:      'clamp(11px, 3vw, 13px)',
    fontWeight:    600,
    fontFamily:    "'Oxanium', cursive",
    cursor:        'pointer',
    letterSpacing: '0.02em',
    whiteSpace:    'nowrap',
    transition:    'all 200ms ease',
    // subtle text shadow for legibility against particle bg
    textShadow:    '0 1px 8px rgba(0,0,0,0.6)',
  }

  // ── Past Analyses gradient pill — keeps its own background ──────────────────
  const historyStyle = {
    background:    'linear-gradient(135deg, #7c3aed, #06b6d4)',
    color:         '#ffffff',
    border:        'none',
    borderRadius:  999,
    // reduce padding on narrow screens to prevent overflow
    padding:       'clamp(7px, 1.5vw, 9px) clamp(10px, 3.5vw, 22px)',
    fontSize:      'clamp(11px, 3vw, 13px)',
    fontWeight:    700,
    fontFamily:    "'Oxanium', cursive",
    cursor:        'pointer',
    letterSpacing: '0.03em',
    opacity:       isHistory ? 0.75 : 1,
    boxShadow:     historyHover
      ? '0 0 28px rgba(124,58,237,0.65)'
      : '0 0 18px rgba(124,58,237,0.35)',
    transform:     historyHover ? 'scale(1.04)' : 'scale(1)',
    transition:    'all 200ms ease',
    whiteSpace:    'nowrap',
  }

  return (
    <nav ref={navRef} style={navStyle} aria-label="Main navigation">

      {/* ── Logo ──────────────────────────────────────── */}
      <button
        onClick={() => navigate('/')}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'none', border: 'none', cursor: 'pointer',
          padding: '4px 6px', borderRadius: 999, flexShrink: 0,
        }}
        aria-label="Go to home"
      >
        <BrainMark size={22} />
        <span style={{
          fontSize: 15, fontWeight: 800,
          fontFamily: "'Oxanium', cursive",
          letterSpacing: '0.06em',
          background: 'linear-gradient(90deg, #a78bfa, #06b6d4)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor:  'transparent',
          backgroundClip:       'text',
          // glow for legibility against varied particle density
          filter: 'drop-shadow(0 0 6px rgba(124,58,237,0.45))',
        }}>AXIOM</span>
      </button>

      {/* ── Nav links ──────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(2px, 1vw, 4px)' }}>
        {/* About — always visible at every viewport width */}
        <button
          onClick={() => navigate('/about')}
          style={aboutStyle}
          onMouseEnter={() => setAboutHover(true)}
          onMouseLeave={() => setAboutHover(false)}
          aria-current={isAbout ? 'page' : undefined}
        >
          About
        </button>

        {/* Past Analyses — always visible, keeps own pill bg */}
        <button
          onClick={() => navigate('/history')}
          style={historyStyle}
          onMouseEnter={() => setHistoryHover(true)}
          onMouseLeave={() => setHistoryHover(false)}
          aria-current={isHistory ? 'page' : undefined}
        >
          Past Analyses
        </button>
      </div>
    </nav>
  )
}