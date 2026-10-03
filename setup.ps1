# findinv setup — Windows PowerShell
param([string]$Agent = "")

$ErrorActionPreference = "Stop"
Write-Host "`n=== findinv setup ===" -ForegroundColor Cyan

# ── Backend ──────────────────────────────────────────────
Write-Host "`n[1/4] Backend — tworzę venv..." -ForegroundColor Yellow
Set-Location find_inv_server
py -3.12 -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt -q
deactivate

if (-not (Test-Path ".env")) {
    Copy-Item .env.example .env
    Write-Host "`n  Uzupelnij find_inv_server/.env:" -ForegroundColor Red
    Write-Host "     OPENROUTER_API_KEY=..." -ForegroundColor Red
}
Set-Location ..

# ── Frontend ─────────────────────────────────────────────
Write-Host "`n[2/4] Frontend — instaluję paczki..." -ForegroundColor Yellow
Set-Location find_inv
npm install --silent

if (-not (Test-Path ".env.local")) {
    if (Test-Path ".env.local.example") {
        Copy-Item .env.local.example .env.local
    } else {
        "NEXT_PUBLIC_API_URL=http://localhost:8000" | Out-File .env.local
    }
}
Set-Location ..

# ── Git ───────────────────────────────────────────────────
Write-Host "`n[3/4] Git — sprawdzam branch..." -ForegroundColor Yellow
if ($Agent -ne "") {
    $branch = "agent-$Agent/start"
    git checkout -b $branch 2>$null
    if ($LASTEXITCODE -ne 0) { git checkout $branch }
    Write-Host "  Branch: $branch" -ForegroundColor Green
}

# ── Gotowe ───────────────────────────────────────────────
Write-Host "`n[4/4] Gotowe!" -ForegroundColor Green
Write-Host @"

Uruchom w dwoch osobnych terminalach:

  BACKEND:
    cd find_inv_server
    .\.venv\Scripts\Activate.ps1
    fastapi dev app/main.py
    -> http://localhost:8000/docs

  FRONTEND:
    cd find_inv
    npm run dev
    -> http://localhost:3000

Przeczytaj CONTEXT.md i AGENTS.md zanim zaczniesz kodowac.
Swoj prompt startowy znajdziesz w PROMPTS.md.
"@
