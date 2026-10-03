# findinv — Podział pracy agentów

> Każdy agent startuje w t=0. Backend tylko tam gdzie daje realną wartość na demo.

---

## Strategia: co jest backendem, co jest mockiem

```
REAL BACKEND (FastAPI + SQLite + ChromaDB + OpenRouter)
├── Matchmaking — /api/tag, /api/match, /api/chat
├── Knowledge   — seed ROPS + /api/innovations
└── Middleman   — /api/middleman/*

MOCK W NEXT.JS (hardkodowane dane, zero backendu)
├── Kreator pomysłów  — wygląda dobrze, jury nie testuje flow
├── Tester innowacji  — formularz który nigdzie nie wysyła
├── Forum             — MOCK_FORUM_POSTS z mock_data.py
└── Panel admina      — statyczna strona z wykresami
```

---

## Zasady globalne

- Branch: `agent-{N}/{feature}`, PR do `main`
- Response format FastAPI: `{ "data": ..., "error": null }` lub `{ "data": null, "error": "..." }`
- Streaming SSE: `data: {chunk}\n\n`, koniec: `data: [DONE]\n\n`
- **Nie modyfikujesz** `models.py` `llm.py` `embeddings.py` bez wpisu w COMMS.md
- Mocki importujesz z `find_inv_server/data/mock_data.py`
- Po każdym działającym endpoincie → PR + wpis [DONE] w COMMS.md

---

## Oś czasu

```
t=0        Wszyscy startują — każdy ma robotę bez czekania
t=30min    A1 Push 1 → merge: modele + DB → A3 może seedować
t=90min    A1 Push 2 → merge: LLM + ChromaDB → A2 i A5 podmieniają mocki
t=120min   A3 seed → COMMS.md [DONE] → A2 ma realne dane
t=120min+  Wszyscy w pełnej prędkości
```

---

## 🟥 Agent 1 — Core (FastAPI fundament)

> Wszyscy na Ciebie czekają. Cel: Push 1 w 30 min, Push 2 w 90 min.

**Pracujesz w:** `find_inv_server/`

### Push 1 — 30 minut (odblokuje A3)

```
find_inv_server/
├── app/
│   ├── __init__.py
│   ├── main.py       # FastAPI + CORS + rejestracja routerów
│   ├── config.py     # settings z .env
│   ├── database.py   # SQLite async (aiosqlite + SQLAlchemy)
│   └── models.py     # TYLKO tabele: innovations, challenges, innovation_gap_index
├── requirements.txt  # zaktualizuj o nowe zależności
└── .env.example      # zaktualizuj
```

`models.py` — wszystkie tabele:
```python
# users  ← potrzebne do ról między modułami
id, name, role,          # "admin" | "tester" | "consultant" | "user"
session_token,           # UUID — trzymany w cookie przez frontend
created_at

# testers  ← profil testera powiązany z userem
id, user_id,             # FK users.id
name, email, organization, expertise,
approved,                # bool, admin zatwierdza
created_at

# innovations
id, title, short_desc, full_desc, category, area, target_group,
location, status,        # "active" | "archived" | "unmaintained"
cost_level,              # "low" | "medium" | "high"
implementation_time_months, testers_count, where_implemented,
source_url, embedding_id, tags,  # JSON str
created_at, updated_at

# challenges
id, title, area, description, indicator_value, indicator_unit,
source, data_year, powiat

# innovation_gap_index
id, powiat, challenge_area, innovations_count, gap_score, updated_at

# search_logs  (trendy dla admina)
id, query, tags, results_count, created_at
```

`requirements.txt` — dodaj do istniejących:
```
sqlalchemy[asyncio]
aiosqlite
chromadb
openai>=1.0
```

→ **Merge Push 1. Napisz [DONE] Push 1 w COMMS.md.**

### Push 2 — do 90 minut od startu (odblokuje A2 i A5)

```
find_inv_server/app/
├── llm.py          # OpenRouter async client
├── embeddings.py   # ChromaDB setup
└── utils.py        # run_autotagger(), TAXONOMY_TAGS
```

