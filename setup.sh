#!/bin/bash
set -e

echo "=== findinv setup ==="

# ── Backend ──────────────────────────────────────────────
echo ""
echo "[1/5] Backend — tworzę venv..."
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

echo ""
echo "[1b/5] Seeduję bazę danych (forum + 114 innowacji ROPS)..."
# seed_demo najpierw: wgrywa forum (i innowacje demo, gdy baza pusta); seed_innovations podmienia innowacje na ROPS
python -m data.seed_demo || echo "  ⚠  seed_demo pominięty"
if python -m data.seed_innovations; then
    echo "  ✓ Baza zaseedowana danymi ROPS"
else
    echo "  ⚠  Seed ROPS nieudany — zostają innowacje demo (uruchom ręcznie: python -m data.seed_innovations)"
fi

deactivate
cd ..

# ── Frontend ─────────────────────────────────────────────
echo ""
echo "[2/5] Frontend — instaluję paczki..."
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
echo "[3/5] Git — sprawdzam branch..."
AGENT=${1:-""}
if [ -n "$AGENT" ]; then
    git checkout -b "agent-$AGENT/start" 2>/dev/null || git checkout "agent-$AGENT/start"
    echo "  Branch: agent-$AGENT/start"
fi

# ── Gotowe ───────────────────────────────────────────────
echo ""
echo "[4/5] Gotowe! Uruchom w dwóch osobnych terminalach:"
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
