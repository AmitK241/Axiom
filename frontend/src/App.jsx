// /**
//  * App.jsx — AXIOM Landing Page
//  * ────────────────────────────────────────────────────────────────
//  * Single full-page ParticleBackground (brain, centered, z-index 0).
//  * Highly transparent glass card centered over the brain cluster —
//  * particles glow through the card body for the reference-image effect.
//  * No exclusion zone: the brain shines directly through the card.
//  */

// import { useState, useEffect, useRef, useCallback } from 'react'
// import { useNavigate }    from 'react-router-dom'
// import { gsap }           from 'gsap'
// import ParticleBackground from './components/ParticleBackground'
// import StarfieldCanvas   from './components/StarfieldCanvas'

// const REDUCED_MOTION = typeof window !== 'undefined' &&
//   window.matchMedia('(prefers-reduced-motion: reduce)').matches

// const NAV_H = 53

// const EXAMPLES = [
//   { label: 'AI Research',      icon: '🤖' },
//   { label: 'Cancer Treatment', icon: '🔬' },
//   { label: 'Economic Policy',  icon: '📊' },
//   { label: 'Education System', icon: '🎓' },
//   { label: 'Mental Health',    icon: '🧠' },
// ]

// const HISTORICAL = [
//   {
//     year: '1847',
//     text: 'Doctors assumed handwashing was unnecessary — killed thousands.',
//     field: 'Medicine',
//   },
//   {
//     year: '1983',
//     text: "Scientists assumed bacteria couldn't survive stomach acid — ignored ulcer cure for decades.",
//     field: 'Biology',
//   },
//   {
//     year: '2008',
//     text: 'Economists assumed housing prices never fall — triggered global financial crisis.',
//     field: 'Economics',
//   },
// ]

// const MATRICES = [
//   {
//     key: 'epistemic',
//     label: 'Philosophical & Epistemic',
//     description: 'Default',
//     agents: ['🏛️ Historian', '⚔️ Contrarian', '🔬 Scientist', '🧘 Philosopher'],
//   },
//   {
//     key: 'venture',
//     label: 'Startup & Venture Capital',
//     description: 'Pro Variant',
//     agents: ['💰 The Investor', '🗡️ The Critic', '🛒 The Customer', '🚀 Growth Hacker'],
//   },
// ]

// const easeOutCubic = t => 1 - Math.pow(1 - t, 3)
// const CUBIC = 'cubic-bezier(0.4,0,0.2,1)'
// const reducedMotionCheck = () =>
//   typeof window !== 'undefined' &&
//   window.matchMedia('(prefers-reduced-motion: reduce)').matches

// // ─── GSAP micro-interaction helpers ─────────────────────────────────────────
// const gHover  = e => gsap.to(e.currentTarget, { scale: 1.03, duration: 0.20, ease: 'power2.out', overwrite: true })
// const gLeave  = e => gsap.to(e.currentTarget, { scale: 1.00, duration: 0.18, ease: 'power2.in',  overwrite: true })
// const gHoverP = e => gsap.to(e.currentTarget, { scale: 1.05, y: -2, duration: 0.20, ease: 'power2.out', overwrite: true })
// const gLeaveP = e => gsap.to(e.currentTarget, { scale: 1.00, y:  0, duration: 0.18, ease: 'power2.in',  overwrite: true })

// // ─── SVG brain mark ──────────────────────────────────────────────────────────
// function BrainSVGMark({ size = 28 }) {
//   return (
//     <svg width={size} height={size} viewBox="0 0 32 32" fill="none"
//       aria-hidden="true" style={{ display: 'block', flexShrink: 0 }}>
//       <path d="M15 6C10 6 6 10 6 15c0 3 1.5 5.5 4 7v3h5V6Z"
//         fill="none" stroke="#8052ff" strokeWidth="1.5" strokeLinejoin="round" />
//       <path d="M17 6c5 0 9 4 9 9 0 3-1.5 5.5-4 7v3h-5V6Z"
//         fill="none" stroke="#ffb829" strokeWidth="1.5" strokeLinejoin="round" />
//       <line x1="16" y1="6" x2="16" y2="25" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
//       <path d="M9 14 Q12 12 9 10"  stroke="#8052ff" strokeWidth="1" fill="none" opacity="0.6" />
//       <path d="M23 14 Q20 12 23 10" stroke="#ffb829" strokeWidth="1" fill="none" opacity="0.6" />
//     </svg>
//   )
// }

// // ─── Sparkle accent icon ──────────────────────────────────────────────────────
// function SparkleIcon({ size = 16, color = 'rgba(128,82,255,0.55)' }) {
//   return (
//     <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true">
//       <path d="M8 1 L8.7 6.3 L14 7 L8.7 7.7 L8 13 L7.3 7.7 L2 7 L7.3 6.3 Z"
//         fill={color} />
//       <path d="M13 1 L13.35 3.15 L15.5 3.5 L13.35 3.85 L13 6 L12.65 3.85 L10.5 3.5 L12.65 3.15 Z"
//         fill={color} opacity="0.6" />
//     </svg>
//   )
// }

// // ─── FadeSection ────────────────────────────────────────────────────────────
// function FadeSection({ children, style = {}, delay = 0 }) {
//   const ref = useRef(null)

//   useEffect(() => {
//     const el = ref.current
//     if (!el) return
//     if (REDUCED_MOTION) {
//       el.style.opacity   = '1'
//       el.style.transform = 'none'
//       return
//     }
//     const obs = new IntersectionObserver(
//       ([entry]) => {
//         if (entry.isIntersecting) {
//           el.style.transitionDelay = `${delay}ms`
//           el.style.opacity         = '1'
//           el.style.transform       = 'translateY(0)'
//           obs.disconnect()
//         }
//       },
//       { threshold: 0.15 }
//     )
//     obs.observe(el)
//     return () => obs.disconnect()
//   }, [delay])

//   return (
//     <div
//       ref={ref}
//       style={{
//         opacity:   REDUCED_MOTION ? 1 : 0,
//         transform: REDUCED_MOTION ? 'none' : 'translateY(28px)',
//         transition: REDUCED_MOTION ? 'none' : `opacity 650ms ${CUBIC}, transform 650ms ${CUBIC}`,
//         ...style,
//       }}
//     >
//       {children}
//     </div>
//   )
// }