`llm.py`:
```python
import openai
client = openai.AsyncOpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=settings.OPENROUTER_API_KEY
)

async def chat(messages: list[dict], stream: bool = False, model: str = None):
    # non-streaming → str
    # streaming → AsyncGenerator[str, None]

async def embed(text: str) -> list[float]:
    # przez OpenRouter embed endpoint
```

`embeddings.py`:
```python
import chromadb

def get_collection() -> chromadb.Collection:
    # singleton kolekcja "innovations"

async def embed_and_store(doc_id: str, text: str, metadata: dict): ...

async def similarity_search(query_text: str, n_results: int = 20) -> list[dict]:
    # [{ "id": str, "score": float, "metadata": dict }]
```

`utils.py`:
```python
TAXONOMY_TAGS = [
    "seniorzy", "wykluczenie_cyfrowe", "samotność", "zdrowie_psychiczne",
    "niepełnosprawność", "ubóstwo", "dzieci", "młodzież", "rodzina",
    "bezdomność", "uzależnienia", "migranci", "wolontariat", "edukacja",
    "rynek_pracy", "dostępność", "transport", "gmina_wiejska", "gmina_miejska",
    "NGO", "samorząd", "DPS", "OPS", "CUS", "inkubator"
]

async def run_autotagger(text: str) -> dict:
    # 1 LLM call, JSON mode, tagi tylko z TAXONOMY_TAGS
    # zwraca: { tags, area, target_group, location, type, is_relevant }
```

`.env.example` — dodaj:
```
OPENROUTER_API_KEY=
OPENROUTER_MODEL=anthropic/claude-haiku-4-5-20251001
OPENROUTER_EMBED_MODEL=openai/text-embedding-3-small
DATABASE_URL=sqlite+aiosqlite:///./findinv.db
CHROMA_PATH=./chroma_db
```

**`app/auth.py`** + router `/api/auth/*` — dodaj w Push 2:
```python
# POST /api/auth/session
#   Body: { "name": "Jan", "role": "user" }  ← user sam wybiera rolę, brak weryfikacji
#   INSERT users(name, role, session_token=uuid4())
#   Return: { "data": { "session_token": "uuid", "role": "user" } }
#   Frontend zapisuje token w cookie "session"

# POST /api/auth/set-role
#   Body: { "role": "admin" }  ← hackathon: bez hasła
#   UPDATE users SET role=? WHERE session_token=?
#   Return: { "data": { "role": "admin" } }

# GET /api/auth/me
#   Return: { "data": { "id", "name", "role" } } lub 401

# Middleware — dokłada do każdego requestu:
def get_current_user(request: Request) -> User | None:
    token = request.cookies.get("session") or request.headers.get("X-Session-Token")
    # SELECT users WHERE session_token=token
    # return User lub None

def require_role(*roles):
    # Depends factory — raises 403 jeśli user.role not in roles
```

→ **Merge Push 2. Napisz [DONE] Push 2 w COMMS.md.**

### Nie robisz
- Żadnych endpointów domenowych
- Seedowania danych (A3)

---

## 🟧 Agent 2 — Matchmaking (serce aplikacji)

**Pracujesz w:** `find_inv_server/app/routers/matchmaking.py`

### Od t=0 — mock endpoints (od razu PR)

```python
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from data.mock_data import MOCK_INNOVATIONS, MOCK_TAG_RESPONSE

router = APIRouter(prefix="/api", tags=["matchmaking"])

@router.post("/tag")
async def tag(body: dict):
    return {"data": MOCK_TAG_RESPONSE}

@router.post("/match")
async def match(body: dict):
    return {"data": {"innovations": MOCK_INNOVATIONS[:5], "total_found": 5}}

@router.post("/voice-fix")
async def voice_fix(body: dict):
    return {"data": {"corrected": body.get("transcript", ""), "confidence": 1.0}}

@router.post("/chat")
async def chat(body: dict):
    async def gen():
        yield "data: Oto przykładowa odpowiedź o innowacjach społecznych.\n\n"
        yield "data: [DONE]\n\n"
    return StreamingResponse(gen(), media_type="text/event-stream")
```

**PR z mockami od razu → frontend może integrować.**

