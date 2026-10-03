#!/bin/bash
set -e

echo "=== findinv setup ==="

# ── Backend ──────────────────────────────────────────────
echo ""
echo "[1/4] Backend — tworzę venv..."
cd find_inv_server
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt -q

if [ ! -f .env ]; then
    cp .env.example .env
    echo ""
    echo "  ⚠  Uzupełnij find_inv_server/.env:"
    echo "     OPENROUTER_API_KEY=..."
fi

deactivate
cd ..

# ── Frontend ─────────────────────────────────────────────
echo ""
echo "[2/4] Frontend — instaluję paczki..."
cd find_inv
npm install --silent

if [ ! -f .env.local ]; then
    if [ -f .env.local.example ]; then
        cp .env.local.example .env.local
    else
        echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local
    fi
fi
cd ..

# ── Git ───────────────────────────────────────────────────
echo ""
echo "[3/4] Git — sprawdzam branch..."
AGENT=${1:-""}
if [ -n "$AGENT" ]; then
    git checkout -b "agent-$AGENT/start" 2>/dev/null || git checkout "agent-$AGENT/start"
    echo "  Branch: agent-$AGENT/start"
fi

# ── Gotowe ───────────────────────────────────────────────
echo ""
echo "[4/4] Gotowe! Uruchom w dwóch osobnych terminalach:"
echo ""
echo "  BACKEND:"
echo "    cd find_inv_server"
echo "    source .venv/bin/activate"
echo "    fastapi dev app/main.py"
echo "    → http://localhost:8000/docs"
echo ""
echo "  FRONTEND:"
echo "    cd find_inv"
echo "    npm run dev"
echo "    → http://localhost:3000"
echo ""
echo "Przeczytaj CONTEXT.md i AGENTS.md zanim zaczniesz kodować."
echo "Swój prompt startowy znajdziesz w PROMPTS.md."
