<div align="center">

<img src="logo.svg" alt="AXIOM logo" width="72" />
<br/>
<img src="axiom-wordmark.png" alt="AXIOM" width="380" />

<br/><br/>

### 🧠 The Cognitive Stress-Test & Blind Spot Engine

**AXIOM doesn't just analyze ideas — it tries to break them, so the market doesn't have to.**

*A multi-agent epistemic interrogation system that uncovers the hidden assumptions, biases, and structural blind spots inside any startup thesis or philosophical claim — before a VC, a customer, or reality finds them for you.*

<br/>

[![Live Demo](https://img.shields.io/badge/🚀_LIVE_DEMO-axiom--pied--zeta.vercel.app-8052FF?style=for-the-badge&labelColor=000000)](https://axiom-pied-zeta.vercel.app)
[![GitHub stars](https://img.shields.io/github/stars/AmitK241/Axiom?style=for-the-badge&color=8052FF&labelColor=000000)](https://github.com/AmitK241/Axiom/stargazers)
[![License](https://img.shields.io/badge/LICENSE-MIT-38B2AC?style=for-the-badge&labelColor=000000)](LICENSE)

<br/>

[![React](https://img.shields.io/badge/React-61DAFB?style=flat-square&logo=react&logoColor=black)](#)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white)](#)
[![Python](https://img.shields.io/badge/Python-3776AB?style=flat-square&logo=python&logoColor=white)](#)
[![MongoDB](https://img.shields.io/badge/MongoDB_Atlas-47A248?style=flat-square&logo=mongodb&logoColor=white)](#)
[![Groq](https://img.shields.io/badge/Groq_LPU-F55036?style=flat-square&logo=groq&logoColor=white)](#)
[![LangChain](https://img.shields.io/badge/LangChain-1C3C3C?style=flat-square&logo=langchain&logoColor=white)](#)
[![D3.js](https://img.shields.io/badge/D3.js-F9A03C?style=flat-square&logo=d3.js&logoColor=white)](#)
[![Vercel](https://img.shields.io/badge/Vercel-000000?style=flat-square&logo=vercel&logoColor=white)](#)

<br/>

<img src="frontend/public/demo-preview.png" alt="AXIOM results dashboard preview" width="820" style="border-radius: 12px; box-shadow: 0 20px 60px rgba(124,58,237,0.25);" />

</div>

<br/>

## 📋 Table of Contents

- [Why AXIOM Exists](#-why-axiom-exists)
- [What It Actually Does](#-what-it-actually-does)
- [System Architecture](#-system-architecture)
- [The Dual Matrix Engine](#️-the-dual-matrix-engine)
- [Engineering Deep-Dives](#-engineering-deep-dives)
- [Live Demo](#-live-demo)
- [Tech Stack](#️-tech-stack)
- [Quick Start](#-quick-start)
- [Roadmap](#️-roadmap)
- [License](#-license)

<br/>

---

## 🎯 Why AXIOM Exists

Every founder, researcher, and decision-maker operates on assumptions they can't see — because if they could see them, they wouldn't hold them. These invisible beliefs are exactly what surface too late: after the funding round, after the product launch, after the paper is published.

The market eventually finds these blind spots.

**AXIOM finds them first.**

<br/>

## 🚗 What It Actually Does

Every founder thinks their idea is a supercar — sleek, fast, ready for the road.

**AXIOM is the wall it drives into first.**

Feed AXIOM a belief, a startup thesis, or a philosophical claim. Four specialized AI agents debate it from every angle — attacking its weakest joints, stress-testing its assumptions, and mapping exactly where it would crumple under real-world pressure.

> **Output:** a Resiliency Score (0–100) — how much of your idea survives the crash, and precisely which assumptions caused the damage.

<br/>

### The 4-Layer Epistemic Pipeline

<table>
<tr>
<td width="90" align="center"><b>01</b><br/>Extract</td>
<td>AXIOM decomposes your input into its hidden, unstated assumptions</td>
</tr>
<tr>
<td width="90" align="center"><b>02</b><br/>Debate</td>
<td>Four AI agents (matrix-specific) attack, defend, and cross-examine each assumption in real time via streamed SSE</td>
</tr>
<tr>
<td width="90" align="center"><b>03</b><br/>Alt-Worlds</td>
<td>AXIOM generates the most probable scenarios in which your core assumptions turn out to be wrong</td>
</tr>
<tr>
<td width="90" align="center"><b>04</b><br/>Score</td>
<td>A weighted Resiliency Score is calculated across hiddenness, evidence weakness, and paradigm impact</td>
</tr>
</table>

<br/>

## 🏗️ System Architecture

```
┌──────────────┐      SSE Stream       ┌───────────────────┐
│   React SPA   │ ◄──────────────────► │   FastAPI Backend   │
│ (Vercel Edge) │   /api/analyze/stream │   (Railway/Render)  │
└──────────────┘                        └──────────┬─────────┘
                                                     │
                        ┌────────────────────────────┼────────────────────────────┐
                        │                             │                             │
                 ┌──────▼──────┐             ┌────────▼────────┐          ┌────────▼────────┐
                 │  4× Agents  │             │  Alt-Worlds Gen  │          │   MongoDB Atlas  │
                 │  (Groq LPU) │             │   (Groq LPU)     │          │  + ChromaDB      │
                 └─────────────┘             └──────────────────┘          └──────────────────┘
```

Built with **production-grade resilience** in mind, not just a demo-day prototype:

- ⚙️ **Concurrency-safe** — `asyncio.Semaphore`-gated LLM calls handle multiple simultaneous users without triggering upstream rate limits
- 🔁 **Self-healing streams** — a sliding watchdog detects stalled SSE connections and transparently recovers already-persisted results from MongoDB, so a network hiccup never means a lost analysis
- 📉 **Token-optimized** — capped `max_tokens` and batched generation calls keep inference costs and rate-limit pressure low **without shrinking output quality**
- 📈 **Load-tested** — verified stable under 4–5 concurrent full-pipeline analyses on free-tier infrastructure

<br/>

## ⚙️ The Dual Matrix Engine

AXIOM routes every analysis through one of **two specialized 4-agent matrices**, each tuned for a different kind of claim.

<table>
<tr>
<th align="center">🏦 Matrix 1 — Startup & Venture Capital</th>
<th align="center">🏛️ Matrix 2 — Philosophical & Epistemic</th>
</tr>
<tr valign="top">
<td>

| Agent | Role |
|---|---|
| 💰 **Investor** | Product-market fit, unit economics, venture-grade returns |
| ⚔️ **Critic** | Attacks weak operational assumptions & scalability gaps |
| 🛒 **Customer** | Real-world adoption friction, willingness to pay |
| 🚀 **Growth Hacker** | Viral mechanics, acquisition friction, scale vectors |

</td>
<td>

| Agent | Role |
|---|---|
| 🔬 **Scientist** | Empirical logic, underlying evidence, structural proof |
| 🧘 **Philosopher** | Ethical layers, existential value, hidden bias |
| 🏛️ **Historian** | Historical precedent & institutional failure patterns |
| ⚔️ **Contrarian** | Devil's advocate — radical anti-theses, fringe scenarios |

</td>
</tr>
</table>

<br/>

## 🔍 Engineering Deep-Dives

A few things under the hood that go beyond a typical hackathon MVP:

| Area | What Was Built |
|---|---|
| **🌌 Particle Engine** | Custom canvas-based ambient particle field with spring-back cursor interaction — no WebGL dependency, stable across low-end devices |
| **🕸️ Assumption Graph** | Every detected assumption renders as a D3 force-simulation node, sized and color-coded by blind spot score, with hover-to-reveal detail |
| **⚡ Groq LPU Inference** | Multi-agent debate runs on `llama-3.1-8b-instant` via Groq's custom LPU hardware for near-instant response vs. typical multi-second GPU latency |
| **🛡️ Watchdog + DB Rescue** | Sliding-window timer detects a silent SSE pipe (common on serverless cold starts) and recovers the completed result server-side, instead of leaving the user on an infinite spinner |
| **🚦 Rate-Limit Resilience** | Exponential backoff + concurrency semaphore around every LLM call, tuned to survive Groq free-tier limits under real concurrent load |

<br/>

## 🌐 Live Demo

<div align="center">

**👉 [axiom-pied-zeta.vercel.app](https://axiom-pied-zeta.vercel.app)**

*Try a claim like "AI Research", "Cancer Treatment", or your own startup pitch — pick a matrix, and watch four agents debate it in real time.*

</div>

<br/>

## 🛠️ Tech Stack

<table>
<tr>
<td width="140"><b>Frontend</b></td>
<td>React (Vite) · TailwindCSS · D3.js · Canvas API</td>
</tr>
<tr>
<td><b>Backend</b></td>
<td>FastAPI (Python) · LangChain · asyncio (concurrency control)</td>
</tr>
<tr>
<td><b>AI Inference</b></td>
<td>Groq LPU — <code>llama-3.1-8b-instant</code></td>
</tr>
<tr>
<td><b>Database</b></td>
<td>MongoDB Atlas · ChromaDB (vector store)</td>
</tr>
<tr>
<td><b>Infrastructure</b></td>
<td>Vercel (frontend) · Railway / Render (backend)</td>
</tr>
</table>

<br/>

## 🚀 Quick Start

```bash
# Clone the repo
git clone https://github.com/AmitK241/Axiom.git
cd Axiom

# Frontend
cd frontend
npm install
npm run dev

# Backend (separate terminal)
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

### Environment Variables

Create a `.env` file in `/backend`:

```env
GROQ_API_KEY=your_groq_api_key_here
MONGODB_URI=your_mongodb_atlas_connection_string
MONGODB_DB=axiom
CHROMA_PERSIST_DIR=./chroma_data
FRONTEND_URL=http://localhost:5173
```

<br/>

## 🗺️ Roadmap

- [ ] **Persona Injector** — custom agent personas beyond the two built-in matrices
- [ ] **Team Workspace** — collaborative analysis for co-founders and research teams
- [ ] **Historical Audit Trail** — saved analyses searchable across an organization
- [ ] **Expanded Matrices** — legal, medical, and policy-specific agent panels

<br/>

## 📄 License

Distributed under the MIT License. See [`LICENSE`](LICENSE) for details.

<br/>

<div align="center">

**Built for AXIOM**

*Before the market crashes your idea, let AXIOM do it.*

<br/>

[![Live Demo](https://img.shields.io/badge/Try_it_now-8052FF?style=for-the-badge&logo=vercel&logoColor=white)](https://axiom-pied-zeta.vercel.app)

</div>
