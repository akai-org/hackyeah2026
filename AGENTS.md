# findinv — Podział pracy agentów

> Każdy agent startuje w t=0. Zero blokad — wszyscy używają mocków, podmieniają na real gdy gotowe.

---

## Wzorzec mock → real (każdy agent stosuje)

Każda zależność zewnętrzna zaczyna jako mock z `data/mock_data.py`.
Podmiana na real = zmiana 2-3 linii, interfejs zostaje ten sam.

```python
# ── MOCK (działa od t=0) ──────────────────────────────────
from data.mock_data import MOCK_INNOVATIONS
return {"data": {"innovations": MOCK_INNOVATIONS[:limit]}}

# ── REAL (podmień gdy gotowe) ─────────────────────────────
from app.embeddings import similarity_search
from app.database import get_db
results = await similarity_search(text, n_results=50)
# ... ranking, SELECT z DB
```

**Co podmienia kto i kiedy:**

| Mock | Podmienia | Kiedy |
|---|---|---|
| `MOCK_INNOVATIONS` w `/api/match` | A2 | po A3 seed ([DONE] w COMMS.md) |
| `MOCK_TAG_RESPONSE` w `/api/tag` | A2 | po A1 Push 2 |
| hardkodowany chat stream | A2 | po A1 Push 2 |
| `MOCK_INNOVATIONS` w `/api/innovations` | A3 | po własnym seedzie |
| `MOCK_CHALLENGES` w `/api/challenges` | A3 | po `seed_challenges.py` |
| `MOCK_GAP_INDEX` w `/api/innovation-gap` | A3 | po seedzie |
| `MOCK_STATS_MALOPOLSKA` w `/api/stats/...` | A3 | opcjonalnie (dane statyczne, można zostawić) |
| in-memory lista postów | A4 | po A1 Push 1 (SQLite) |
| hardkodowany AI assist | A4 | po A1 Push 2 |
| hardkodowany plan Middlemana | A5 | po A1 Push 2 |
| `X-Dev-Admin` header check | A5 | po A1 Push 2 (require_role) |

---

## Zasady globalne

- Branch: `agent-{N}/{feature}`, PR do `main`
- Response format: `{ "data": ..., "error": null }` lub `{ "data": null, "error": "..." }`
- Streaming SSE: `data: {chunk}\n\n`, koniec: `data: [DONE]\n\n`
- **Nie modyfikujesz** `database.py` `models.py` `llm.py` `embeddings.py` bez wpisu w COMMS.md i PR z opisem
- Auth w endpointach wymagających roli: `from app.auth import get_current_user` + `Depends(get_current_user)`
- Po każdym działającym endpoincie → PR + wpis [DONE] w COMMS.md

---

## Oś czasu — kiedy co się odpala

```
t=0        Wszyscy startują równocześnie (patrz "Co robisz od t=0" w swojej sekcji)
t=30min    A1 Push 1 → merge: database.py + models.py + main.py
           Odblokowuje: A3 (seed), A4 (forum/fiszki bez LLM), A5 (admin CRUD bez LLM)
t=90min    A1 Push 2 → merge: llm.py + embeddings.py + auth.py + utils.py
           Odblokowuje: A2 (zastępuje mocki realnym LLM), A5 (Middleman)
t=120min   A3 seed → merge: dane w SQLite + ChromaDB
           Odblokowuje: A2 (zastępuje mock fixtures realnym similarity_search)
t=120min+  Wszyscy w pełnej prędkości, brak blokad
```

---

## 🟥 Agent 1 — Core

### Co robisz od t=0

Twoje zadanie to dwa szybkie pushe, nie jeden duży. Pracujesz bez przerwy.

### Push 1 — cel: merge w 30 minut

Tylko to co reszta potrzebuje żeby zacząć:

**`requirements.txt`**
```
fastapi>=0.115
uvicorn[standard]
sqlalchemy[asyncio]
aiosqlite
chromadb
openai>=1.0
python-dotenv
httpx
pydantic>=2
python-multipart
```

**`app/database.py`**
```python
# SQLAlchemy async engine + SessionLocal + Base + get_db() dependency
# SQLite: DATABASE_URL = "sqlite+aiosqlite:///./findinv.db"
```