// // ─── App ─────────────────────────────────────────────────────────────────────
// export default function App() {
//   const [input,     setInput]     = useState('')
//   const [matrix,    setMatrix]    = useState('epistemic')
//   const [assembled, setAssembled] = useState(false)
//   const [counter,   setCounter]   = useState(0)
//   const [isMobile,  setIsMobile]  = useState(
//     typeof window !== 'undefined' && window.innerWidth < 768
//   )

//   const counterRafRef = useRef(null)
//   const navigate = useNavigate()

//   // ── Responsive ────────────────────────────────────────────────────────────
//   useEffect(() => {
//     const mq = window.matchMedia('(max-width: 767px)')
//     const h  = e => setIsMobile(e.matches)
//     mq.addEventListener('change', h)
//     setIsMobile(mq.matches)
//     return () => mq.removeEventListener('change', h)
//   }, [])

//   // ── Counter animation ─────────────────────────────────────────────────────
//   useEffect(() => {
//     if (reducedMotionCheck()) { setCounter(100); setAssembled(true); return }
//     const start = performance.now()
//     const dur   = 1800
//     const tick  = now => {
//       const t = Math.min((now - start) / dur, 1)
//       setCounter(Math.round(easeOutCubic(t) * 100))
//       if (t < 1) counterRafRef.current = requestAnimationFrame(tick)
//       else        setAssembled(true)
//     }
//     counterRafRef.current = requestAnimationFrame(tick)
//     return () => { if (counterRafRef.current) cancelAnimationFrame(counterRafRef.current) }
//   }, [])

//   // ── Navigation ────────────────────────────────────────────────────────────
//   const handleAnalyze = useCallback((fieldOverride) => {
//     const field = (typeof fieldOverride === 'string' ? fieldOverride : input).trim()
//     if (!field) return
//     navigate('/results', { state: { field, matrix } })
//   }, [input, matrix, navigate])

//   // ════════════════════════════════════════════════════════════════════════════
//   // HERO GLASS CARD — ultra-transparent so the particle brain glows through
//   // Layout: centered eyebrow → massive wordmark → (brain visible through card)
//   //         → matrix pills → input row → tag chips → sparkle corner
//   // NO exclusion zone: particles render freely behind the card body
//   // ════════════════════════════════════════════════════════════════════════════
//   const GlassPanel = (
//     <div
//       id="hero-control-panel"
//       className="card-entry"
//       style={{
//         // Content-free: no background, no border, no shadow, no blur
//         // Content floats directly over the animated particle background
//         background:   'transparent',
//         border:       'none',
//         borderRadius: 0,
//         boxShadow:    'none',
//         padding:      isMobile ? '24px 18px 20px' : '32px 28px 28px',
//         marginBottom: 12,
//         position:     'relative',
//         zIndex:       10,
//         width:        '100%',
//         maxWidth:     isMobile ? '100%' : 510,
//       }}
//     >
//       {/* ── Counter strip (fades away once assembled) ───────────────────────── */}
//       <div
//         aria-live="polite"
//         style={{
//           maxHeight:    assembled ? 0 : 44,
//           overflow:     'hidden',
//           opacity:      assembled ? 0 : 1,
//           transition:   `opacity 400ms ${CUBIC}, max-height 400ms ${CUBIC}`,
//           marginBottom: assembled ? 0 : 14,
//           display:      'flex', alignItems: 'center', gap: 10,
//           borderBottom: assembled ? 'none' : '1px solid rgba(255,255,255,0.06)',
//           paddingBottom: assembled ? 0 : 12,
//         }}
//       >
//         <div style={{
//           fontSize: 9, fontWeight: 700, letterSpacing: '0.16em',
//           color: 'var(--smoke)', textTransform: 'uppercase',
//         }}>ANALYZING</div>
//         <div style={{
//           fontSize: 20, fontWeight: 200, letterSpacing: '-0.02em',
//           color: 'var(--plum-voltage)', fontVariantNumeric: 'tabular-nums', lineHeight: 1,
//         }}>{counter}</div>
//         <div style={{
//           width: 5, height: 5, borderRadius: '50%',
//           background: 'var(--plum-voltage)',
//           animation: 'axiom-pulse 1s ease-in-out infinite',
//           marginLeft: 'auto',
//         }} />
//       </div>

//       {/* ── 1. Eyebrow ────────────────────────────────────────────────── */}
//       <div className="float-text" style={{
//         textAlign: 'center',
//         fontSize: 10, fontWeight: 700, letterSpacing: '0.20em',
//         color: '#a78bfa',
//         textTransform: 'uppercase',
//         marginBottom: 10,
//       }}>
//         AXIOM · EPISTEMIC INTELLIGENCE
//       </div>

//       {/* ── 2. Wordmark ─────────────────────────────────────────────── */}
//       <h1 className="axiom-wordmark" style={{
//         textAlign:      'center',
//         fontSize:       isMobile ? 'clamp(60px, 16vw, 80px)' : 'clamp(68px, 12vw, 96px)',
//         fontWeight:     800,
//         letterSpacing:  '-0.025em',
//         color:          '#ffffff',
//         lineHeight:     0.90,
//         margin:         '0 0 12px',
//         fontFamily:     "'Space Grotesk', 'Inter', sans-serif",
//       }}>AXIOM</h1>

//       {/* ── 3. Gradient tagline ─────────────────────────────────────────── */}
//       <p style={{
//         textAlign: 'center',
//         fontSize: isMobile ? 15 : 17,
//         fontWeight: 500,
//         letterSpacing: '-0.01em',
//         lineHeight: 1.3,
//         margin: '0 0 10px',
//       }}>
//         <span className="text-gradient">Absolute Beliefs Meet Absolute Scrutiny.</span>
//       </p>

//       {/* ── 4. Body paragraph ────────────────────────────────────────── */}
//       <p className="float-text" style={{
//         textAlign: 'center',
//         fontSize: 12,
//         color: 'rgba(200,195,220,0.90)',
//         lineHeight: 1.65,
//         margin: '0 0 14px',
//       }}>
//         Enter any field and watch four AI agents tear apart its foundational
//         assumptions — revealing where the next breakthrough might be hiding.
//       </p>

