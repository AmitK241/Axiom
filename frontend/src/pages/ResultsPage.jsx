/**
 * ResultsPage.jsx — AXIOM Cognitive Audit Dashboard
 *
 * Premium glass dashboard layout:
 *   ┌─────────────────────────────────────────────────┐
 *   │  ANALYSIS COMPLETE: {field}    [Export] [Pro]   │  ← header row
 *   ├──────────────────────┬──────────────────────────┤
 *   │ LAYER 1: ASSUMPTIONS │ AGENTS DEBATE             │  ← 2-col grid
 *   │ (bulleted list)      │ (AgentDebate accordion)   │
 *   ├──────────────────────┴──────────────────────────┤
 *   │  ALTERNATIVE SCENARIO (AlternativeWorlds)        │  ← full-width
 *   ├──────────────────────┬──────────────────────────┤
 *   │ COGNITIVE AUDIT SCORE│ Score Arc SVG meter       │  ← footer row
 *   │ (BlindSpotScore)     │                           │
 *   └──────────────────────┴──────────────────────────┘
 *
 * Particle brain stays centered across both input and results pages.
 */
import { useState, useEffect, useRef, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { generateAxiomPDF } from '../utils/generatePDF'
import AgentDebate       from '../components/AgentDebate'
import AssumptionGraph   from '../components/AssumptionGraph'
import Navbar from '../components/Navbar'
import BlindSpotScore, { ScoreArc } from '../components/BlindSpotScore'
import AlternativeWorlds from '../components/AlternativeWorlds'
import StreamingLog      from '../components/StreamingLog'
import BrainIcon         from '../components/BrainIcon'
import ParticleBackground from '../components/ParticleBackground'
import StarfieldCanvas   from '../components/StarfieldCanvas'

const API_BASE = import.meta.env.VITE_API_URL || ''
const CUBIC = 'cubic-bezier(0.4,0,0.2,1)'

// Section-wrapper style: hairline purple glow, no fill — starfield shows through
const GLASS_OUTER = {
  background:   'transparent',
  border:       '1px solid rgba(139,92,246,0.20)',
  borderRadius: 20,
  boxShadow:    '0 0 20px rgba(139,92,246,0.06)',
}

// Inner item styles (individual assumption cards, debate entries, etc.) — keep their fill
const GLASS_INNER = {
  background:           'rgba(255,255,255,0.025)',
  border:               '1px solid rgba(255,255,255,0.06)',
  borderRadius:         16,
}

const RISK_COLOR = {
  catastrophic: '#ef4444',
  high:         '#f97316',
  medium:       '#eab308',
  low:          '#22c55e',
}

// Scroll-anchor positions — brain cluster shifts as user reads down
const SECTION_ANCHORS = {
  'section-header':    { x: 0.50, y: 0.35 },
  'section-grid':      { x: 0.50, y: 0.48 },
  'section-worlds':    { x: 0.50, y: 0.55 },
  'section-score':     { x: 0.50, y: 0.60 },
}

export default function ResultsPage() {
  const location = useLocation()
  const navigate  = useNavigate()
  const field     = location.state?.field
  const matrix    = location.state?.matrix ?? 'epistemic'
  const analysisId = location.state?.analysis_id   // set when navigating from HistoryPage

  const [phase, setPhase]         = useState('streaming')
  const [streamLog, setStreamLog] = useState([])
  const [results, setResults]     = useState(null)
  const [error, setError]         = useState(null)
  const [progress, setProgress]   = useState(0)
  const [exporting, setExporting] = useState(false)
  const [layer2Done, setLayer2Done] = useState(false)
  const [layer3Done, setLayer3Done] = useState(false)
  const [layer4Done, setLayer4Done] = useState(false)
  const [toast, setToast]         = useState(null)   // { msg: string }
  const [isMobile, setIsMobile]   = useState(
    typeof window !== 'undefined' && window.innerWidth < 900
  )
  const [pipelineOpen, setPipelineOpen] = useState(true)
  const [rescueAttempted, setRescueAttempted] = useState(false)

  // ── Watchdog timer + stream abort refs ───────────────────────────────
  // Using refs ensures the watchdog callback always sees the current
  // abort controller and never traps a stale closure value.
  const groqStreamWatchdog = useRef(null)   // sliding 30-s timer handle
  const abortController   = useRef(null)   // AbortController tied to the active fetch
  const isStreamingRef    = useRef(false)  // mirror of phase==='streaming', safe inside async
  const resultsRef        = useRef(null)   // mirror of results state for rescue guard

  // Particle anchor
  const [particleCX, setParticleCX] = useState(0.50)
  const [particleCY, setParticleCY] = useState(0.35)
  const dashboardRef = useRef(null)

  // Responsive
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 899px)')
    const h = e => setIsMobile(e.matches)
    mq.addEventListener('change', h)
    setIsMobile(mq.matches)
    return () => mq.removeEventListener('change', h)
  }, [])

  // ── PDF export (kept for internal reference) ────────────────────────────
  const exportToPDF = async () => {
    if (!dashboardRef.current || exporting) return
    setExporting(true)
    try {
      const canvas = await html2canvas(dashboardRef.current, {
        scale: 2, useCORS: true, backgroundColor: '#000000', logging: false, allowTaint: true,
      })
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: 'a4' })
      const pageW = pdf.internal.pageSize.getWidth()
      const pageH = pdf.internal.pageSize.getHeight()
      const imgH  = (canvas.height * pageW) / canvas.width
      let y = 0, remaining = imgH
      while (remaining > 0) {
        pdf.addImage(imgData, 'PNG', 0, -y, pageW, imgH)
        remaining -= pageH
        if (remaining > 0) { pdf.addPage(); y += pageH }
      }
      pdf.save('AXIOM_Cognitive_Audit_Report.pdf')
    } catch (err) {
      console.error('PDF export failed:', err)
    } finally {
      setExporting(false)
    }
  }

  // ── Download styled PDF report ──────────────────────────────────────────
  const downloadReport = () => {
    if (!results) return
    generateAxiomPDF(results, field)
  }

  // ── Share — copy text to clipboard + toast ───────────────────────────────
  const shareReport = async () => {
    if (!results) return
    const url   = window.location.href
    const score = results.overall_blind_spot_score
    const text  = `AXIOM Report: ${field} | Score: ${score}/100 | ${url}`
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      // Fallback for older browsers
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.opacity  = '0'
      document.body.appendChild(ta)
      ta.focus(); ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    setToast({ msg: '✓ Copied!' })
    setTimeout(() => setToast(null), 2000)
  }

  // ── Stream handling ───────────────────────────────────────────────
  useEffect(() => {
    if (!field) { navigate('/'); return }
    if (analysisId) {
      loadCachedAnalysis(analysisId)
    } else {
      startAnalysis()
    }
    // Cleanup: clear any lingering watchdog when navigating away
    return () => {
      clearTimeout(groqStreamWatchdog.current)
      if (abortController.current) abortController.current.abort()
    }
  }, [field])

  const loadCachedAnalysis = async (id) => {
    try {
      const response = await fetch(`${API_BASE}/api/analysis/${id}`)
      if (!response.ok) throw new Error('Analysis not found — re-running...')
      const doc = await response.json()
      // doc.result contains the full pipeline result
      const result = doc.result
      setResults(result)
      setProgress(100)
      setLayer2Done(true)
      setLayer3Done(true)
      setLayer4Done(true)
      setStreamLog([{ type: 'done', message: '✓ Loaded from saved analysis' }])
      setTimeout(() => setPhase('results'), 300)
    } catch (err) {
      // Fall back to fresh analysis if cache load fails
      startAnalysis()
    }
  }

  // ──────────────────────────────────────────────────────────
  // DATABASE RESCUE STRATEGY
  // Sole responsibility: abort the stalled network connection, then make
  // one background GET to /api/analysis/latest?field=... to pull the most
  // recently persisted result. If the backend finished writing to MongoDB
  // independently of the broken SSE pipe, this gives us the complete data.
  // ──────────────────────────────────────────────────────────
  const executeDatabaseRescue = async () => {
    // Guard: if results already landed (race between final token and watchdog
    // fire), do not overwrite good data with a stale DB fetch.
    if (resultsRef.current) {
      console.info('[Watchdog] Results already present — rescue skipped.')
      return
    }

    // ① Kill the stalled SSE connection
    if (abortController.current) {
      console.warn('[Watchdog] Aborting stalled SSE connection.')
      abortController.current.abort()
    }

    // Log rescue attempt in the streaming panel so the user sees activity
    setStreamLog(prev => [...prev, {
      type: 'status',
      message: '⚠️ Stream idle — activating DB rescue fallback…',
    }])
    setRescueAttempted(true)

    // ② Background fetch to the rescue endpoint
    try {
      const rescueRes = await fetch(
        `${API_BASE}/api/analysis/latest?field=${encodeURIComponent(field)}`
      )

      if (!rescueRes.ok) {
        // Backend hasn't finished persisting yet (still running, or no DB)
        const msg = rescueRes.status === 404
          ? 'Backend still processing — no completed result in DB yet.'
          : `Rescue endpoint error: ${rescueRes.status}`
        console.warn(`[Watchdog] ${msg}`)
        setStreamLog(prev => [...prev, { type: 'status', message: `⚠️ ${msg}` }])
        // Surface a gentle error rather than a blank screen
        setError('Analysis is taking longer than expected. Please retry or check back in a moment.')
        setPhase('error')
        isStreamingRef.current = false
        return
      }

      const doc = await rescueRes.json()
      const rescuedData = doc.result

      // Validate the rescued payload has the shape we need
      if (!rescuedData || !rescuedData.results || rescuedData.results.length === 0) {
        throw new Error('Rescued document is malformed or empty.')
      }

      console.info('[Watchdog] ✅ Rescue successful — injecting DB result into state.')
      setStreamLog(prev => [...prev, {
        type: 'done',
        message: '✅ Recovered from DB — pipeline completed server-side.',
      }])

      // ③ Inject the full dataset and transition to results view
      resultsRef.current = rescuedData
      setResults(rescuedData)
      setProgress(100)
      setLayer2Done(true)
      setLayer3Done(true)
      setLayer4Done(true)
      isStreamingRef.current = false
      setTimeout(() => setPhase('results'), 500)

    } catch (rescueErr) {
      console.error('[Watchdog] Rescue fetch failed:', rescueErr)
      setError(`Stream timed out and rescue failed: ${rescueErr.message}`)
      setPhase('error')
      isStreamingRef.current = false
    }
  }

  // ──────────────────────────────────────────────────────────
  // SLIDING WATCHDOG RESET
  // Called on every decoded chunk from the SSE stream. Clears the previous
  // 30-second timer and starts a fresh one. This means the rescue only
  // fires if the stream goes completely silent for a full 30 seconds —
  // long enough to survive Groq’s free-tier token bursts and rate-limit
  // queuing without triggering false-positive rescues.
  // ──────────────────────────────────────────────────────────
  const resetWatchdog = () => {
    clearTimeout(groqStreamWatchdog.current)
    if (!isStreamingRef.current) return  // stream already complete, no need to arm
    groqStreamWatchdog.current = setTimeout(() => {
      console.warn(
        '[Watchdog] Groq stream idle for 30 s. Activating resilient DB backup rescue…'
      )
      executeDatabaseRescue()
    }, 30_000)
  }

  const startAnalysis = async () => {
    isStreamingRef.current = true
    // Arm the watchdog immediately — if the initial POST itself hangs
    // (Vercel cold start, Groq queue), the 30 s clock starts now.
    resetWatchdog()

    // Create a fresh AbortController for this stream session
    abortController.current = new AbortController()

    try {
      const response = await fetch(`${API_BASE}/api/analyze/stream`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ field, matrix }),
        signal:  abortController.current.signal,
      })
      const reader  = response.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)

        // ▶ Every chunk resets the 30-second watchdog — this is the core of
        //   the sliding window. As long as tokens keep arriving (even slowly)
        //   the rescue will never fire.
        resetWatchdog()

        for (const line of chunk.split('\n')) {
          if (!line.startsWith('data: ')) continue
          try { handleStreamEvent(JSON.parse(line.slice(6))) } catch {}
        }
      }

      // Natural end of stream — always disarm the watchdog first.
      clearTimeout(groqStreamWatchdog.current)
      isStreamingRef.current = false

      // ─────────────────────────────────────────────────────────────────────
      // INFINITE-LOADER SAFEGUARD
      // If the reader hit EOF but resultsRef is still null, the backend's
      // final `complete` SSE event was never delivered to the frontend.
      // Common causes: Vercel 10-s function timeout cuts the pipe after the
      // last assumption saves to MongoDB, Groq flush drops the final frame,
      // or the network layer closes the connection between the last
      // `assumption_done` and the `complete` emit.
      //
      // Rather than leaving the user frozen on the loading spinner forever,
      // we immediately trigger the same DB rescue that the watchdog uses —
      // pulling the already-persisted result straight from MongoDB.
      // ─────────────────────────────────────────────────────────────────────
      if (!resultsRef.current) {
        console.warn(
          '[Stream] Reader EOF with no `complete` event — ' +
          'backend likely finished but pipe was cut. Routing to DB rescue.'
        )
        await executeDatabaseRescue()
      }

    } catch (err) {
      clearTimeout(groqStreamWatchdog.current)
      isStreamingRef.current = false

      // AbortError is expected when we intentionally kill the connection;
      // do not surface it as a user-facing error.
      if (err.name === 'AbortError') {
        console.info('[Watchdog] Fetch aborted — rescue handler will take over.')
        return
      }
      setError(err.message)
      setPhase('error')
    }
  }

  const handleStreamEvent = (data) => {
    switch (data.type) {
      case 'status':
        setStreamLog(prev => [...prev, { type: 'status', message: data.message }])
        break
      case 'assumptions_found':
        setStreamLog(prev => [...prev, { type: 'found', message: `Found ${data.count} hidden assumptions` }])
        setProgress(10)
        break
      case 'debating':
        setStreamLog(prev => [...prev, {
          type: 'debating',
          message: `Agents debating: "${data.assumption?.slice(0, 60)}…"`,
        }])
        setProgress(10 + ((data.index + 1) / (data.total || 5)) * 70)
        setLayer2Done(true)
        break
      case 'assumption_done':
        setStreamLog(prev => [...prev, { type: 'done', message: `✓ Assumption ${data.index + 1} complete` }])
        setLayer3Done(true)
        break
      case 'complete':
        // ▶ Graceful completion clear — disarm the watchdog immediately so the
        //   rescue script doesn’t execute after a successful [DONE] signal.
        clearTimeout(groqStreamWatchdog.current)
        isStreamingRef.current = false

        resultsRef.current = data.result
        setResults(data.result)
        setProgress(100)
        setLayer4Done(true)
        setTimeout(() => setPhase('results'), 500)
        break
      case 'error':
        clearTimeout(groqStreamWatchdog.current)
        isStreamingRef.current = false
        setError(data.message)
        setPhase('error')
        break
    }
  }

  // ── Scroll-aware anchor ─────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'results') return
    const observers = []
    Object.entries(SECTION_ANCHORS).forEach(([id, anchor]) => {
      const el = document.getElementById(id)
      if (!el) return
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setParticleCX(anchor.x)
            setParticleCY(anchor.y)
          }
        },
        { threshold: 0.25 }
      )
      obs.observe(el)
      observers.push(obs)
    })
    return () => observers.forEach(o => o.disconnect())
  }, [phase])

  const assumptions = useMemo(
    () => (results?.results ?? []).map((r, i) => ({
      id: r.assumption?.id ?? `assumption-${i}`,
      text: r.assumption.assumption,
      score: r.blind_spot_score.score,
      risk: r.blind_spot_score.risk_level,
      evidence: r.assumption.evidence_strength,
    })),
    [results],
  )

  if (!field) return null

  // ── Agent list for loading screen ───────────────────────────────────────
  const agentList = matrix === 'venture'
    ? [
        { name: 'The Investor',      emoji: '💰', desc: 'Evaluating market returns' },
        { name: 'The Critic',        emoji: '🗡️', desc: 'Attacking weak points' },
        { name: 'The Customer',      emoji: '🛒', desc: 'Testing real-world fit' },
        { name: 'The Growth Hacker', emoji: '🚀', desc: 'Stress-testing scalability' },
      ]
    : [
        { name: 'Historian',   emoji: '🏛️', desc: 'Finding precedents' },
        { name: 'Contrarian',  emoji: '⚔️',  desc: 'Attacking assumptions' },
        { name: 'Scientist',   emoji: '🔬', desc: 'Evaluating evidence' },
        { name: 'Philosopher', emoji: '🧘', desc: 'Tracing premises' },
      ]

  return (
    <div style={{ minHeight: '100vh', background: '#000000', color: 'var(--bone)', fontFamily: "'Space Grotesk','Inter',sans-serif" }}>

      {/* ── Sparse starfield (same as home) ── */}
      <StarfieldCanvas />

      {/* ── Brain particle background (consistent with home) ── */}
      <ParticleBackground
        shape="brain"
        targetCX={particleCX}
        targetCY={particleCY}
      />

      {/* ── Toast notification ── */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)',
          zIndex: 9999,
          background: 'rgba(34,197,94,0.18)', border: '1px solid rgba(34,197,94,0.4)',
          color: '#4ade80', borderRadius: 99, padding: '9px 22px',
          fontSize: 13, fontWeight: 700, letterSpacing: '0.05em',
          backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
          animation: 'axiom-toast-in 200ms ease',
          pointerEvents: 'none',
        }}>
          {toast.msg}
        </div>
      )}

      <style>{`
        @keyframes axiom-toast-in {
          from { opacity: 0; transform: translateX(-50%) translateY(10px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>

      {/* ── NAVBAR ──────────────────────────────────────────────────── */}
      <Navbar />

      {/* Results action buttons ─────────────────────────────────────── */}
      {results && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 998,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <button
            onClick={downloadReport}
            style={{
              background: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
              color: '#ffffff',
              border: 'none',
              borderRadius: 'var(--radius-pill)',
              padding: '8px 18px', fontSize: 12, fontWeight: 700,
              cursor: 'pointer',
              transition: `opacity 200ms ${CUBIC}, transform 150ms ${CUBIC}`,
              display: 'flex', alignItems: 'center', gap: 6,
              boxShadow: '0 4px 20px rgba(124,58,237,0.45)',
              letterSpacing: '0.03em',
            }}
            onMouseEnter={e => { e.currentTarget.style.opacity = '0.85'; e.currentTarget.style.transform = 'translateY(-1px)' }}
            onMouseLeave={e => { e.currentTarget.style.opacity = '1';    e.currentTarget.style.transform = 'translateY(0)' }}
          >
            ↓ Download Report
          </button>
          <button
            onClick={shareReport}
            style={{
              background: 'rgba(56,189,248,0.10)',
              color: '#38bdf8',
              border: '1px solid rgba(56,189,248,0.30)',
              borderRadius: 'var(--radius-pill)',
              padding: '6px 16px', fontSize: 12, fontWeight: 600,
              cursor: 'pointer',
              transition: `opacity 200ms ${CUBIC}`,
              display: 'flex', alignItems: 'center', gap: 5,
            }}
          >
            🔗 Share Report
          </button>
        </div>
      )}

      {/* ── STREAMING PHASE ── */}
      {phase === 'streaming' && (
        <div style={{ maxWidth: 620, margin: '0 auto', padding: '80px 24px 60px', position: 'relative', zIndex: 1 }}>
          <div style={{ ...GLASS_OUTER, padding: '36px 32px', textAlign: 'center', marginBottom: 24,
            backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}>
            <div style={{ width: 56, height: 56, margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BrainIcon size={48} />
            </div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', color: 'var(--plum-voltage)', textTransform: 'uppercase', marginBottom: 8 }}>
              {matrix === 'venture' ? 'Venture Capital Analysis Running' : 'Epistemic Analysis Running'}
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 300, letterSpacing: '-0.02em', margin: '0 0 6px', color: 'var(--bone)' }}>
              Analyzing <span style={{ color: 'var(--plum-voltage)' }}>"{field}"</span>
            </h2>
            <p style={{ fontSize: 13, color: 'var(--smoke)', margin: '0 0 24px' }}>
              Four AI agents debating hidden assumptions in real-time
            </p>

            {/* Progress bar */}
            <div style={{ height: 2, background: 'rgba(255,255,255,0.06)', borderRadius: 2, marginBottom: 28, overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 2,
                background: 'linear-gradient(90deg, #7c3aed, #c084fc)',
                width: `${progress}%`, transition: 'width 500ms ease',
              }} />
            </div>

            {/* Agent status chips */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {agentList.map((agent, i) => (
                <div key={agent.name} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  ...GLASS_INNER, padding: '10px 12px',
                }}>
                  <span style={{ fontSize: 16 }}>{agent.emoji}</span>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--bone)' }}>{agent.name}</div>
                    <div style={{ fontSize: 10, color: 'var(--smoke)' }}>{agent.desc}</div>
                  </div>
                  <div style={{
                    marginLeft: 'auto', width: 6, height: 6, borderRadius: 3,
                    background: 'var(--plum-voltage)',
                    animation: 'nodePulse 2s ease-in-out infinite',
                    animationDelay: `${i * 0.3}s`,
                  }} />
                </div>
              ))}
            </div>
          </div>

          <div style={{ ...GLASS_OUTER, padding: '20px 22px',
            backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}>
            <StreamingLog logs={streamLog} />
          </div>
        </div>
      )}

      {/* ── ERROR ── */}
      {phase === 'error' && (
        <div style={{ maxWidth: 460, margin: '80px auto', padding: '0 24px', textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <div style={{ ...GLASS_OUTER, padding: '36px 28px',
            backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}>
            <div style={{ fontSize: 40, marginBottom: 14 }}>⚠️</div>
            <h2 style={{ fontSize: 20, fontWeight: 300, letterSpacing: '-0.02em', marginBottom: 8, color: 'var(--bone)' }}>Analysis failed</h2>
            <p style={{ fontSize: 13, color: 'var(--smoke)', marginBottom: 24 }}>{error}</p>
            <button
              onClick={() => navigate('/')}
              style={{
                background: 'var(--plum-voltage)', color: 'var(--bone)', border: 'none',
                borderRadius: 'var(--radius-pill)', padding: '10px 28px',
                fontSize: 14, fontWeight: 600, cursor: 'pointer',
              }}
            >
              ← Try Again
            </button>
          </div>
        </div>
      )}

      {/* ── RESULTS DASHBOARD ── */}
      {phase === 'results' && results && (
        <div
          ref={dashboardRef}
          style={{
            maxWidth: 1160,
            margin: '0 auto',
            padding: isMobile ? '84px 14px 80px' : '90px 28px 100px',
            position: 'relative',
            zIndex: 1,
          }}
        >

          {/* ── HEADER — Intelligence Report Cover ────────────────────────── */}
          <div id="section-header" style={{
            ...GLASS_OUTER,
            padding: isMobile ? '32px 24px 28px' : '44px 44px 36px',
            marginBottom: 24,
            background: 'rgba(255,255,255,0.018)',
            borderColor: 'rgba(255,255,255,0.09)',
            position: 'relative', overflow: 'hidden',
          }}>
            {/* Dramatic gradient glow behind header */}
            <div style={{
              position: 'absolute', inset: 0, pointerEvents: 'none',
              background: 'radial-gradient(ellipse 80% 70% at 50% -5%, rgba(124,58,237,0.18) 0%, rgba(56,189,248,0.04) 55%, transparent 75%)',
            }} />
            {/* Subtle top-edge highlight line */}
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: 1, pointerEvents: 'none',
              background: 'linear-gradient(90deg, transparent 0%, rgba(167,139,250,0.55) 30%, rgba(56,189,248,0.35) 70%, transparent 100%)',
            }} />

            {/* Row 1: eyebrow label + matrix badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap', position: 'relative' }}>
              <div style={{
                fontSize: 9, fontWeight: '700', letterSpacing: '0.15em',
                textTransform: 'uppercase',
                background: 'linear-gradient(90deg, #a78bfa, #38bdf8)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                AXIOM BLIND SPOT REPORT
              </div>

              {/* Matrix badge — prominent pill */}
              {(() => {
                const isVenture = matrix === 'venture'
                return (
                  <span style={{
                    fontSize: 10, fontWeight: 700, letterSpacing: '0.10em',
                    textTransform: 'uppercase',
                    color:       isVenture ? '#fbbf24' : '#818cf8',
                    background:  isVenture ? 'rgba(251,191,36,0.12)' : 'rgba(129,140,248,0.12)',
                    border:      `1px solid ${isVenture ? 'rgba(251,191,36,0.40)' : 'rgba(129,140,248,0.40)'}`,
                    borderRadius: 99, padding: '4px 12px',
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    boxShadow: isVenture ? '0 0 12px rgba(251,191,36,0.12)' : '0 0 12px rgba(129,140,248,0.12)',
                  }}>
                    {isVenture ? '💰' : '🏛️'}{' '}{isVenture ? 'Venture Matrix' : 'Epistemic Matrix'}
                  </span>
                )
              })()}
            </div>

            {/* Row 2: Field name (hero-sized) + score badge */}
            <div style={{
              display: 'flex',
              alignItems: isMobile ? 'flex-start' : 'center',
              gap: isMobile ? 16 : 28,
              flexWrap: 'wrap',
              marginBottom: 20,
              position: 'relative',
            }}>
              <h1 style={{
                fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)',
                fontWeight: '700',
                letterSpacing: '-0.01em',
                margin: 0,
                lineHeight: '1.2',
                fontFamily: "'Space Grotesk', 'Inter', sans-serif",
                background: 'linear-gradient(135deg, #e2e8f0 0%, #c084fc 30%, #7c3aed 60%, #4f46e5 80%, #2563eb 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                filter: 'drop-shadow(0 0 20px rgba(124,58,237,0.25))',
              }}>
                <span style={{ WebkitTextFillColor: '#7c3aed', filter: 'none', fontWeight: '800' }}>{'“'}</span>
                {(field || '').charAt(0).toUpperCase() + (field || '').slice(1)}
                <span style={{ WebkitTextFillColor: '#7c3aed', filter: 'none', fontWeight: '800' }}>{'”'}</span>
              </h1>

              {/* Score badge — large colored number with glow */}
              {(() => {
                const s   = results.overall_blind_spot_score
                const col = s > 70 ? '#ef4444' : s > 45 ? '#eab308' : '#22c55e'
                const bg  = s > 70 ? 'rgba(239,68,68,0.10)' : s > 45 ? 'rgba(234,179,8,0.10)' : 'rgba(34,197,94,0.10)'
                const bdr = s > 70 ? 'rgba(239,68,68,0.35)' : s > 45 ? 'rgba(234,179,8,0.35)' : 'rgba(34,197,94,0.35)'
                const glow = s > 70 ? 'rgba(239,68,68,0.18)' : s > 45 ? 'rgba(234,179,8,0.18)' : 'rgba(34,197,94,0.18)'
                return (
                  <div style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    background: bg,
                    border: `1px solid ${bdr}`,
                    borderRadius: 20,
                    padding: '16px 20px',
                    flexShrink: 0,
                    boxShadow: `0 0 32px ${glow}, inset 0 1px 0 rgba(255,255,255,0.06)`,
                  }}>
                    <span style={{
                      fontSize: '2.5rem',
                      fontWeight: '700',
                      color: col,
                      lineHeight: 1,
                      fontVariantNumeric: 'tabular-nums',
                      fontFamily: "'Space Grotesk', 'Inter', sans-serif",
                      textShadow: `0 0 20px ${glow}`,
                    }}>{s}</span>
                    <span style={{
                      fontSize: '0.75rem', color: '#64748b',
                      letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 500,
                    }}>
                      / 100
                    </span>
                  </div>
                )
              })()}
            </div>

            {/* Row 3: subtitle stats */}
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'center', position: 'relative' }}>
              <span style={{ fontSize: 13, color: 'rgba(200,200,220,0.55)', letterSpacing: '0.01em' }}>
                <span style={{ color: '#a78bfa', fontWeight: '700', fontSize: 15 }}>{results.total_assumptions}</span>
                <span style={{ color: '#94a3b8', fontWeight: '500' }}>{' '}assumptions found</span>
                <span style={{ margin: '0 10px', opacity: 0.20 }}>·</span>
                <span style={{ color: '#a78bfa', fontWeight: '700', fontSize: 15 }}>{results.critical_count}</span>
                <span style={{ color: '#94a3b8', fontWeight: '500' }}>{' '}critical</span>
              </span>
            </div>
          </div>

          {/* ── LAYER 1 + ASSUMPTION GRAPH + AGENTS DEBATE ───────────────────── */}
          <div id="section-grid" style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 20 }}>
            {/* Layer 1: Assumptions Detected */}
            <div style={{ ...GLASS_OUTER, padding: '18px 20px' }}>
              <SectionLabel label="Layer 1 — Assumptions Detected" accent="#c084fc" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {results.results.map((r, i) => {
                  const s = r.blind_spot_score
                  const col = RISK_COLOR[s.risk_level] || '#c084fc'
                  return (
                    <div key={i} style={{
                      display: 'flex', gap: 10, alignItems: 'flex-start',
                      padding: '10px 12px', borderRadius: 12,
                      background: `${col}08`,
                      border: `1px solid ${col}20`,
                    }}>
                      <div style={{
                        flexShrink: 0, width: 32, height: 32, borderRadius: 16,
                        background: `${col}15`, border: `1px solid ${col}40`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 11, fontWeight: 700, color: col,
                        fontVariantNumeric: 'tabular-nums',
                      }}>
                        {s.score}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{
                          fontSize: '0.95rem', color: '#f1f5f9', fontWeight: '700',
                          lineHeight: '1.6', margin: '0 0 4px',
                        }}>
                          {r.assumption.assumption}
                        </p>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          <span style={{
                            fontSize: 9, padding: '1px 7px', borderRadius: 20,
                            color: col, border: `1px solid ${col}44`,
                            letterSpacing: '0.06em', textTransform: 'uppercase',
                            fontFamily: 'monospace',
                          }}>
                            {s.risk_emoji} {s.risk_level}
                          </span>
                          <span style={{ fontSize: 10, color: 'var(--smoke)' }}>
                            {r.assumption.evidence_strength} evidence
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Assumption Graph — reuses the same assumptions array as Layer 1 cards */}
            <AssumptionGraph
              topicName={(field || '').charAt(0).toUpperCase() + (field || '').slice(1)}
              assumptions={assumptions}
            />

            {/* Agents Debate */}
            <div style={{ ...GLASS_OUTER, padding: '18px 20px' }}>
              <SectionLabel label="Agents Debate" accent="#38bdf8" />
              {layer2Done
                ? <AgentDebate results={results} />
                : (
                  <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--smoke)', fontSize: 13 }}>
                    <div style={{ fontSize: 24, marginBottom: 10 }}>⚔️</div>
                    Debate in progress…
                  </div>
                )
              }
            </div>
          </div>

          {/* ── ALTERNATIVE SCENARIO (full-width) ────────────────────────────── */}
          {layer3Done && (
            <div
              id="section-worlds"
              style={{
                ...GLASS_OUTER,
                padding: '18px 20px',
                marginBottom: 20,
                borderColor: 'rgba(21,132,110,0.20)',
              }}
            >
              <SectionLabel label="Alternative Scenario" gradient="linear-gradient(90deg, #f472b6, #a78bfa, #818cf8)" fontSize="0.95rem" fontWeight="800" letterSpacing="0.15em" />
              <AlternativeWorlds results={results} />
            </div>
          )}

          {/* ── FOOTER ROW: SCORE DETAIL (no card — floats on background) ───── */}
          {layer4Done && (
            <div id="section-score" style={{ marginTop: 8 }}>
              <BlindSpotScore results={results} />
            </div>
          )}

          {/* Pipeline log — custom toggle, floats on background */}
          <div style={{ marginTop: 28 }}>
            {/* Header row */}
            <div
              onClick={() => setPipelineOpen(o => !o)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                cursor: 'pointer', userSelect: 'none', padding: '6px 0',
              }}
            >
              <span style={{
                display: 'inline-block',
                transform: pipelineOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                transition: 'transform 0.3s ease',
                color: '#a78bfa',
                fontSize: '0.8rem',
                lineHeight: 1,
              }}>▶</span>

              <span style={{
                fontSize: '1rem', fontWeight: '800', letterSpacing: '0.15em',
                textTransform: 'uppercase',
                background: 'linear-gradient(90deg, #a78bfa, #818cf8, #38bdf8)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>Pipeline Log</span>
            </div>

            {pipelineOpen && (
              <div style={{ paddingTop: 12 }}>
                <StreamingLog logs={streamLog} />
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  )
}

// ── Section label — gradient text, accent dot ────────────────────────────────
function SectionLabel({ label, accent, gradient, fontSize, fontWeight, letterSpacing }) {
  const textStyle = gradient
    ? {
        background: gradient,
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
      }
    : { color: 'var(--smoke)' }
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 7,
      fontSize: fontSize || 9,
      fontWeight: fontWeight || '700',
      letterSpacing: letterSpacing || '0.12em',
      textTransform: 'uppercase',
      marginBottom: 14, paddingBottom: 10,
      borderBottom: '1px solid rgba(255,255,255,0.04)',
      ...textStyle,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: accent || '#a78bfa', flexShrink: 0, display: 'block', WebkitTextFillColor: 'initial', filter: 'none' }} />
      {label}
    </div>
  )
}
