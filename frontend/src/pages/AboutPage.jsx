/**
 * AboutPage.jsx — AXIOM Hackathon Judge Brief
 * 8 sections, all floating on ParticleBackground.
 * Framer Motion fadeInUp on every section.
 */
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import ParticleBackground from '../components/ParticleBackground'
import Navbar from '../components/Navbar'

// ── Shared animation config ──────────────────────────────────────────────────
const FI = { initial: { opacity: 0, y: 40 }, whileInView: { opacity: 1, y: 0 }, transition: { duration: 0.6 }, viewport: { once: true } }

// ── Gradient text helper ─────────────────────────────────────────────────────
const gText = (gradient) => ({
  background: gradient,
  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
})

// ── Section label ────────────────────────────────────────────────────────────
function Label({ text, gradient }) {
  return (
    <div style={{
      fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.15em',
      textTransform: 'uppercase', textAlign: 'center', marginBottom: '1rem',
      fontFamily: "'Space Grotesk', sans-serif",
      ...gText(gradient),
    }}>{text}</div>
  )
}

// ── Section heading ──────────────────────────────────────────────────────────
function SectionHeading({ text, gradient, size = 'clamp(1.6rem, 3vw, 2.2rem)' }) {
  return (
    <h2 style={{
      fontSize: size, fontWeight: 800,
      lineHeight: 1.25, letterSpacing: '-0.02em',
      textAlign: 'center', marginBottom: '3rem', margin: '0 auto 3rem',
      maxWidth: 700, fontFamily: "'Space Grotesk', sans-serif",
      ...gText(gradient),
    }}>{text}</h2>
  )
}

// ── Floating card (transparent, only border) ─────────────────────────────────
const CARD = {
  background: 'transparent',
  border: '1px solid rgba(139,92,246,0.2)',
  borderRadius: 12,
  padding: '1.5rem',
}