//       {/* ── 5. Brain image — floats directly on starfield, no container background ── */}
//       <div
//         className="brain-image-wrap"
//         style={{
//           margin: '0 auto 16px',
//           width: 'min(90%, 480px)',
//           background: 'none',
//           border: 'none',
//           boxShadow: 'none',
//         }}
//       >
//         <img
//           src="/brain-texture.png"
//           alt="Neural brain particle sculpture"
//           draggable={false}
//         />
//         {/* Pulse dot A — upper-right lobe region */}
//         <div
//           className="brain-dot-pulse"
//           style={{
//             position: 'absolute',
//             top: '38%', left: '54%',
//             width: 8, height: 8,
//             borderRadius: '50%',
//             background: '#ff3333',
//             boxShadow: '0 0 8px 2px rgba(255,51,51,0.65)',
//             transformOrigin: 'center',
//             pointerEvents: 'none',
//           }}
//         />
//         {/* Pulse dot B — lower-left lobe region */}
//         <div
//           className="brain-dot-pulse"
//           style={{
//             position: 'absolute',
//             top: '62%', left: '42%',
//             width: 8, height: 8,
//             borderRadius: '50%',
//             background: '#ff3333',
//             boxShadow: '0 0 8px 2px rgba(255,51,51,0.65)',
//             transformOrigin: 'center',
//             animationDelay: '1s',
//             pointerEvents: 'none',
//           }}
//         />
//       </div>

//       {/* ── 6. Matrix selector label ─────────────────────────────────────── */}
//       {/* ── 7. Persona cards (matrix selector) ───────────────────────────── */}
//       <div style={{ marginBottom: 10 }}>
//         <div style={{
//           fontSize: 10, fontWeight: 700, letterSpacing: '0.12em',
//           color: 'rgba(220,220,235,0.85)', textTransform: 'uppercase', marginBottom: 8,
//         }}>SELECT EVALUATION MATRIX</div>
//         <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
//           {MATRICES.map(m => (
//             <button
//               key={m.key}
//               onClick={() => setMatrix(m.key)}
//               onMouseEnter={gHover}
//               onMouseLeave={gLeave}
//               style={{
//                 background:   matrix === m.key
//                   ? 'rgba(90,55,200,0.18)'
//                   : 'rgba(0,0,0,0.35)',
//                 border:       `1px solid ${matrix === m.key
//                   ? 'rgba(128,82,255,0.55)'
//                   : 'rgba(255,255,255,0.08)'}`,
//                 borderRadius: 12, padding: '10px 12px',
//                 textAlign: 'left', cursor: 'pointer',
//                 backdropFilter: 'blur(8px)',
//                 WebkitBackdropFilter: 'blur(8px)',
//                 transition: `border-color 180ms ${CUBIC}, background 180ms ${CUBIC}`,
//                 willChange: 'transform',
//               }}
//             >
//               <div style={{
//                 fontSize: 11, fontWeight: 700,
//                 color: matrix === m.key ? '#b39dff' : 'rgba(220,220,235,0.85)',
//                 marginBottom: 6, lineHeight: 1.3,
//               }}>{m.label}</div>
//               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px 0' }}>
//                 {m.agents.map(a => (
//                   <div key={a} style={{
//                     fontSize: 10, color: 'rgba(170,170,190,0.85)',
//                     display: 'flex', alignItems: 'center', gap: 3,
//                   }}>
//                     <span>{a.split(' ')[0]}</span>
//                     <span>{a.split(' ').slice(1).join(' ')}</span>
//                   </div>
//                 ))}
//               </div>
//             </button>
//           ))}
//         </div>
//       </div>

//       {/* ── 8. Input + Run button ──────────────────────────────────────────── */}
//       <div style={{
//         display: 'flex', gap: 0, marginBottom: 10,
//         background: 'rgba(0,0,0,0.50)',
//         border: '1px solid rgba(255,255,255,0.12)',
//         borderRadius: 'var(--radius-pill)',
//         overflow: 'hidden',
//         backdropFilter: 'blur(12px)',
//         WebkitBackdropFilter: 'blur(12px)',
//       }}>
//         <input
//           id="axiom-topic-input"
//           type="text"
//           value={input}
//           onChange={e => setInput(e.target.value)}
//           onKeyDown={e => e.key === 'Enter' && handleAnalyze()}
//           placeholder='e.g. "AI Research" or "Cancer Treatment"'
//           style={{
//             flex: 1, background: 'transparent',
//             border: 'none',
//             padding: '11px 16px', color: '#e2e2ef',
//             fontSize: 13, fontWeight: 400, outline: 'none',
//             minWidth: 0,
//           }}
//           onFocus={e => e.currentTarget.parentElement.style.borderColor = 'rgba(128,82,255,0.5)'}
//           onBlur={e  => e.currentTarget.parentElement.style.borderColor = 'rgba(255,255,255,0.10)'}
//         />
//         <button
//           id="axiom-run-button"
//           onClick={() => handleAnalyze()}
//           onMouseEnter={gHoverP}
//           onMouseLeave={gLeaveP}
//           style={{
//             background: 'var(--plum-voltage)',
//             color: '#ffffff',
//             border: 'none',
//             borderRadius: 'var(--radius-pill)',
//             margin: '5px',
//             padding: '8px 16px', fontSize: 13, fontWeight: 600,
//             cursor: 'pointer', whiteSpace: 'nowrap',
//             transition: `opacity 200ms ${CUBIC}, background 200ms ${CUBIC}`,
//             flexShrink: 0, willChange: 'transform',
//           }}
//         >
//           Run AXIOM →
//         </button>
//       </div>

//       {/* ── 9. Quick-select chips ─────────────────────────────────────────── */}
//       <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
//         {EXAMPLES.map(ex => (
//           <button
//             key={ex.label}
//             onClick={() => handleAnalyze(ex.label)}
//             style={{
//               background: 'rgba(20,20,32,0.65)',
//               border: '1px solid rgba(255,255,255,0.07)',
//               borderRadius: 'var(--radius-pill)',
//               padding: '5px 12px', fontSize: 11, color: 'rgba(185,185,205,0.9)',
//               cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
//               transition: `background 180ms ${CUBIC}, border-color 180ms ${CUBIC}`,
//               willChange: 'transform',
//             }}
//             onMouseEnter={e => { gHover(e); e.currentTarget.style.background = 'rgba(255,255,255,0.09)'; e.currentTarget.style.borderColor = 'rgba(128,82,255,0.35)' }}
//             onMouseLeave={e => { gLeave(e); e.currentTarget.style.background = 'rgba(20,20,32,0.65)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)' }}
//           >
//             <span>{ex.icon}</span>
//             <span>{ex.label}</span>
//           </button>
//         ))}
//       </div>
//     </div>
//   )

