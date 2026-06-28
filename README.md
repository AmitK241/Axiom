# ⬡ AXIOM

> **"Question what cannot be questioned."**

Built for **Moonshot Hackathon 2026** — AI that maps the assumptions beneath humanity's greatest fields, surfacing the invisible beliefs blocking the next breakthrough.

---

## What It Does

Input any scientific field, policy, or idea. Four AI agents debate its hidden assumptions:

| Agent | Role |
|---|---|
| 🏛️ **Historian** | Finds historical cases where similar assumptions failed |
| ⚔️ **Contrarian** | Attacks the weakest point of each assumption |
| 🔬 **Scientist** | Evaluates the actual evidence base |
| 🧘 **Philosopher** | Traces assumptions to their deepest premises |

**Output:** Assumption Map (D3 graph) · Agent Debates · Alternative Worlds · Blind Spot Scores

---

## Quick Start

### 1. Clone & Setup
```bash
git clone https://github.com/YOUR_USERNAME/cognitive-blind-spot-mapper
cd cognitive-blind-spot-mapper
```

### 2. Backend Setup
```bash
cd backend
cp .env.example .env
# Edit .env with your keys
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### 4. Open
```
http://localhost:5173
```

---

## Environment Variables

Edit `backend/.env`:

```env
GROQ_API_KEY=your_groq_api_key        # Get from console.groq.com (free)
MONGODB_URI=your_mongodb_atlas_uri    # Get from mongodb.com/atlas (free tier)
```

---

## Tech Stack

**Frontend:** React 18 · Vite · TailwindCSS · Framer Motion · D3.js · Recharts

**Backend:** FastAPI · LangChain · Groq (Llama 3.3 70B) · ChromaDB · Motor (async MongoDB)

**Database:** MongoDB Atlas

**Deploy:** Vercel (frontend) · Railway (backend)

---

## Project Structure

```
cognitive-blind-spot-mapper/
├── backend/
│   ├── agents/         # 4 AI agents
│   ├── core/           # Pipeline (extract → debate → worlds → score)
│   ├── memory/         # MongoDB connection
│   ├── api/            # FastAPI routes + SSE streaming
│   └── main.py
├── frontend/
│   └── src/
│       ├── components/ # Graph, Debate, Worlds, Score, etc.
│       ├── pages/      # Results, History
│       └── App.jsx     # Landing page
└── start.sh            # One-command startup
```

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/analyze/stream` | SSE streaming analysis |
| POST | `/api/analyze` | Non-streaming analysis |
| GET | `/api/history` | Past analyses from MongoDB |
| GET | `/api/examples` | Pre-built example fields |

---

*AXIOM · Moonshot Hackathon 2026 · Built by Amit Kumar · MNNIT Allahabad*