**`app/models.py`** — pełny schema, wszystkie tabele od razu:
```
innovations, challenges, innovation_gap_index, users, testers,
submissions, ideas, test_sessions, forum_posts, search_logs,
cms_content, grant_templates, middleman_sessions
```
Pełna lista kolumn: patrz `hubmi-backend-plan.md`

**`app/main.py`** — szkielet z pustymi routerami:
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
# import każdego routera z app/routers/
# app.include_router(matchmaking.router, prefix="/api")
# itd.
```

**`app/config.py`** — settings z python-dotenv

**`.env.example`**
```
OPENROUTER_API_KEY=
OPENROUTER_MODEL=anthropic/claude-haiku-4-5-20251001
OPENROUTER_EMBED_MODEL=openai/text-embedding-3-small
DATABASE_URL=sqlite+aiosqlite:///./findinv.db
CHROMA_PATH=./chroma_db
CORS_ORIGINS=http://localhost:3000
```

→ **Merge Push 1. Napisz [DONE] Push 1 w COMMS.md.**

### Push 2 — cel: merge w 90 minut od startu

**`app/llm.py`**
```python
import openai

client = openai.AsyncOpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=settings.OPENROUTER_API_KEY
)

async def chat(messages: list[dict], stream: bool = False, model: str = None) -> str:
    # non-streaming → str
    # streaming → AsyncGenerator[str, None]

async def embed(text: str) -> list[float]:
    # przez OpenRouter embed model
```

**`app/embeddings.py`**
```python
import chromadb

def get_collection() -> chromadb.Collection:
    # singleton kolekcja "innovations"

async def embed_and_store(doc_id: str, text: str, metadata: dict): ...
async def similarity_search(query_text: str, n_results: int = 20) -> list[dict]:
    # zwraca [{ "id": str, "score": float, "metadata": dict }]