### Po [DONE] Push 2 od A1 — podmień na real

`POST /api/tag`:
```python
from app.utils import run_autotagger
from app.database import get_db

result = await run_autotagger(body["text"])
# INSERT search_logs async (nie blokuj odpowiedzi)
return {"data": result}
```

`POST /api/match`:
```python
from app.embeddings import similarity_search

# 1. embed + similarity search
results = await similarity_search(body["text"], n_results=50)
ids = [r["id"] for r in results]
score_map = {r["id"]: r["score"] for r in results}

# 2. SELECT z DB
async with get_db() as db:
    innovations = await db.execute(
        select(Innovation).where(Innovation.embedding_id.in_(ids))
    )

# 3. ranking: cosine_score + 0.1 * tag_overlap
query_tags = set(body.get("tags", []))
for innov in innovations:
    innov_tags = set(json.loads(innov.tags))
    innov.score = score_map[innov.embedding_id] + 0.1 * len(innov_tags & query_tags)

# 4. sort, top 5
return {"data": {"innovations": sorted(innovations, key=lambda x: x.score, reverse=True)[:5]}}
```

`POST /api/chat` (SSE real):
```python
from app.llm import chat as llm_chat

# RAG: pobierz opisy innowacji po ids
# wstrzyknij jako system prompt
# stream llm_chat(messages, stream=True)
```

### Po [DONE] seed od A3 — ChromaDB ma realne dane, /api/match działa z ROPS

### Ustalone decyzje (nie zmieniaj)
- Tagi tylko z `TAXONOMY_TAGS` z `utils.py`
- Ranking: cosine + 0.1 * tag overlap
- 5 kart, "Zobacz więcej" = URL redirect z tagami jako query params
- `is_relevant: false` → backend tylko zwraca flagę, komunikat robi frontend
- `is_unmaintained: true` → szary badge na karcie, renderuje frontend

---

## 🟨 Agent 3 — Knowledge & Seed (dane ROPS)

**Pracujesz w:** `find_inv_server/data/` i `find_inv_server/app/routers/knowledge.py`

### Od t=0 — parsuj pliki ROPS (bez DB)

```python
# find_inv_server/data/parse_rops.py  (lokalny skrypt)
# Wczytaj pliki z data/rops_raw/
# Wyciągnij: title, short_desc, full_desc, category, area,
#            target_group, cost_level, where_implemented, source_url
# Zapisz do data/parsed_innovations.json
```

Rób to lokalnie, bez commita. Gdy Push 1 od A1 jest na mainie:

### Po [DONE] Push 1 — seed do SQLite + ChromaDB

```python
# find_inv_server/data/seed_innovations.py
# python -m data.seed_innovations

import asyncio, json
from app.database import get_db
from app.embeddings import embed_and_store
from app.models import Innovation

async def seed():
    data = json.load(open("data/parsed_innovations.json"))
    async with get_db() as db:
        for item in data:
            innov = Innovation(**item)
            db.add(innov)
            await db.flush()
            text = f"{innov.title} {innov.short_desc} {innov.full_desc}"
            await embed_and_store(str(innov.id), text, {"id": innov.id})
    await db.commit()
    print(f"Seeded {len(data)} innovations")

asyncio.run(seed())
```

**→ Napisz [DONE] seed w COMMS.md. Odblokuje A2.**

### Endpointy (zacznij z mockami, podmień po seedzie)

```python
# find_inv_server/app/routers/knowledge.py
from data.mock_data import MOCK_INNOVATIONS, MOCK_CHALLENGES, MOCK_GAP_INDEX, MOCK_STATS_MALOPOLSKA

GET /api/innovations          # search + filtrowanie (SQLite LIKE)
GET /api/innovations/{id}     # pełna karta
GET /api/challenges           # lista wyzwań
GET /api/challenges/map       # [{ powiat, challenges[], gap_index }]
GET /api/stats/malopolska     # MOCK_STATS_MALOPOLSKA — zostaw mock, dane statyczne
GET /api/gmina-pulse/{powiat} # top 3 wyzwania + 3 pasujące innowacje
GET /api/innovation-gap       # [{ powiat, gap_score, top_area }]
```