//   // ════════════════════════════════════════════════════════════════════════════
//   // RENDER
//   // ════════════════════════════════════════════════════════════════════════════
//   return (
//     <div style={{
//       background: '#000000',
//       position: 'relative',
//       overflowX: 'hidden',
//       minHeight: '100vh',
//     }}>

//       {/* CSS keyframes */}
//       <style>{`
//         @keyframes axiom-pulse {
//           0%, 100% { opacity: 1; transform: scale(1); }
//           50% { opacity: 0.3; transform: scale(0.7); }
//         }
//         @keyframes axiom-float {
//           0%, 100% { transform: translateY(0); }
//           50%       { transform: translateY(-6px); }
//         }
//         @media (max-width: 600px) { .axiom-nav-links { display: none !important; } }
//         #axiom-topic-input::placeholder { color: rgba(155,155,175,0.55); }
//       `}</style>

//       {/* ── FULL-PAGE PARTICLE BACKGROUND z=0 — NO exclusion zone ─────────── */}
//       {/* Renders on ALL viewport sizes so it shines through the glass card  */}
//       <StarfieldCanvas />
//       <ParticleBackground
//         shape="brain"
//         targetCX={0.50}
//         targetCY={0.42}
//       />

//       {/* ── FIXED NAV (z-index: 20) ─────────────────────────────────────────── */}
//       <nav style={{
//         position: 'fixed', top: 0, left: 0, right: 0, zIndex: 20,
//         display: 'flex', alignItems: 'center', justifyContent: 'space-between',
//         padding: '13px 20px', height: NAV_H,
//         background: 'rgba(0,0,0,0.55)',
//         backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
//         borderBottom: '1px solid rgba(255,255,255,0.05)',
//       }}>
//         <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
//           <BrainSVGMark size={26} />
//           <span style={{
//             fontSize: 13, fontWeight: 700, letterSpacing: '0.10em',
//             color: '#ffffff', textTransform: 'uppercase',
//           }}>AXIOM</span>
//         </div>

//         <div className="axiom-nav-links" style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
//           {['Pipeline', 'History', 'About'].map(label => (
//             <button
//               key={label}
//               onClick={label === 'History' ? () => navigate('/history') : undefined}
//               onMouseEnter={e => { gHover(e); e.currentTarget.style.color = '#ffffff' }}
//               onMouseLeave={e => { gLeave(e); e.currentTarget.style.color = 'rgba(155,155,175,0.8)' }}
//               style={{
//                 background: 'none', border: 'none', padding: '4px 0',
//                 fontSize: 12, fontWeight: 600, color: 'rgba(155,155,175,0.8)',
//                 cursor: 'pointer', letterSpacing: '0.02em',
//                 transition: `color 200ms ${CUBIC}`,
//                 willChange: 'transform',
//               }}
//             >{label}</button>
//           ))}
//           <button
//             onMouseEnter={gHoverP}
//             onMouseLeave={gLeaveP}
//             style={{
//               background: 'var(--plum-voltage)', color: '#ffffff',
//               border: 'none', borderRadius: 'var(--radius-pill)',
//               padding: '7px 20px', fontSize: 12, fontWeight: 600,
//               cursor: 'pointer', letterSpacing: '0.02em',
//               willChange: 'transform',
//             }}
//           >Request Access</button>
//         </div>
//       </nav>

//       {/* ── SCROLL CONTENT (z-index: 1) ─────────────────────────────────────── */}
//       <main id="scroll-journey" style={{ position: 'relative', zIndex: 1 }}>

//         {/* ══ SECTION 1 — HERO ════════════════════════════════════════════════ */}
//         <section
//           id="section-hero"
//           style={{ minHeight: '100vh', paddingTop: NAV_H, display: 'flex', flexDirection: 'column' }}
//         >
//           <div style={{
//             flex: 1, display: 'flex',
//             flexDirection: 'column',
//             alignItems: 'center',
//             justifyContent: 'center',
//             padding: isMobile ? '20px 14px' : '24px clamp(14px, 4vw, 48px)',
//           }}>
//             {GlassPanel}
//           </div>

//           {/* Scroll indicator */}
//           <div style={{
//             display: 'flex', flexDirection: 'column', alignItems: 'center',
//             paddingBottom: 28, gap: 6,
//             animation: REDUCED_MOTION ? 'none' : 'axiom-float 2.4s ease-in-out infinite',
//             opacity: 0.32,
//           }}>
//             <div style={{
//               width: 1, height: 36,
//               background: 'linear-gradient(to bottom, transparent, var(--plum-voltage))',
//             }} />
//             <div style={{ fontSize: 9, letterSpacing: '0.14em', color: 'rgba(155,155,175,0.7)', textTransform: 'uppercase' }}>
//               scroll
//             </div>
//           </div>
//         </section>

//         {/* ══ SECTION 2 — QUESTIONING ══════════════════════════════════════════ */}
//         <section
//           id="section-questioning"
//           style={{
//             minHeight: '100vh',
//             display: 'flex', alignItems: 'center', justifyContent: 'center',
//             padding: '80px 24px',
//           }}
//         >
//           <div style={{ maxWidth: 680, textAlign: 'center' }}>
//             <FadeSection>
//               <div style={{
//                 fontSize: 9, fontWeight: 700, letterSpacing: '0.18em',
//                 color: 'var(--plum-voltage)', textTransform: 'uppercase', marginBottom: 24,
//               }}>Epistemic Interrogation</div>
//             </FadeSection>

//             <FadeSection delay={80}>
//               <h2 style={{
//                 fontSize: 'clamp(36px, 6vw, 72px)', fontWeight: 200,
//                 letterSpacing: '-0.03em', lineHeight: 1.15, margin: '0 0 28px',
//                 color: '#ffffff',
//               }}>
//                 Every breakthrough<br />
//                 <span className="text-gradient">hides an assumption.</span>
//               </h2>
//             </FadeSection>

