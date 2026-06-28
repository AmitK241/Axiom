/**
 * BrainIcon.jsx — Static SVG brain mark for nav / small icon contexts.
 *
 * At ≤48px, running a full WebGL Canvas with 12k points provides zero
 * visual benefit and wastes a GPU context. This SVG variant is indistinguishable
 * at nav scale and weighs ~300 bytes.
 *
 * Props:
 *   size   number  (default 24) — pixel size of the rendered mark
 *   style  object  — additional CSS for the outer wrapper
 */
export default function BrainIcon({ size = 24, style = {} }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-label="AXIOM brain logo"
      style={{ display: 'block', flexShrink: 0, ...style }}
    >
      {/* Left hemisphere */}
      <path
        d="M15 6C10 6 6 10 6 15c0 3 1.5 5.5 4 7v3h5V6Z"
        fill="none"
        stroke="#8052ff"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {/* Right hemisphere */}
      <path
        d="M17 6c5 0 9 4 9 9 0 3-1.5 5.5-4 7v3h-5V6Z"
        fill="none"
        stroke="#ffb829"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {/* Corpus callosum / longitudinal fissure */}
      <line x1="16" y1="6" x2="16" y2="25" stroke="rgba(255,255,255,0.18)" strokeWidth="0.75" />
      {/* Cortical fold hints — left */}
      <path d="M9 14 Q12 12 9 10" stroke="#8052ff" strokeWidth="1" fill="none" opacity="0.55" />
      <path d="M8 18 Q11 17 9 15" stroke="#8052ff" strokeWidth="0.8" fill="none" opacity="0.35" />
      {/* Cortical fold hints — right */}
      <path d="M23 14 Q20 12 23 10" stroke="#ffb829" strokeWidth="1" fill="none" opacity="0.55" />
      <path d="M24 18 Q21 17 23 15" stroke="#ffb829" strokeWidth="0.8" fill="none" opacity="0.35" />
      {/* Amber data-node accent dots */}
      <circle cx="12" cy="11" r="1" fill="#ffb829" opacity="0.7" />
      <circle cx="20" cy="13" r="1" fill="#8052ff" opacity="0.7" />
      <circle cx="11" cy="18" r="0.8" fill="#ffffff" opacity="0.4" />
      <circle cx="21" cy="18" r="0.8" fill="#ffffff" opacity="0.4" />
    </svg>
  )
}