---

## 🟩 Agent 4 — Frontend: Kreator + Tester + Forum

**Pracujesz w:** `find_inv/` (Next.js)

> Kreator, Tester, Forum — mock w Next.js.
> Admin panel robi Agent 5 (backend + frontend) — potrzebne ze względu na role.

### Strony mock (hardkodowane dane)

```
/kreator        Formularz fiszki pomysłu
                - 1 textarea "Opisz swój pomysł"
                - przyciski tagów do kliknięcia
                - "AI analizuje..." fake loading (setTimeout 1.5s)
                - wyświetla kartę z rozbitymi polami (hardkodowane)

/testerzy       Strona informacyjna + formularz zgłoszeniowy
                - "Zostań testerem innowacji"
                - formularz: imię, email, organizacja, specjalizacja
                - po submit: toast "Zgłoszenie przyjęte"
                - dane nigdzie nie idą

/forum          Lista wątków z mock_data.ts
                - badge'e: user / tester / admin / konsultant
                - textarea do "dodawania" posta (fake, state lokalny)
```

### /admin — MUSI DZIAŁAĆ (jury tu wejdzie)

Logowanie: przycisk "Zaloguj jako admin" na stronie głównej → ustawia cookie/state → redirect `/admin`

Panel admina musi mieć działające widoki (dane hardkodowane ale klikalne):

```
/admin/innowacje
  - tabela innowacji z filtrami (status, tagi, szukaj)
  - przyciski: Zatwierdź / Archiwizuj / Oznacz jako nieaktywna
  - zmiana statusu działa lokalnie w state (nie woła backendu)

/admin/uzytkownicy
  - lista użytkowników z rolami
  - dropdown zmiany roli (user / tester / konsultant)
  - przycisk "Zatwierdź testera" przy oczekujących

/admin/trendy
  - wykres słupkowy top 10 tagów (recharts, dane z MOCK_STATS)
  - wykres liniowy zgłoszeń per dzień
  - sekcja "Najczęstsze zapytania"

/admin/statystyki
  - liczniki: innowacje, zgłoszenia, aktywni testerzy, posty forum
  - duże cyfry, czytelne, widoczne na demo
```

### Mock data dla Next.js
Utwórz `find_inv/data/mock.ts` z danymi dla tych stron.
Możesz przepisać z `find_inv_server/data/mock_data.py` na TypeScript.

### Auth w Next.js (wspólne dla wszystkich stron)
```typescript
// find_inv/lib/auth.ts
// Pobiera /api/auth/me przy starcie — trzyma usera w context
// Przycisk "Zaloguj się" na navbar → modal z wyborem roli:
//   [Mieszkaniec]  [Tester]  [Konsultant]  [Admin]
// POST /api/auth/session → zapisuje token w cookie → refresh user context
// Rola admina/testera widoczna jako badge w navbar
```

---

## 🟦 Agent 5 — Middleman AI + Admin Panel

**Pracujesz w:** `find_inv_server/app/routers/middleman.py`, `find_inv_server/app/routers/admin.py`, `find_inv/app/admin/`

> Admin wymaga backendu — role są w SQLite, jury zaloguje się i będzie klikać po panelu.

### Od t=0 — mock Middlemana

```python
# find_inv_server/app/routers/middleman.py

@router.post("/api/middleman/start")
async def start(body: dict):
    return {"data": {
        "session_id": "mock-session-123",
        "first_question": "Ile osób zatrudnia Wasza instytucja i jakim budżetem dysponujecie?"
    }}

@router.post("/api/middleman/answer")
async def answer(body: dict):
    async def gen():
        if body.get("answer", ""):
            plan = {
                "type": "plan",
                "content": {
                    "staff_needed": "1 koordynator + wolontariusze",
                    "estimated_cost": "5–10 tys. zł rocznie",
                    "location_suggestions": "Dom Kultury lub biblioteka gminna",
                    "steps": ["Rekrutacja koordynatora", "Szkolenie wolontariuszy",
                              "Kampania informacyjna", "Start pilotażu"],
                    "timeline": "3 miesiące",
                    "funding_hints": "PFRON, FIO, środki gminne"
                }
            }
            yield f"data: {json.dumps(plan)}\n\n"
        yield "data: [DONE]\n\n"
    return StreamingResponse(gen(), media_type="text/event-stream")
```