//             <FadeSection delay={160}>
//               <p style={{ fontSize: 15, color: 'rgba(155,155,175,0.8)', lineHeight: 1.75, margin: '0 0 20px' }}>
//                 The beliefs holding your field back exist exactly because
//                 no one thinks to question them. They are invisible — until
//                 a field collapses, or a breakthrough forces reconsideration.
//               </p>
//             </FadeSection>

//             <FadeSection delay={240}>
//               <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.18)', lineHeight: 1.6, fontStyle: 'italic' }}>
//                 "We cannot solve our problems with the same thinking we used
//                 when we created them." — Einstein
//               </p>
//             </FadeSection>
//           </div>
//         </section>

//         {/* ══ SECTION 3 — HISTORICAL ══════════════════════════════════════════ */}
//         <section
//           id="section-historical"
//           style={{
//             minHeight: '90vh',
//             display: 'flex', flexDirection: 'column',
//             alignItems: 'center', justifyContent: 'center',
//             padding: '60px 20px',
//           }}
//         >
//           <FadeSection style={{ width: '100%', maxWidth: 980 }}>
//             <div style={{ textAlign: 'center', marginBottom: 40 }}>
//               <div style={{
//                 fontSize: 9, fontWeight: 700, letterSpacing: '0.18em',
//                 color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', marginBottom: 14,
//               }}>Civilizational Blind Spots</div>
//               <h2 style={{
//                 fontSize: 'clamp(24px, 3.5vw, 40px)', fontWeight: 200,
//                 letterSpacing: '-0.02em', margin: 0, color: '#ffffff',
//               }}>Fields have always had blind spots.</h2>
//             </div>

//             <div style={{
//               display: 'grid',
//               gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
//               gap: 10,
//             }}>
//               {HISTORICAL.map((h, i) => (
//                 <FadeSection key={i} delay={i * 90}>
//                   <div style={{
//                     background: 'rgba(12,12,18,0.62)',
//                     backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
//                     border: '1px solid rgba(255,255,255,0.07)',
//                     borderRadius: 20, padding: '20px 22px', height: '100%',
//                   }}>
//                     <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
//                       <span style={{ fontFamily: 'monospace', fontSize: 13, color: 'var(--plum-voltage)', fontWeight: 600 }}>
//                         {h.year}
//                       </span>
//                       <span style={{
//                         fontSize: 9, color: 'rgba(155,155,175,0.8)',
//                         background: 'rgba(255,255,255,0.06)',
//                         borderRadius: 6, padding: '2px 7px', letterSpacing: '0.06em',
//                       }}>{h.field}</span>
//                     </div>
//                     <p style={{ fontSize: 13, color: 'rgba(185,185,205,0.9)', lineHeight: 1.65, margin: 0 }}>{h.text}</p>
//                   </div>
//                 </FadeSection>
//               ))}
//             </div>
//           </FadeSection>
//         </section>

//         {/* ══ SECTION 4 — CTA ═════════════════════════════════════════════════ */}
//         <section
//           id="section-cta"
//           style={{
//             minHeight: '100vh', position: 'relative',
//             display: 'flex', flexDirection: 'column',
//             alignItems: 'center', justifyContent: 'center',
//             padding: '80px 24px',
//           }}
//         >
//           <FadeSection style={{ textAlign: 'center', maxWidth: 640 }}>
//             <div style={{
//               fontSize: 9, fontWeight: 700, letterSpacing: '0.18em',
//               color: 'var(--amber-spark)', textTransform: 'uppercase', marginBottom: 24,
//             }}>Spark Blind Spot Moments</div>

//             <h2 style={{
//               fontSize: 'clamp(36px, 6vw, 72px)', fontWeight: 200,
//               letterSpacing: '-0.03em', lineHeight: 1.15, margin: '0 0 16px',
//               color: '#ffffff',
//             }}>
//               Surface<br />
//               <span className="text-gradient">the invisible.</span>
//             </h2>

//             <p style={{ fontSize: 15, color: 'rgba(155,155,175,0.8)', lineHeight: 1.7, margin: '0 0 40px' }}>
//               Enter any field and watch four AI agents tear apart its foundational
//               assumptions — revealing where the next breakthrough might be hiding.
//             </p>

//             {/* Inline run form */}
//             <div style={{
//               background: 'rgba(0,0,0,0.50)',
//               backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
//               border: '1px solid rgba(255,255,255,0.06)',
//               borderRadius: 20, padding: '20px 22px', marginBottom: 20,
//             }}>
//               <div style={{
//                 display: 'flex', gap: 0,
//                 background: 'rgba(20,20,32,0.75)',
//                 border: '1px solid rgba(255,255,255,0.10)',
//                 borderRadius: 'var(--radius-pill)', overflow: 'hidden',
//               }}>
//                 <input
//                   id="cta-topic-input"
//                   type="text"
//                   value={input}
//                   onChange={e => setInput(e.target.value)}
//                   onKeyDown={e => e.key === 'Enter' && handleAnalyze()}
//                   placeholder='Enter a field — "Quantum Computing", "Climate Policy"…'
//                   style={{
//                     flex: 1, background: 'transparent', border: 'none',
//                     borderRadius: 'var(--radius-pill)',
//                     padding: '12px 18px', color: '#e2e2ef',
//                     fontSize: 14, fontWeight: 400, outline: 'none',
//                     minWidth: 0,
//                   }}
//                   onFocus={e => e.currentTarget.parentElement.style.borderColor = 'rgba(128,82,255,0.5)'}
//                   onBlur={e  => e.currentTarget.parentElement.style.borderColor = 'rgba(255,255,255,0.10)'}
//                 />
//                 <button
//                   id="cta-run-button"
//                   onClick={() => handleAnalyze()}
//                   onMouseEnter={gHoverP}
//                   onMouseLeave={gLeaveP}
//                   disabled={!input.trim()}
//                   style={{
//                     background: input.trim() ? 'var(--plum-voltage)' : 'rgba(128,82,255,0.35)',
//                     color: '#ffffff',
//                     border: 'none', borderRadius: 'var(--radius-pill)',
//                     margin: '5px',
//                     padding: '10px 22px', fontSize: 14, fontWeight: 600,
//                     cursor: input.trim() ? 'pointer' : 'not-allowed',
//                     opacity: input.trim() ? 1 : 0.50, whiteSpace: 'nowrap',
//                     transition: `opacity 200ms ${CUBIC}`, flexShrink: 0,
//                     willChange: 'transform',
//                   }}
//                 >Run AXIOM →</button>
//               </div>
//             </div>

