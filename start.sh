#!/bin/bash
# AXIOM — Question what cannot be questioned.

echo "⬡  Starting AXIOM..."
echo ""

# Check if .env exists
if [ ! -f backend/.env ]; then
  echo "⚠️  backend/.env not found. Creating from template..."
  cp backend/.env.example backend/.env
  echo "📝 Edit backend/.env with your API keys before running!"
  exit 1
fi

# Install backend deps if needed
if [ ! -d backend/venv ]; then
  echo "📦 Setting up Python venv..."
  cd backend
  python3 -m venv venv
  source venv/bin/activate
  pip install -r requirements.txt
  cd ..
fi

# Install frontend deps if needed
if [ ! -d frontend/node_modules ]; then
  echo "📦 Installing frontend deps..."
  cd frontend && npm install && cd ..
fi

echo "🚀 Starting AXIOM — backend :8000 · frontend :5173"
echo ""

# Start both
cd backend && source venv/bin/activate && uvicorn main:app --reload --port 8000 &
BACKEND_PID=$!

cd frontend && npm run dev &
FRONTEND_PID=$!

echo "✅ Backend: http://localhost:8000"
echo "✅ Frontend: http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop both servers"

trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait
