from dotenv import load_dotenv
import os
import sys

# ── Force UTF-8 I/O so emoji in print() work on Windows cp1252 consoles ──
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

# ── Load .env FIRST — before any other imports that need env vars ──
load_dotenv()

# -- Validate critical environment variables at startup ---------
groq_key = os.getenv("GROQ_API_KEY")
if not groq_key:
    print("=" * 60)
    print("CRITICAL ERROR: GROQ_API_KEY is missing!")
    print("Make sure backend/.env exists and contains:")
    print("  GROQ_API_KEY=gsk_...")
    print("=" * 60)
    sys.exit(1)

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routes import router
from memory.database import connect_db, disconnect_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup & shutdown events."""
    print("AXIOM starting up...")
    print(f"Groq key loaded: {groq_key[:12]}...{groq_key[-4:]}")
    await connect_db()
    yield
    print("AXIOM shutting down...")
    await disconnect_db()


app = FastAPI(
    title="AXIOM API",
    description="Question what cannot be questioned — AI that maps assumptions beneath humanity's greatest fields",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        os.getenv("FRONTEND_URL", "http://localhost:5173"),
        "http://localhost:3000",
        "https://*.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")


@app.get("/")
async def root():
    return {
        "message": "AXIOM API — Question what cannot be questioned.",
        "status": "running",
        "docs": "http://localhost:8000/docs",
    }


@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "groq_api_key_loaded": bool(os.getenv("GROQ_API_KEY")),
        "mongodb_uri_set": bool(os.getenv("MONGODB_URI")),
    }