//             {/* Quick-launch chips */}
//             <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, justifyContent: 'center' }}>
//               {EXAMPLES.map(ex => (
//                 <button
//                   key={ex.label}
//                   onClick={() => handleAnalyze(ex.label)}
//                   style={{
//                     background: 'rgba(20,20,32,0.65)',
//                     border: '1px solid rgba(255,255,255,0.08)',
//                     borderRadius: 'var(--radius-pill)',
//                     padding: '6px 14px', fontSize: 12, color: 'rgba(185,185,205,0.9)',
//                     cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
//                     transition: `background 180ms ${CUBIC}`,
//                     willChange: 'transform',
//                   }}
//                   onMouseEnter={e => { gHover(e); e.currentTarget.style.background = 'rgba(255,255,255,0.10)' }}
//                   onMouseLeave={e => { gLeave(e); e.currentTarget.style.background = 'rgba(20,20,32,0.65)' }}
//                 >
//                   <span>{ex.icon}</span>
//                   <span>{ex.label}</span>
//                 </button>
//               ))}
//             </div>
//           </FadeSection>

//           {/* Footer */}
//           <div style={{
//             position: 'absolute', bottom: 28, left: 0, right: 0,
//             textAlign: 'center',
//             fontSize: 10, color: 'rgba(255,255,255,0.12)', letterSpacing: '0.08em',
//           }}>
//             AXIOM · Moonshot Hackathon 2026 · epistemic multi-agent pipeline
//           </div>
//         </section>

//       </main>
//     </div>
//   )
// }



import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import ParticleBackground from './components/ParticleBackground'
import Navbar from './components/Navbar'

const NAV_H = 53

const EXAMPLES = [
  { label: 'AI Research',      icon: '🤖' },
  { label: 'Cancer Treatment', icon: '🔬' },
  { label: 'Economic Policy',  icon: '📊' },
  { label: 'Education System', icon: '🎓' },
  { label: 'Mental Health',    icon: '🧠' },
]

const HISTORICAL = [
  {
    year: '1847',
    text: 'Doctors assumed handwashing was unnecessary — killed thousands.',
    field: 'Medicine',
  },
  {
    year: '1983',
    text: "Scientists assumed bacteria couldn't survive stomach acid — ignored ulcer cure for decades.",
    field: 'Biology',
  },
  {
    year: '2008',
    text: 'Economists assumed housing prices never fall — triggered global financial crisis.',
    field: 'Economics',
  },
]

// Per-card accent palette for the Civilizational Blind Spots section
const CARD_ACCENT = [
  { year: '#f472b6', badgeBg: 'rgba(244,114,182,0.15)', badgeColor: '#f472b6', badgeBorder: 'rgba(244,114,182,0.3)' }, // Medicine — pink
  { year: '#34d399', badgeBg: 'rgba(52,211,153,0.15)',  badgeColor: '#34d399', badgeBorder: 'rgba(52,211,153,0.3)'  }, // Biology  — teal
  { year: '#fb923c', badgeBg: 'rgba(251,146,60,0.15)',  badgeColor: '#fb923c', badgeBorder: 'rgba(251,146,60,0.3)'  }, // Economics — orange
]

const MATRICES = [
  {
    key: 'epistemic',
    label: 'Philosophical & Epistemic',
    description: 'Default',
    agents: ['🏛️ Historian', '⚔️ Contrarian', '🔬 Scientist', '🧘 Philosopher'],
  },
  {
    key: 'venture',
    label: 'Startup & Venture Capital',
    description: 'Pro Variant',
    agents: ['💰 The Investor', '🗡️ The Critic', '🛒 The Customer', '🚀 Growth Hacker'],
  },
]

function BrainSVGMark({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path d="M15 6C10 6 6 10 6 15c0 3 1.5 5.5 4 7v3h5V6Z"
        fill="none" stroke="#8052ff" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M17 6c5 0 9 4 9 9 0 3-1.5 5.5-4 7v3h-5V6Z"
        fill="none" stroke="#a78bfa" strokeWidth="1.5" strokeLinejoin="round" />
      <line x1="16" y1="6" x2="16" y2="25" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
    </svg>
  )
}