### Admin backend (zacznij od t=0, mock auth do czasu Push 2)

**`find_inv_server/app/routers/admin.py`**

Auth tymczasowy przed Push 2: sprawdzaj `X-Dev-Admin: true` w headerze.
Po Push 2: zamień na `Depends(require_role("admin"))`.

```python
# Wszystkie endpointy wymagają roli "admin"

GET  /api/admin/innovations?status=&tags=&search=
POST /api/admin/innovations/{id}/approve          → status="active"
POST /api/admin/innovations/{id}/archive          → status="archived"
POST /api/admin/innovations/{id}/flag-unmaintained → status="unmaintained"

GET  /api/admin/users
POST /api/admin/users/{id}/set-role   body: { "role": "tester"|"consultant"|"user" }

GET  /api/admin/testers?approved=false
POST /api/admin/testers/{id}/approve
  → UPDATE testers SET approved=true
  → UPDATE users SET role="tester" WHERE id=tester.user_id

GET  /api/admin/trends
  → {
      "top_tags":    [{ "tag": "seniorzy", "count": 45 }],   ← z search_logs
      "top_queries": [{ "query": "...", "count": 12 }],
      "by_day":      [{ "date": "2026-10-03", "count": 7 }]
    }

GET  /api/admin/stats
  → { "innovations": 87, "users": 34, "testers": 12,
      "pending_testers": 3, "searches": 156 }
```

**Admin frontend `find_inv/app/admin/`** — woła te endpointy z headerem sesji:
```
/admin                → redirect do /admin/statystyki
/admin/innowacje      → tabela + przyciski Zatwierdź/Archiwizuj/Nieaktywna
/admin/uzytkownicy    → lista + zmiana roli + zatwierdzanie testerów
/admin/trendy         → wykresy (recharts) z danych z /api/admin/trends
/admin/statystyki     → liczniki z /api/admin/stats
```

### Po [DONE] Push 2 od A1 — podmień na real LLM

```python
@router.post("/api/middleman/start")
async def start(body: dict):
    innov = # SELECT innovation by id
    session_id = str(uuid4())
    system = """Jesteś ekspertem od wdrażania innowacji społecznych w Polsce.
                Znasz realia małych gmin, OPS i NGO. Zadajesz MAX 3 krótkie pytania
                zanim dajesz konkretny plan. Bądź praktyczny."""
    first_q = await llm.chat([
        {"role": "system", "content": system},
        {"role": "user", "content": f"Innowacja: {innov.title}\n{innov.full_desc}\n\nProblem: {body['problem_desc']}"}
    ])
    # INSERT middleman_sessions (jeśli chcesz trzymać historię)
    return {"data": {"session_id": session_id, "first_question": first_q}}

@router.post("/api/middleman/answer")  # SSE
async def answer(body: dict):
    # pobierz historię, dodaj odpowiedź
    # LLM: pytanie lub finalny plan JSON
    # stream response
```

### Plan format (finalny output Middlemana)
```json
{
  "type": "plan",
  "content": {
    "staff_needed": "...",
    "estimated_cost": "5–10 tys. zł rocznie",
    "location_suggestions": "...",
    "steps": ["krok 1", "krok 2", "..."],
    "timeline": "3 miesiące",
    "funding_hints": "PFRON, FIO, EFS+"
  }
}
```

---

## Mapa zależności (uproszczona)

```
t=0    A1 pisze core     A2 mock endpoints    A3 parsuje ROPS    A4 Next.js pages    A5 mock middleman
       ↓
t=30   A1 Push 1 ──────────────────────────► A3 uruchamia seed
       ↓
t=90   A1 Push 2 ──► A2 real LLM ──────────────────────────────────────────────► A5 real Middleman
       ↓
t=120  A3 seed [DONE] ──► A2 real ChromaDB
       ↓
t=120+ wszyscy w pełnej prędkości
```