```

**`app/auth.py`** + router `/api/auth/*`:
```python
# POST /api/auth/session  → INSERT users(role="user"), zwraca session_token (UUID)
# POST /api/auth/set-role → UPDATE users SET role=? (bez weryfikacji, hackathon)
# GET  /api/auth/me       → zwraca current user

def get_current_user(request: Request) -> User | None:
    # czyta header X-Session-Token lub cookie "session"
    # dokłada request.state.user

def require_role(*roles):
    # Depends factory, raises 403 jeśli rola nie pasuje
```

**`app/utils.py`**
```python
TAXONOMY_TAGS = [
    "seniorzy", "wykluczenie_cyfrowe", "samotność", "zdrowie_psychiczne",
    "niepełnosprawność", "ubóstwo", "dzieci", "młodzież", "rodzina",
    "bezdomność", "uzależnienia", "migranci", "wolontariat", "edukacja",
    "rynek_pracy", "dostępność", "transport", "gmina_wiejska", "gmina_miejska",
    "NGO", "samorząd", "DPS", "OPS", "CUS", "inkubator"
]

async def run_autotagger(text: str) -> dict:
    # 1 LLM call, JSON mode
    # zwraca: { tags, area, target_group, location, type, is_relevant, is_unmaintained_warning }
    # tagi TYLKO z TAXONOMY_TAGS
```

**`data/seed_innovations.py`** — szkielet + instrukcja dla A3:
```python
# Agent 3: uzupełnij parse_rops_file() i uruchom: python -m data.seed_innovations
# Wymagane: Push 1 już na main (models.py musi istnieć)
async def seed():
    # 1. parsuj pliki z data/rops_raw/
    # 2. INSERT innovations
    # 3. embed_and_store dla każdej innowacji
```

→ **Merge Push 2. Napisz [DONE] Push 2 w COMMS.md.**

### Nie robisz
- Żadnych endpointów domenowych
- Seedowania danych (A3)

---

## 🟧 Agent 2 — Matchmaking

### Co robisz od t=0

Nie czekasz na A1. Piszesz pełną strukturę pliku z mock responses. Gdy A1 merge → wpisujesz realną logikę.

**Utwórz `app/routers/matchmaking.py` z zaślepkami:**
```python
from fastapi import APIRouter
router = APIRouter(tags=["matchmaking"])

MOCK_INNOVATIONS = [
    { "id": 1, "title": "Cyfrowy Senior", "short_desc": "Kursy obsługi smartfona dla seniorów",
      "tags": ["seniorzy", "wykluczenie_cyfrowe"], "match_score": 0.92,
      "cost_level": "low", "testers_count": 8, "is_unmaintained": False },
    { "id": 2, "title": "Sąsiedzka Pomoc", "short_desc": "Wolontariat dla samotnych osób 65+",
      "tags": ["seniorzy", "samotność"], "match_score": 0.87,
      "cost_level": "low", "testers_count": 12, "is_unmaintained": False },
    # dodaj 3 więcej
]

@router.post("/tag")
async def tag(body: dict):
    # MOCK — zastąp po Push 2
    return { "data": { "tags": ["seniorzy", "wykluczenie_cyfrowe"],
             "area": "wykluczenie społeczne", "target_group": "seniorzy 65+",
             "location": None, "type": "problem",
             "is_relevant": True, "is_unmaintained_warning": False } }

@router.post("/match")
async def match(body: dict):
    # MOCK — zastąp po Push 2 + seed A3
    return { "data": { "innovations": MOCK_INNOVATIONS[:5], "total_found": 5 } }

@router.post("/voice-fix")
async def voice_fix(body: dict):
    # MOCK — zastąp po Push 2
    return { "data": { "corrected": body.get("transcript", ""), "confidence": 1.0 } }

@router.post("/chat")
async def chat(body: dict):
    # MOCK streaming — zastąp po Push 2
    async def gen():
        yield "data: To jest przykładowa odpowiedź AI.\n\n"
        yield "data: [DONE]\n\n"
    from fastapi.responses import StreamingResponse
    return StreamingResponse(gen(), media_type="text/event-stream")
```

**Zrób PR z mockami → frontend może integrować od razu.**

### Po A1 Push 2 → zastąp mocki realną logiką

```
/api/tag:
  wywołaj utils.run_autotagger(text)
  INSERT search_logs(query=text, tags=wynik_json, created_at=now)

/api/match:
  1. from app.embeddings import similarity_search
  2. wyniki = similarity_search(text, n_results=50)
  3. SELECT innovations WHERE id IN (wyniki ids)
  4. score = cosine_score + 0.1 * len(set(innov_tags) & set(query_tags))
  5. sort desc, top 5

/api/chat (SSE):
  1. SELECT full_desc FROM innovations WHERE id IN (context_innovation_ids)
  2. system_prompt = "Kontekst innowacji:\n" + pełne opisy
  3. from app.llm import chat as llm_chat
  4. stream llm_chat(messages, stream=True)

/api/voice-fix:
  from app.llm import chat as llm_chat
  prompt = f"Popraw gramatykę i ortografię: '{transcript}'. JSON: {{corrected, confidence}}"
```

### Po A3 seed → zamień similarity_search na realne dane (zamiast mocków)

### Ustalone decyzje — nie zmieniaj bez COMMS.md
- Tagi tylko z `TAXONOMY_TAGS` z `utils.py`
- 5 kart, ranking = cosine + tag boost
- Voice: browser STT → serwer dostaje tekst → `/api/voice-fix` poprawia gramatykę
- Early rejection: `is_relevant: false` → frontend pokazuje komunikat, Ty tylko zwracasz flagę
- Historia chatu: frontend trzyma w stanie, Ty dostajesz pełne `messages[]`
- Badge "Nieaktualna": Ty zwracasz `is_unmaintained: true`, frontend renderuje szary badge

---

## 🟨 Agent 3 — Knowledge & Data

### Co robisz od t=0

Nie czekasz na nikogo. Zacznij od parsowania plików ROPS — DB jeszcze nie potrzebujesz.

**t=0: zacznij parsować `data/rops_raw/`**
```python
# parse_rops.py (lokalny skrypt, nie commituj jeszcze)
# Wczytaj pliki z rops_raw/ → wyciągnij pola:
# title, short_desc, full_desc, category, area, target_group,
# location, cost_level, where_implemented, source_url
# Zapisz wyniki do data/parsed_innovations.json
# To możesz robić bez DB
```

**Po A1 Push 1 → uruchom seed i merge:**
```python
# data/seed_innovations.py — uzupełnij szkielet od A1
# 1. Wczytaj data/parsed_innovations.json
# 2. INSERT innovations do SQLite
# 3. from app.embeddings import embed_and_store
#    embed_and_store(str(id), title+" "+short_desc+" "+full_desc, metadata)
# Uruchom: python -m data.seed_innovations
# Napisz [DONE] seed w COMMS.md → odblokowuje A2
```

**Równolegle pisz `app/routers/knowledge.py` z mockami** (tak jak A2):
```python
# Mock responses dopóki seed nie gotowy, potem zastąp realnym SELECT
```

### Endpointy (zastępuj mocki po seedzie)

```
GET /api/innovations
  ?search=&tags=&category=&area=&status=&limit=20&offset=0
  SQLite LIKE po title+short_desc, filtr po kolumnach
  Przy search: WHERE title LIKE ? OR short_desc LIKE ?

GET /api/innovations/{id}
  Pełna karta, wszystkie pola

GET /api/challenges
  ?powiat=&area=

GET /api/challenges/map
  [{ powiat, challenges[], gap_index, top_areas[] }]
  Dane do mapy powiatów

GET /api/stats/malopolska
  Zagregowane wskaźniki — możesz zahardkodować z danych GUS:
  { aging_pct: 22.4, loneliness_pct: 18.1, digital_exclusion_pct: 31.0,
    source_year: 2024, top_challenges: [...] }

GET /api/gmina-pulse/{powiat}
  { top_challenges: [x3], vs_regional_average: {...}, matching_innovations: [x3] }
  matching_innovations: wewnętrznie similarity_search(powiat+" "+top_challenge)

GET /api/innovation-gap
  [{ powiat, gap_score, top_area, innovations_count }]
  gap_score = challenge_count / max(innovations_count, 1)
```

### Co możesz zahardkodować
- `stats/malopolska` — wpisz liczby z raportów ROPS ręcznie
- `innovation-gap` — 5-6 powiatów z przykładowymi wartościami wystarczy na demo
- `challenges/map` — kilka powiatów, reszta pusta

---

## 🟩 Agent 4 — Creator + Tester + Forum

### Co robisz od t=0

Forum i struktura fiszek nie wymagają LLM. Zacznij od nich.

**t=0: `app/routers/forum.py`** — to jest czysty CRUD, zero LLM:
```python
GET  /api/forum?parent_id=&limit=20&offset=0
  SELECT forum_posts WHERE parent_id IS NULL (lub WHERE parent_id=?)
  ORDER BY created_at DESC
  Bez auth, widoczne dla wszystkich

POST /api/forum
  Body: { content, parent_id, author_name }
  badge = request.state.user.role jeśli zalogowany, else "user"
  INSERT forum_posts
  Return: { "data": { "post": ForumPost } }
```

**t=0: `app/routers/creator.py`** — fiszka bez LLM (mock AI rozbicia):
```python
POST /api/ideas
  # Zaślepka: nie rozbijaj przez LLM, zapisz problem_text as-is w short_desc
  # Po Push 2 zastąp realnym LLM call

GET  /api/ideas/{id}
PATCH /api/ideas/{id}   body: { field, value }
```

**Po A1 Push 2 → dodaj LLM do Kreatora:**
```python
POST /api/ideas:
  1. prompt = "Rozbij na pola fiszki: {problem_text}. JSON: {title, short_desc, essence, target_group, stage}"
  2. from app.llm import chat; result = await chat([{role:user, content:prompt}])
  3. from app.utils import run_autotagger; tags = await run_autotagger(problem_text)
  4. INSERT submissions(type="idea") + INSERT ideas

POST /api/ideas/{id}/ai-assist  (SSE):
  kontekst = pełna fiszka jako system prompt
  stream llm.chat(messages, stream=True)

GET  /api/grants/templates
  SELECT * FROM grant_templates WHERE active=true

POST /api/grants/generate  (SSE):
  1. pobierz template + ideę
  2. dla każdego pola template: stream LLM odpowiedź
  data: {"field": "opis", "content": "..."}\n\n
```

### Tester endpointy (po Push 1, bez LLM):
```
POST /api/testers/apply
  Body: { name, email, organization, expertise }
  INSERT testers(approved=false)

GET  /api/test-sessions     role: tester|admin
POST /api/test-sessions
  Body: { innovation_id, feedback, rating, improvements }
  role: tester

GET /api/innovations/{id}/tests
  avg_rating, count, anonimowe uwagi — publiczne
```

---

## 🟦 Agent 5 — Admin + Middleman

### Co robisz od t=0

Admin CRUD nie wymaga LLM. Zacznij od niego.

**t=0: `app/routers/admin.py`** — czysty CRUD, zero LLM:
```python
# Wszystkie endpointy wymagają: require_role("admin") z auth.py
# Ale auth.py jest w Push 2 — zaślepka: sprawdź nagłówek X-Dev-Admin: true
# Po Push 2 zastąp prawdziwym require_role

GET  /api/admin/innovations?status=&tags=&search=
POST /api/admin/innovations/{id}/approve        → UPDATE status="active"
POST /api/admin/innovations/{id}/archive        → UPDATE status="archived"
POST /api/admin/innovations/{id}/flag-unmaintained → UPDATE status="unmaintained"

GET  /api/admin/users
POST /api/admin/users/{id}/set-role   body: { role }

GET  /api/admin/testers?approved=false
POST /api/admin/testers/{id}/approve
  UPDATE testers SET approved=true
  UPDATE users SET role="tester" WHERE id=tester.user_id

GET  /api/admin/trends
  SELECT tags, COUNT(*) FROM search_logs GROUP BY tags LIMIT 10  (mock jeśli brak danych)

GET  /api/admin/stats
  COUNT(*) z innovations, submissions, forum_posts, testers WHERE approved=true

GET  /api/admin/cms
POST /api/admin/cms   body: { key, value }

POST /api/admin/grants/templates   body: { name, competition_name, deadline, fields, active }
```

**Po A1 Push 2 → dodaj Middleman i prawdziwy auth:**

```python
# app/routers/middleman.py

POST /api/middleman/start
  Body: { innovation_id, institution_type, location, problem_desc }
  1. SELECT * FROM innovations WHERE id=innovation_id
  2. system = """Jesteś ekspertem od wdrażania innowacji społecznych w Polsce.
                 Znasz realia małych gmin, OPS, NGO. Zadajesz MAX 3 pytania zanim
                 dajesz konkretny plan. Pytania są krótkie i praktyczne."""
  3. first_q = await llm.chat([{role:system,...}, {role:user, content: opis_innowacji+problem_desc}])
  4. INSERT middleman_sessions(conversation=[{role:assistant,content:first_q}])
  Return: { "data": { "session_id": uuid, "first_question": first_q } }

POST /api/middleman/answer  (SSE)
  Body: { session_id, answer }
  1. pobierz sesję, dodaj answer do conversation
  2. LLM decyduje: pytanie czy plan?
     prompt końcowy: "Jeśli masz wystarczająco info → wygeneruj plan JSON:
     {staff_needed, estimated_cost, location_suggestions, steps:[], timeline, funding_hints}
     Jeśli potrzebujesz więcej → zadaj jedno krótkie pytanie."
  3. Jeśli plan → data: {"type":"plan","content":{...}}\n\n
     Jeśli pytanie → data: {"type":"question","content":"..."}\n\n
  4. UPDATE middleman_sessions
```

### Zaślepka auth przed Push 2
```python
# Tymczasowo zamiast require_role("admin"):
def mock_admin_check(request: Request):
    if request.headers.get("X-Dev-Admin") != "true":
        raise HTTPException(403)
# Po Push 2 zamień na: Depends(require_role("admin"))
```

---

## Mapa zależności

```
                    ┌─────────────────────────────────────────────┐
                    │ t=0: wszyscy startują                       │
                    │                                             │
           A1 Push1 │  A3: parsuje pliki ROPS (lokalnie, bez DB) │
           (30min)  │  A2: pisze mock endpoints                   │
                    │  A4: forum + fiszka CRUD (bez LLM)          │
                    │  A5: admin CRUD (bez LLM, mock auth)        │
                    └──────────────┬──────────────────────────────┘
                                   │
                          A1 Push 1 ──► A3 uruchamia seed
                                        A4 może testować z DB
                                        A5 może testować z DB
                                   │
                          A1 Push 2 ──► A2 zastępuje mocki realnym LLM
                                        A5 dodaje Middleman
                                        A4 dodaje LLM do Kreatora
                                   │
                          A3 seed  ──► A2 zastępuje mock data realnym ChromaDB
                                   │
                          t=120min ──► wszyscy w pełnej prędkości
```

---

## Checklist przed każdym PR

- [ ] Endpoint działa lokalnie (curl lub test ręczny)
- [ ] Response format: `{ "data": ..., "error": null }`
- [ ] Nie ruszyłem shared files bez wpisu w COMMS.md
- [ ] Zaktualizowałem STATUS BOARD w COMMS.md
- [ ] Napisałem [DONE] w swoim bloku w COMMS.md