export default function App() {
  const [input,  setInput]  = useState('')
  const [matrix, setMatrix] = useState('epistemic')
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' && window.innerWidth < 768
  )
  const navigate = useNavigate()

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    const h  = e => setIsMobile(e.matches)
    mq.addEventListener('change', h)
    return () => mq.removeEventListener('change', h)
  }, [])

  const handleAnalyze = useCallback((fieldOverride) => {
    const field = (typeof fieldOverride === 'string' ? fieldOverride : input).trim()
    if (!field) return
    navigate('/results', { state: { field, matrix } })
  }, [input, matrix, navigate])

  return (
    <div style={{ background: '#07070b', minHeight: '100vh', position: 'relative', overflowX: 'hidden' }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700;800&family=Inter:wght@400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #07070b; }
        ::placeholder { color: rgba(155,155,175,0.5); }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #07070b; }
        ::-webkit-scrollbar-thumb { background: rgba(128,82,255,0.4); border-radius: 4px; }
        @keyframes axiom-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.3; transform: scale(0.65); }
        }
        @keyframes axiom-float {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-7px); }
        }
        @keyframes brain-dot-pulse {
          0%, 100% { opacity: 1; transform: scale(1); box-shadow: 0 0 8px 2px rgba(255,51,51,0.65); }
          50%       { opacity: 0.5; transform: scale(0.6); box-shadow: 0 0 4px 1px rgba(255,51,51,0.3); }
        }
        .text-gradient {
          background: linear-gradient(135deg, #a78bfa 0%, #7c3aed 40%, #38bdf8 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .chip-btn:hover {
          background: rgba(255,255,255,0.09) !important;
          border-color: rgba(128,82,255,0.35) !important;
        }
        .matrix-btn:hover { opacity: 0.85; }
        .nav-link:hover { color: #ffffff !important; }
        @media (max-width: 640px) { .nav-ghost { display: none !important; } }
      `}</style>

      {/* ── PARTICLE BACKGROUND ──────────────────────────────────────── */}
      <ParticleBackground />

      {/* ── NAVBAR ────────────────────────────────────────── */}
      <Navbar />

      {/* ── MAIN SCROLL ─────────────────────────────────────────────── */}
      <main style={{ position: 'relative', zIndex: 1 }}>

        {/* ══ SECTION 1 — HERO ══════════════════════════════════════════ */}
        <section style={{
          minHeight: '100vh', paddingTop: 80,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: `${80 + 32}px ${isMobile ? 16 : 24}px 40px`,
        }}>
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: [0.4,0,0.2,1] }}
            style={{ width: '100%', maxWidth: 520 }}
          >
            {/* Wordmark */}
            <h1 style={{
              textAlign: 'center',
              fontSize: isMobile ? 72 : 96,
              fontWeight: 800,
              letterSpacing: '-0.01em',
              lineHeight: 0.92,
              margin: '0 0 16px',
              fontFamily: "'Oxanium', cursive",
              background: 'linear-gradient(135deg, #ffffff 0%, #a78bfa 40%, #38bdf8 70%, #34d399 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>AXIOM</h1>

            {/* Tagline */}
            <p style={{
              textAlign: 'center',
              fontSize: '1.3rem',
              fontWeight: '500',
              letterSpacing: '0.01em',
              lineHeight: 1.3,
              margin: '0 0 10px',
              fontFamily: "'Space Grotesk', sans-serif",
              background: 'linear-gradient(90deg, #c084fc 0%, #818cf8 30%, #38bdf8 65%, #2dd4bf 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              AXIOM doesn’t find answers. It exposes the wrong questions.
            </p>

            {/* Subtext */}
            <p style={{
              textAlign: 'center',
              fontSize: '1.15rem',
              fontWeight: '400',
              color: '#e2e8f0',
              lineHeight: '1.7',
              margin: '0 0 28px',
              fontFamily: 'Inter, sans-serif',
            }}>
              Enter any field and watch four AI agents tear apart its foundational
              assumptions — revealing where the next breakthrough might be hiding.
            </p>

            {/* Matrix selector */}
            <div style={{ marginBottom: 14 }}>
              <div style={{
                fontSize: '0.75rem', fontWeight: '700', letterSpacing: '0.15em',
                textTransform: 'uppercase',
                marginBottom: 8, fontFamily: "'Space Grotesk', sans-serif",
                background: 'linear-gradient(90deg, #a78bfa 0%, #38bdf8 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>SELECT EVALUATION MATRIX</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {MATRICES.map(m => {
                  const isSelected = matrix === m.key
                  const isEpistemic = m.key === 'epistemic'

                  // Per-matrix color tokens
                  const tokens = isEpistemic
                    ? {
                        activeBg:     'linear-gradient(135deg, #1e1b4b 0%, #2e1065 50%, #1a1035 100%)',
                        inactiveBg:   'linear-gradient(135deg, #0f172a 0%, #130d2e 50%, #0a0a1a 100%)',
                        activeBorder: '2px solid rgba(139,92,246,0.7)',
                        inactiveBorder:'1px solid rgba(139,92,246,0.2)',
                        activeShadow: '0 0 25px rgba(139,92,246,0.3), inset 0 0 25px rgba(139,92,246,0.05)',
                        inactiveShadow:'0 0 12px rgba(139,92,246,0.08)',
                        titleGradient:'linear-gradient(90deg, #c084fc, #a78bfa)',
                      }
                    : {
                        activeBg:     'linear-gradient(135deg, #1c0f05 0%, #2d1a00 50%, #1a0f00 100%)',
                        inactiveBg:   'linear-gradient(135deg, #0f172a 0%, #1e1035 50%, #0f0f1a 100%)',
                        activeBorder: '2px solid rgba(251,146,60,0.7)',
                        inactiveBorder:'1px solid rgba(251,146,60,0.3)',
                        activeShadow: '0 0 25px rgba(251,146,60,0.3), inset 0 0 25px rgba(251,146,60,0.05)',
                        inactiveShadow:'0 0 15px rgba(251,146,60,0.1)',
                        titleGradient:'linear-gradient(90deg, #fb923c, #f59e0b)',
                      }

                  return (
                    <button
                      key={m.key}
                      className="matrix-btn"
                      onClick={() => setMatrix(m.key)}
                      style={{
                        background:   isSelected ? tokens.activeBg   : tokens.inactiveBg,
                        border:       isSelected ? tokens.activeBorder : tokens.inactiveBorder,
                        boxShadow:    isSelected ? tokens.activeShadow : tokens.inactiveShadow,
                        borderRadius: 12, padding: '10px 12px',
                        textAlign: 'left', cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                      onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0px)'}
                    >
                      {/* Card title */}
                      <div style={{
                        fontSize: '1rem', fontWeight: '800',
                        marginBottom: 6, lineHeight: 1.3,
                        fontFamily: "'Space Grotesk', sans-serif",
                        background: tokens.titleGradient,
                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                      }}>{m.label}</div>

                      {/* Agent grid — 2 cols, no wrap */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px 0' }}>
                        {m.agents.map(a => (
                          <div key={a} style={{
                            fontSize: '0.82rem', fontWeight: '600',
                            color: '#e2e8f0',
                            fontFamily: 'Inter, sans-serif',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}>{a}</div>
                        ))}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Input row */}
            <div style={{
              display: 'flex', gap: 0, marginBottom: 10,
              background: 'rgba(0,0,0,0.55)',
              border: '1px solid rgba(255,255,255,0.10)',
              borderRadius: 99, overflow: 'hidden',
              backdropFilter: 'blur(12px)',
              transition: 'border-color 200ms',
            }}
              onFocusCapture={e => e.currentTarget.style.borderColor = 'rgba(124,58,237,0.5)'}
              onBlurCapture={e  => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.10)'}
            >
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAnalyze()}
                placeholder='e.g. "AI Research" or "Cancer Treatment"'
                style={{
                  flex: 1, background: 'transparent', border: 'none',
                  padding: '12px 18px', color: '#e2e2ef',
                  fontSize: '1rem', fontWeight: '400', outline: 'none',
                  minWidth: 0, fontFamily: 'Inter, sans-serif',
                }}
              />
              <button
                onClick={() => handleAnalyze()}
                style={{
                  background: '#7c3aed', color: '#ffffff',
                  border: 'none', borderRadius: 99,
                  margin: 5, padding: '9px 20px',
                  fontSize: 13, fontWeight: 600,
                  cursor: 'pointer', whiteSpace: 'nowrap',
                  fontFamily: "'Space Grotesk', sans-serif",
                  transition: 'opacity 200ms',
                }}
              >Run AXIOM →</button>
            </div>

            {/* Example chips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {EXAMPLES.map(ex => (
                <button
                  key={ex.label}
                  className="chip-btn"
                  onClick={() => handleAnalyze(ex.label)}
                  style={{
                    background: 'rgba(15,15,25,0.70)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 99, padding: '8px 18px',
                    fontSize: '0.875rem', fontWeight: '500', color: '#cbd5e1',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
                    fontFamily: 'Inter, sans-serif',
                    transition: 'background 180ms, border-color 180ms',
                  }}
                >
                  <span>{ex.icon}</span>
                  <span>{ex.label}</span>
                </button>
              ))}
            </div>
          </motion.div>

          {/* Scroll indicator */}
          <div style={{
            marginTop: 48,
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
            animation: 'axiom-float 2.4s ease-in-out infinite', opacity: 0.28,
          }}>
            <div style={{
              width: 1, height: 36,
              background: 'linear-gradient(to bottom, transparent, #7c3aed)',
            }} />
            <div style={{
              fontSize: 9, letterSpacing: '0.14em',
              color: 'rgba(155,155,175,0.7)', textTransform: 'uppercase',
              fontFamily: "'Space Grotesk', sans-serif",
            }}>scroll</div>
          </div>
        </section>

        {/* ══ SECTION 2 — PHILOSOPHY ════════════════════════════════════ */}
        <section style={{
          minHeight: '80vh',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '80px 24px',
        }}>
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65 }}
            viewport={{ once: true, amount: 0.3 }}
            style={{ maxWidth: 640, textAlign: 'center' }}
          >
            <div style={{
              fontSize: 9, fontWeight: '700', letterSpacing: '0.15em',
              textTransform: 'uppercase', marginBottom: 24,
              fontFamily: "'Space Grotesk', sans-serif",
              background: 'linear-gradient(90deg, #f472b6, #a78bfa, #38bdf8)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>Epistemic Interrogation</div>

            <h2 style={{
              fontSize: 'clamp(2.2rem, 4.4vw, 3.2rem)', fontWeight: '800',
              letterSpacing: '-0.03em', lineHeight: 1.15, margin: '0 0 24px',
              fontFamily: "'Space Grotesk', sans-serif",
            }}>
              <span style={{
                background: 'linear-gradient(135deg, #ffffff 0%, #f0abfc 60%, #e879f9 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                fontWeight: '900',
                filter: 'drop-shadow(0 0 20px rgba(240,171,252,0.3))',
              }}>Every breakthrough</span><br />
              <span style={{
                background: 'linear-gradient(90deg, #818cf8 0%, #c084fc 40%, #f472b6 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                fontWeight: '900',
                filter: 'drop-shadow(0 0 20px rgba(244,114,182,0.3))',
              }}>hides an assumption.</span>
            </h2>

            <p style={{
              fontSize: 'clamp(1rem, 2vw, 1.15rem)', fontWeight: '500',
              color: '#e2e8f0',
              lineHeight: '1.8', fontFamily: 'Inter, sans-serif',
              textShadow: '0 0 30px rgba(192,132,252,0.2)',
              maxWidth: '680px',
            }}>
              The beliefs holding your field back exist exactly because
              no one thinks to question them. They are invisible — until
              a field collapses, or a breakthrough forces reconsideration.
            </p>
          </motion.div>
        </section>

        {/* ══ SECTION 3 — HISTORICAL EXAMPLES ══════════════════════════ */}
        <section style={{
          minHeight: '70vh',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '60px 20px',
        }}>
          <div style={{ width: '100%', maxWidth: 920 }}>
            <div style={{ textAlign: 'center', marginBottom: 40 }}>
              <div style={{
                fontSize: 9, fontWeight: '700', letterSpacing: '0.15em',
                textTransform: 'uppercase', marginBottom: 14,
                fontFamily: "'Space Grotesk', sans-serif",
                background: 'linear-gradient(90deg, #a78bfa, #38bdf8)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>Civilizational Blind Spots</div>
              <h2 style={{
                fontSize: 'clamp(2.2rem, 4.4vw, 3.2rem)', fontWeight: '800',
                letterSpacing: '-0.02em', margin: 0,
                fontFamily: "'Space Grotesk', sans-serif",
                background: 'linear-gradient(135deg, #ffffff 0%, #a78bfa 50%, #38bdf8 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>Fields have always had blind spots.</h2>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
              gap: 10,
            }}>
              {HISTORICAL.map((h, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  viewport={{ once: true, amount: 0.3 }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    boxShadow: 'none',
                    borderRadius: 0,
                    padding: '20px 22px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <span style={{
                      fontFamily: 'monospace', fontSize: '1.1rem',
                      color: CARD_ACCENT[i].year, fontWeight: '800',
                    }}>{h.year}</span>
                    <span style={{
                      fontSize: 9, color: CARD_ACCENT[i].badgeColor, fontWeight: '600',
                      background: CARD_ACCENT[i].badgeBg,
                      border: `1px solid ${CARD_ACCENT[i].badgeBorder}`,
                      borderRadius: '6px', padding: '2px 10px', letterSpacing: '0.06em',
                      fontFamily: "'Space Grotesk', sans-serif",
                    }}>{h.field}</span>
                  </div>
                  <p style={{
                    fontSize: '0.95rem', fontWeight: '500',
                    color: '#e2e8f0',
                    lineHeight: '1.7', margin: 0, fontFamily: 'Inter, sans-serif',
                  }}>{h.text}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ══ FOOTER ════════════════════════════════════════════════════ */}
        <footer style={{
          textAlign: 'center', padding: '32px 24px',
          fontSize: 10, color: 'rgba(255,255,255,0.12)',
          letterSpacing: '0.08em',
          fontFamily: "'Space Grotesk', sans-serif",
          borderTop: '1px solid rgba(255,255,255,0.04)',
        }}>
          AXIOM · Moonshot Hackathon 2026 · epistemic multi-agent pipeline
        </footer>

      </main>
    </div>
  )
}