// ── Section wrapper ──────────────────────────────────────────────────────────
function Section({ children, paddingTop = '80px' }) {
  return (
    <section style={{ padding: `${paddingTop} 2rem 80px`, maxWidth: 860, margin: '0 auto' }}>
      {children}
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
export default function AboutPage() {
  const navigate = useNavigate()

  return (
    <div style={{ position: 'relative', minHeight: '100vh', fontFamily: 'Inter, sans-serif', color: '#f1f5f9' }}>
      <ParticleBackground cx={0.5} cy={0.4} />

      <Navbar />

      <div style={{ position: 'relative', zIndex: 10 }}>

        {/* ══ SECTION 1 — HERO ══════════════════════════════════════════════ */}
        <Section paddingTop="120px">
          <motion.div {...FI} style={{ textAlign: 'center' }}>
            <Label text="AXIOM · EPISTEMIC AI" gradient="linear-gradient(90deg, #a78bfa, #38bdf8)" />

            <h1 style={{
              fontSize: 'clamp(2rem, 4vw, 3.2rem)', fontWeight: 800,
              lineHeight: 1.2, letterSpacing: '-0.02em',
              margin: '0 auto 1.5rem', maxWidth: 720,
              fontFamily: "'Space Grotesk', sans-serif",
              ...gText('linear-gradient(135deg, #ffffff 0%, #a78bfa 50%, #38bdf8 100%)'),
            }}>
              AXIOM doesn't find answers.<br />It exposes the wrong questions.
            </h1>

            <p style={{
              color: '#e2e8f0', fontSize: '1.1rem', lineHeight: 1.8,
              maxWidth: 680, margin: '0 auto',
            }}>
              AXIOM is a multi-agent epistemic interrogation system.
              Enter any field. Watch four AI agents tear apart its
              foundational assumptions — revealing where the next
              breakthrough might be hiding.
            </p>
          </motion.div>
        </Section>

        {/* ══ SECTION 2 — THE PROBLEM ════════════════════════════════════════ */}
        <Section>
          <motion.div {...FI}>
            <Label text="THE PROBLEM" gradient="linear-gradient(90deg, #f472b6, #a78bfa)" />
            <SectionHeading
              text="Every field has blind spots. Most never find them."
              gradient="linear-gradient(135deg, #ffffff, #f472b6, #a78bfa)"
            />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
              {[
                {
                  icon: '🧠', title: 'Invisible Assumptions', titleColor: '#f472b6',
                  desc: 'The beliefs holding a field back exist exactly because no one thinks to question them. They are invisible — until a field collapses.',
                },
                {
                  icon: '⚡', title: 'Consensus Bias', titleColor: '#fb923c',
                  desc: 'When everyone in a field agrees on something, no one questions it. That agreement is exactly where the next paradigm shift hides.',
                },
                {
                  icon: '🌍', title: 'Civilizational Cost', titleColor: '#34d399',
                  desc: 'Doctors assumed handwashing was unnecessary — killed thousands. Scientists assumed bacteria couldn\'t survive stomach acid — delayed ulcer cure by decades.',
                },
              ].map(({ icon, title, titleColor, desc }) => (
                <div key={title} style={CARD}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>{icon}</div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: titleColor, marginBottom: '0.5rem', fontFamily: "'Space Grotesk', sans-serif" }}>{title}</div>
                  <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.7, margin: 0 }}>{desc}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </Section>

        {/* ══ SECTION 3 — THE SOLUTION ═══════════════════════════════════════ */}
        <Section>
          <motion.div {...FI}>
            <Label text="THE SOLUTION" gradient="linear-gradient(90deg, #34d399, #38bdf8)" />
            <SectionHeading
              text="AXIOM exposes what consensus refuses to question."
              gradient="linear-gradient(135deg, #ffffff, #34d399, #38bdf8)"
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              {[
                {
                  step: '01 · EXTRACT', color: '#a78bfa',
                  desc: 'AXIOM identifies the core foundational assumptions hidden within any field or domain — the beliefs so fundamental that experts forget they are assumptions.',
                },
                {
                  step: '02 · INTERROGATE', color: '#38bdf8',
                  desc: 'Eight AI agents from two matrices simultaneously argue, challenge, and probe each assumption from completely opposing perspectives.',
                },
                {
                  step: '03 · SCORE', color: '#34d399',
                  desc: 'Each assumption is scored across three dimensions: Hiddenness, Evidence Weakness, and Paradigm Impact — revealing which assumptions are most dangerous.',
                },
                {
                  step: '04 · SCENARIO', color: '#f472b6',
                  desc: 'AXIOM generates alternative worlds — what reality could look like if these assumptions are proven wrong, ordered by civilizational impact potential.',
                },
              ].map(({ step, color, desc }) => (
                <div key={step} style={CARD}>
                  <div style={{
                    fontSize: '0.85rem', fontWeight: 700, color,
                    marginBottom: '0.75rem', letterSpacing: '0.06em',
                    fontFamily: "'Space Grotesk', sans-serif",
                  }}>{step}</div>
                  <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.7, margin: 0 }}>{desc}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </Section>

        {/* ══ SECTION 4 — TWO MATRICES ═══════════════════════════════════════ */}
        <Section>
          <motion.div {...FI}>
            <Label text="EVALUATION MATRICES" gradient="linear-gradient(90deg, #a78bfa, #f472b6)" />
            <SectionHeading
              text="Two lenses. Eight minds. One truth."
              gradient="linear-gradient(135deg, #ffffff, #a78bfa, #f472b6)"
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              {/* Epistemic Matrix */}
              <div>
                <div style={{
                  fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem',
                  fontFamily: "'Space Grotesk', sans-serif",
                  ...gText('linear-gradient(90deg, #a78bfa, #818cf8)'),
                }}>🏛️ EPISTEMIC MATRIX</div>
                <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.7, marginBottom: '1.25rem' }}>
                  For philosophical, scientific, and academic domains. Four agents interrogate the logical, historical, empirical, and ontological foundations of any field.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  {[
                    { name: '🏛️ Historian', color: '#f472b6', desc: 'Grounds claims in centuries of historical precedent. Finds patterns that expose assumptions already proven wrong.' },
                    { name: '⚔️ Contrarian', color: '#fb923c', desc: 'Exists to disagree. Finds the strongest possible case against any accepted belief — no mercy.' },
                    { name: '🔬 Scientist', color: '#34d399', desc: 'Demands falsifiability. If it cannot be tested or disproven, it has no place in knowledge.' },
                    { name: '🧘 Philosopher', color: '#a78bfa', desc: 'Digs beneath the surface. Questions the ethics, logic, and ontology of every assumption.' },
                  ].map(({ name, color, desc }) => (
                    <div key={name} style={{ ...CARD, border: '1px solid rgba(139,92,246,0.15)', padding: '1.25rem' }}>
                      <div style={{ fontSize: '0.95rem', fontWeight: 700, color, marginBottom: '0.4rem', fontFamily: "'Space Grotesk', sans-serif" }}>{name}</div>
                      <p style={{ color: '#94a3b8', fontSize: '0.85rem', lineHeight: 1.7, margin: 0 }}>{desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Venture Matrix */}
              <div>
                <div style={{
                  fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem',
                  fontFamily: "'Space Grotesk', sans-serif",
                  ...gText('linear-gradient(90deg, #fbbf24, #fb923c)'),
                }}>💰 VENTURE MATRIX</div>
                <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.7, marginBottom: '1.25rem' }}>
                  For startups, business models, and market assumptions. Four agents evaluate capital risk, market reality, human behavior, and growth opportunity.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  {[
                    { name: '💰 The Investor', color: '#fbbf24', desc: 'Evaluates risk and capital reality. What does it cost if this assumption is catastrophically wrong?' },
                    { name: '🗡️ The Critic', color: '#f87171', desc: 'The harshest reviewer in the room. Finds every flaw, gap, and weakness — and the most valuable.' },
                    { name: '🛒 The Customer', color: '#38bdf8', desc: 'Represents real human behavior. Exposes assumptions that ignore how people actually think and act.' },
                    { name: '🚀 Growth Hacker', color: '#34d399', desc: 'Finds the hidden opportunity inside every broken assumption. Where others see failure, finds the next breakthrough.' },
                  ].map(({ name, color, desc }) => (
                    <div key={name} style={{ ...CARD, border: '1px solid rgba(139,92,246,0.15)', padding: '1.25rem' }}>
                      <div style={{ fontSize: '0.95rem', fontWeight: 700, color, marginBottom: '0.4rem', fontFamily: "'Space Grotesk', sans-serif" }}>{name}</div>
                      <p style={{ color: '#94a3b8', fontSize: '0.85rem', lineHeight: 1.7, margin: 0 }}>{desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </Section>

        {/* ══ SECTION 5 — SCORING SYSTEM ════════════════════════════════════ */}
        <Section>
          <motion.div {...FI}>
            <Label text="BLIND SPOT SCORING" gradient="linear-gradient(90deg, #f472b6, #fb923c)" />
            <SectionHeading
              text="Not all assumptions are equal."
              gradient="linear-gradient(135deg, #ffffff, #f472b6, #fb923c)"
            />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
              {[
                {
                  dim: 'Hiddenness', color: '#a78bfa', score: '87',
                  scoreGrad: 'linear-gradient(135deg, #a78bfa, #818cf8)',
                  desc: 'How invisible is this assumption to experts within the field? The more hidden, the more dangerous.',
                },
                {
                  dim: 'Evidence Weakness', color: '#38bdf8', score: '73',
                  scoreGrad: 'linear-gradient(135deg, #38bdf8, #34d399)',
                  desc: 'How weak is the empirical support for this assumption? Weak evidence = high paradigm shift potential.',
                },
                {
                  dim: 'Paradigm Impact', color: '#f472b6', score: '91',
                  scoreGrad: 'linear-gradient(135deg, #f472b6, #fb923c)',
                  desc: 'If this assumption is wrong, how much does it change everything? High impact = civilizational blind spot.',
                },
              ].map(({ dim, color, score, scoreGrad, desc }) => (
                <div key={dim} style={{ ...CARD, textAlign: 'center' }}>
                  <span style={{
                    display: 'block',
                    fontSize: 'clamp(2.5rem, 5vw, 3.5rem)', fontWeight: 800,
                    lineHeight: 1, marginBottom: '0.5rem',
                    fontFamily: "'Space Grotesk', sans-serif",
                    ...gText(scoreGrad),
                  }}>{score}</span>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color, marginBottom: '0.5rem', fontFamily: "'Space Grotesk', sans-serif" }}>{dim}</div>
                  <p style={{ color: '#94a3b8', fontSize: '0.85rem', lineHeight: 1.7, margin: 0 }}>{desc}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </Section>

        {/* ══ SECTION 6 — USE CASES ═════════════════════════════════════════ */}
        <Section>
          <motion.div {...FI}>
            <Label text="WHO IS AXIOM FOR" gradient="linear-gradient(90deg, #34d399, #a78bfa)" />
            <SectionHeading
              text="Any field. Any assumption. Any domain."
              gradient="linear-gradient(135deg, #ffffff, #34d399, #a78bfa)"
            />

            {/* Use case chips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', justifyContent: 'center', marginBottom: '2rem' }}>
              {[
                { label: '🔬 Researchers',   color: '#34d399', border: 'rgba(52,211,153,0.4)' },
                { label: '💼 Investors',     color: '#fbbf24', border: 'rgba(251,191,36,0.4)'  },
                { label: '🏥 Medical Teams', color: '#f87171', border: 'rgba(248,113,113,0.4)' },
                { label: '📚 Academics',     color: '#a78bfa', border: 'rgba(167,139,250,0.4)' },
                { label: '🚀 Founders',      color: '#38bdf8', border: 'rgba(56,189,248,0.4)'  },
                { label: '🏛️ Policy Makers', color: '#f472b6', border: 'rgba(244,114,182,0.4)' },
              ].map(({ label, color, border }) => (
                <div key={label} style={{
                  padding: '10px 20px', borderRadius: '100px',
                  background: 'transparent', border: `1px solid ${border}`,
                  color, fontWeight: 600, fontSize: '0.9rem',
                  fontFamily: 'Inter, sans-serif',
                }}>{label}</div>
              ))}
            </div>

            {/* Example analyses */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
              {[
                {
                  field: 'Cancer Treatment', scoreColor: '#f87171',
                  score: 'Score: 87/100 · Critical Blind Spot',
                  finding: 'The assumption that cancer is a single monolithic disease has delayed personalized treatment by decades.',
                },
                {
                  field: 'AI Research', scoreColor: '#fb923c',
                  score: 'Score: 79/100 · High Risk',
                  finding: 'The assumption that scaling compute always leads to intelligence ignores fundamental questions about understanding and meaning.',
                },
                {
                  field: 'Education System', scoreColor: '#f472b6',
                  score: 'Score: 82/100 · Critical Blind Spot',
                  finding: 'The assumption that standardized testing measures intelligence ignores creativity, emotional intelligence, and real-world problem solving.',
                },
              ].map(({ field, finding, score, scoreColor }) => (
                <div key={field} style={CARD}>
                  <div style={{
                    fontSize: '0.75rem', fontWeight: 700, color: scoreColor,
                    letterSpacing: '0.08em', textTransform: 'uppercase',
                    marginBottom: '0.5rem', fontFamily: "'Space Grotesk', sans-serif",
                  }}>{score}</div>
                  <div style={{
                    fontSize: '1rem', fontWeight: 700, color: '#f1f5f9',
                    marginBottom: '0.5rem', fontFamily: "'Space Grotesk', sans-serif",
                  }}>{field}</div>
                  <p style={{ color: '#94a3b8', fontSize: '0.85rem', lineHeight: 1.7, margin: 0 }}>{finding}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </Section>

        {/* ══ SECTION 7 — TECH STACK ════════════════════════════════════════ */}
        <Section>
          <motion.div {...FI}>
            <Label text="BUILT WITH" gradient="linear-gradient(90deg, #818cf8, #38bdf8)" />
            <SectionHeading
              text="Modern stack. Production ready."
              gradient="linear-gradient(135deg, #ffffff, #818cf8, #38bdf8)"
              size="clamp(1.4rem, 3vw, 2rem)"
            />

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', justifyContent: 'center' }}>
              {[
                { label: '⚛️ React',           color: '#38bdf8', border: 'rgba(56,189,248,0.3)'   },
                { label: '⚡ Vite',             color: '#fbbf24', border: 'rgba(139,92,246,0.3)'   },
                { label: '🚀 FastAPI',           color: '#34d399', border: 'rgba(52,211,153,0.3)'   },
                { label: '🔗 LangChain',         color: '#4ade80', border: 'rgba(74,222,128,0.3)'   },
                { label: '🤖 Groq API',          color: '#06b6d4', border: 'rgba(6,182,212,0.3)'    },
                { label: '🍃 MongoDB Atlas',     color: '#34d399', border: 'rgba(52,211,153,0.3)'   },
                { label: '✨ Framer Motion',     color: '#f472b6', border: 'rgba(244,114,182,0.3)'  },
                { label: '▲ Vercel',             color: '#ffffff', border: 'rgba(255,255,255,0.3)'  },
                { label: '🚂 Railway',            color: '#a78bfa', border: 'rgba(139,92,246,0.3)'   },
              ].map(({ label, color, border }) => (
                <div key={label} style={{
                  padding: '10px 20px', borderRadius: '100px',
                  background: 'transparent', border: `1px solid ${border}`,
                  color, fontWeight: 600, fontSize: '0.9rem',
                  fontFamily: 'Inter, sans-serif',
                }}>{label}</div>
              ))}
            </div>
          </motion.div>
        </Section>

        {/* ══ SECTION 8 — CLOSING CTA ════════════════════════════════════════ */}
        <Section>
          <motion.div {...FI} style={{ textAlign: 'center' }}>
            <h2 style={{
              fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)', fontWeight: 800,
              lineHeight: 1.2, letterSpacing: '-0.02em',
              margin: '0 auto 1rem', maxWidth: 640,
              fontFamily: "'Space Grotesk', sans-serif",
              ...gText('linear-gradient(135deg, #ffffff 0%, #a78bfa 50%, #38bdf8 100%)'),
            }}>
              Ready to question everything?
            </h2>

            <p style={{ color: '#94a3b8', fontSize: '1rem', lineHeight: 1.7, margin: '0 auto 2rem', maxWidth: 520 }}>
              Enter any field and watch AXIOM expose the assumptions your field forgot to question.
            </p>

            <button
              onClick={() => navigate('/')}
              style={{
                display: 'inline-block',
                background: 'linear-gradient(90deg, #7c3aed, #4f46e5)',
                color: '#ffffff', fontWeight: 700,
                padding: '14px 32px', borderRadius: '100px',
                fontSize: '1rem', border: 'none', cursor: 'pointer',
                boxShadow: '0 0 30px rgba(124,58,237,0.4)',
                fontFamily: "'Space Grotesk', sans-serif",
                transition: 'opacity 0.2s ease, transform 0.2s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.opacity = '0.85'; e.currentTarget.style.transform = 'translateY(-2px)' }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1';    e.currentTarget.style.transform = 'translateY(0)' }}
            >
              Run AXIOM →
            </button>

            {/* Footer */}
            <div style={{
              marginTop: '4rem', paddingTop: '2rem',
              borderTop: '1px solid rgba(139,92,246,0.1)',
              color: '#334155', fontSize: '0.75rem',
              fontFamily: "'Space Grotesk', sans-serif",
              letterSpacing: '0.08em',
            }}>
              AXIOM · Epistemic Multi-Agent Pipeline
            </div>
          </motion.div>
        </Section>

      </div>
    </div>
  )
}
