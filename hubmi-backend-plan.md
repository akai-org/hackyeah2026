# HubMI.pl — Plan Implementacji Backendu (5 Agentów)

## Struktura repo

```
repo/
├── backend/
│   ├── app/
│   │   ├── main.py           # FastAPI app init + rejestracja routerów
│   │   ├── database.py       # SQLite connection, session factory
│   │   ├── models.py         # SQLAlchemy ORM — JEDYNE ŹRÓDŁO PRAWDY (nie ruszać bez PR)
│   │   ├── schemas.py        # Pydantic schemas — JEDYNE ŹRÓDŁO PRAWDY (nie ruszać bez PR)
│   │   ├── llm.py            # OpenRouter async client — JEDYNE ŹRÓDŁO PRAWDY
│   │   ├── embeddings.py     # ChromaDB setup + embed_text() — JEDYNE ŹRÓDŁO PRAWDY
│   │   ├── auth.py           # Mock auth middleware
│   │   └── routers/
│   │       ├── matchmaking.py   # Agent 2
│   │       ├── knowledge.py     # Agent 3
│   │       ├── creator.py       # Agent 4
│   │       ├── forum.py         # Agent 4
│   │       ├── admin.py         # Agent 5
│   │       └── middleman.py     # Agent 5
│   ├── data/
│   │   ├── seed_innovations.py  # Agent 3 — ładuje ROPS do SQLite + ChromaDB
│   │   ├── seed_challenges.py   # Agent 3 — Mapa Wyzwań
│   │   └── rops_raw/            # surowe pliki z ROPS (PDF, CSV, JSON)
│   ├── chroma_db/            # vector store (gitignore)
│   ├── hubmi.db              # SQLite (gitignore)
│   ├── requirements.txt
│   └── .env.example
└── frontend/                 # osobna faza — nie ruszać
```

---

## ZASADY DLA WSZYSTKICH AGENTÓW

### Git workflow
- Branch: `agent-{N}/{feature}`, np. `agent-2/matchmaking`
- PR do `main` po zakończeniu każdego endpointu (nie czekaj na koniec)
- **Nigdy nie edytujcie** `models.py`, `schemas.py`, `llm.py`, `embeddings.py` — tylko przez PR z opisem zmiany, Agent 1 reviewuje
- Konflikty niemożliwe — każdy agent ma swój plik routera

### Unified response format
```json
{ "data": <payload>, "error": null }
{ "data": null, "error": "opis błędu" }
```
HTTP status: `200` OK, `400` user error, `403` forbidden, `422` validation, `500` server

### Streaming (SSE)
```
Content-Type: text/event-stream
data: {chunk}\n\n
data: [DONE]\n\n
```
FastAPI: `StreamingResponse(generator(), media_type="text/event-stream")`

### Auth w routerach
```python
from app.auth import get_current_user
from fastapi import Depends

@router.get("/endpoint")
async def endpoint(user=Depends(get_current_user)):
    if user.role != "admin":
        raise HTTPException(403)
```

---

## FAZA 0 — Agent 1: Core & Schema

> **Reszta startuje dopiero po merge Fazy 0 do main. Cel: ≤ 2h.**

### Zadania Agent 1

1. Init repo, struktura folderów, `.gitignore`, `README.md`
2. `requirements.txt`
3. `.env.example`
4. `database.py` — SQLite + SQLAlchemy async
5. `models.py` — pełny schema (patrz niżej)
6. `schemas.py` — Pydantic v2 schemas dla wszystkich endpointów
7. `llm.py` — OpenRouter async client
8. `embeddings.py` — ChromaDB init + `embed_text()`
9. `auth.py` — mock middleware
10. `main.py` — app z routerami (zaślepki na start)
11. `data/seed_innovations.py` — szkielet z instrukcją dla Agenta 3

### models.py — PEŁNY SCHEMA

```python
# Tabela: innovations
id, title, short_desc, full_desc, category, area, target_group,
location, status,           # "active" | "archived" | "unmaintained"
cost_level,                 # "low" | "medium" | "high"
implementation_time_months, # int
testers_count,              # int
where_implemented,          # text
source_url,
embedding_id,               # UUID str, klucz do ChromaDB
tags,                       # JSON str, np. '["seniorzy","wykluczenie"]'
created_at, updated_at

# Tabela: challenges  (Mapa Wyzwań)
id, title, area, description, indicator_value, indicator_unit,
source, data_year, gmina, powiat, voivodeship

# Tabela: innovation_gap_index  (Indeks Luki Innowacyjnej)
id, powiat, challenge_area, challenge_count, innovations_count,
gap_score,                  # float: challenge_count / max(innovations_count, 1)
updated_at

# Tabela: users  (mock, bez prawdziwego auth)
id, name, role,             # "admin" | "tester" | "consultant" | "user"
session_token,              # UUID str
created_at

# Tabela: testers  (profil testera)
id, user_id,                # FK users.id, nullable przed zatwierdzeniem
name, email, organization, expertise,
approved,                   # bool
created_at

# Tabela: submissions  (logi matchmakingu i fiszek)
id, user_session, type,     # "match" | "idea" | "test"
problem_text, tags,         # JSON
status,                     # "pending" | "processed"
created_at

# Tabela: ideas  (Kreator Pomysłów)
id, submission_id,          # FK submissions.id nullable
title, short_desc, essence, target_group, stage,
tags,                       # JSON
attachments,                # JSON lista nazw plików
grant_context,              # text — notatki do wniosku
created_at

# Tabela: test_sessions
id, innovation_id,          # FK innovations.id
tester_id,                  # FK testers.id
feedback, rating,           # int 1-5
improvements, status,       # "draft" | "submitted"
created_at

# Tabela: forum_posts
id, parent_id,              # FK forum_posts.id nullable
content, author_name,
badge,                      # "user" | "tester" | "admin" | "consultant"
user_session,
created_at

# Tabela: search_logs  (trendy dla admina)
id, query, tags,            # JSON
results_count, user_session,
created_at

# Tabela: cms_content  (proste K/V dla admina)
id, key, value, updated_by, updated_at

# Tabela: grant_templates
id, name, competition_name, deadline, fields,  # JSON schema pól
active,                     # bool
created_at

# Tabela: middleman_sessions
id, innovation_id, institution_type, location,
problem_desc, conversation, # JSON lista {role, content}
plan,                       # JSON finalny plan
status,                     # "in_progress" | "done"
created_at
```

### llm.py — interface

```python
import openai  # OpenRouter jest OpenAI-compatible

client = openai.AsyncOpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=settings.OPENROUTER_API_KEY
)

async def chat(messages: list[dict], stream: bool = False, model: str = None):
    """Non-streaming → str. Streaming → AsyncGenerator[str]."""

async def embed(text: str) -> list[float]:
    """Embedding przez OpenRouter lub lokalnie."""
```

### embeddings.py — interface

```python
import chromadb

def get_chroma_collection() -> chromadb.Collection:
    """Singleton kolekcja 'innovations'."""

async def embed_and_store(doc_id: str, text: str, metadata: dict):
    """Embed + zapis do ChromaDB."""

async def similarity_search(query: str, n_results: int = 10) -> list[dict]:
    """Zwraca [{ id, score, metadata }]."""
```

### auth.py — mock

```python
# POST /api/auth/session  → tworzy usera z rolą "user", zwraca session_token
# POST /api/auth/set-role → zmienia rolę BEZ weryfikacji (hackathon!)
# GET  /api/auth/me       → zwraca aktualnego usera

# Middleware: czyta header X-Session-Token lub cookie "session"
# Dokłada request.state.user (User | None)

def get_current_user(request: Request) -> User | None: ...
def require_role(*roles): ...  # Depends factory
```

### .env.example

```
OPENROUTER_API_KEY=
OPENROUTER_MODEL=anthropic/claude-haiku-4-5-20251001
OPENROUTER_EMBED_MODEL=openai/text-embedding-3-small
DATABASE_URL=sqlite+aiosqlite:///./hubmi.db
CHROMA_PATH=./chroma_db
CORS_ORIGINS=http://localhost:3000
```

### requirements.txt

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

---

## FAZA 1 — Agenci 2–5 (równolegle po merge Fazy 0)

---

### Agent 2 — Matchmaking Engine

**Branch:** `agent-2/matchmaking`  
**Plik:** `app/routers/matchmaking.py`

#### Endpointy

```
POST /api/tag
  Body:   { "text": "..." }
  Return: {
    "tags": ["seniorzy", "wykluczenie_cyfrowe"],
    "area": "wykluczenie cyfrowe",
    "target_group": "seniorzy 65+",
    "location": "Kraków" | null,
    "type": "problem" | "innovation" | "education",
    "is_unmaintained_warning": false
  }
  Logika: 1 LLM call z JSON mode, taksonomia z promptu, szybki model
  Zapis:  INSERT search_logs (query=text, tags=wynik)
```

```
POST /api/match
  Body:   { "text": "...", "tags": [...], "limit": 5 }
  Return: {
    "innovations": [InnovationCard],
    "total_found": 12
  }
  Logika:
    1. embed(text) → similarity_search(n=20)
    2. filtruj po tagach jeśli podane
    3. SELECT innovations WHERE id IN (ids) ORDER BY score
    4. oznacz is_unmaintained jeśli status="unmaintained"
  InnovationCard: { id, title, short_desc, tags, match_score,
                    category, cost_level, testers_count,
                    where_implemented, is_unmaintained }
```

```
POST /api/chat  (SSE streaming)
  Body:   {
    "messages": [{"role":"user","content":"..."}],
    "tags": [...],
    "context_innovation_ids": [1, 3, 7]
  }
  Logika:
    1. Pobierz pełne opisy innowacji po ids z DB
    2. Wstrzyknij do system prompt jako RAG context
    3. stream LLM response
  Zapis: INSERT search_logs
```

```
POST /api/voice-fix
  Body:   { "transcript": "..." }
  Return: { "corrected": "...", "confidence": 0.92 }
  Prompt: "Popraw gramatykę i ortografię tego tekstu po polsku.
           Zwróć JSON: {corrected: str, confidence: float 0-1}"
```

#### Uwagi implementacyjne
- Autotagger jest zawsze szybki — mały model, JSON mode, timeout 5s
- `/api/match` NIE streamuje — front dostaje karty naraz
- `/api/chat` streamuje — odpowiedź RAG "wpisuje się" na żywo
- Każde zapytanie → `INSERT search_logs` (async, nie blokuj odpowiedzi)

---

### Agent 3 — Knowledge Base & Data

**Branch:** `agent-3/knowledge`  
**Pliki:** `app/routers/knowledge.py`, `data/seed_*.py`

#### Endpointy

```
GET /api/innovations
  Query:  ?search=&tags=&category=&area=&status=&limit=20&offset=0
  Return: { "data": { "innovations": [InnovationCard], "total": int } }
  Logika: SQLite FTS5 lub LIKE po title+short_desc, filtr po kolumnach

GET /api/innovations/{id}
  Return: pełna karta innowacji (wszystkie pola)

GET /api/challenges
  Query:  ?powiat=&area=&year=
  Return: { "data": { "challenges": [Challenge] } }

GET /api/challenges/map
  Return: {
    "data": [{
      "powiat": "Kraków",
      "challenges": [Challenge],
      "gap_index": 3.2,
      "top_areas": ["starzenie", "samotność"]
    }]
  }
  Dane do interaktywnej mapy powiatów na frontendzie

GET /api/stats/malopolska
  Return: {
    "data": {
      "aging_pct": 22.4,
      "loneliness_pct": 18.1,
      "digital_exclusion_pct": 31.0,
      "poverty_per_10k": 145,
      "mental_health_facilities": 23,
      "source_year": 2024,
      "top_challenges": [Challenge x5]
    }
  }

GET /api/gmina-pulse/{powiat}
  Return: {
    "data": {
      "powiat": "Kraków",
      "top_challenges": [Challenge x3],
      "vs_regional_average": {
        "aging_pct": { "local": 24.1, "avg": 20.3, "delta": +3.8 }
      },
      "matching_innovations": [InnovationCard x3]
    }
  }
  To jest "Puls mojej gminy" — łączy Zasobnik z Matchmakingiem

GET /api/innovation-gap
  Return: { "data": [{ "powiat", "gap_score", "top_area", "innovations_count" }] }
  Indeks Luki Innowacyjnej — do mapy ciepła na frontendzie
```

#### Seedy (priorytet — bez danych demo nie działa)

```python
# seed_innovations.py
# Parsuje pliki z data/rops_raw/
# 1. INSERT do innovations
# 2. embed_and_store(str(id), title + " " + short_desc + " " + full_desc, metadata)
# Uruchomienie: python -m data.seed_innovations

# seed_challenges.py
# Parsuje Mapę Wyzwań (PDF → text lub gotowy JSON)
# INSERT do challenges
# Oblicza innovation_gap_index per powiat/area
```

#### Uwagi
- SQLite FTS5 dla wyszukiwania: `CREATE VIRTUAL TABLE innovations_fts USING fts5(...)`
- `gmina-pulse` wywołuje wewnętrznie `similarity_search` z embeddings — importuje z `embeddings.py`
- Dane statyczne (GUS) można zahardkodować w seedzie — ważna jest spójność z Mapą Wyzwań

---

### Agent 4 — Creator + Tester + Forum

**Branch:** `agent-4/creator-tester-forum`  
**Pliki:** `app/routers/creator.py`, `app/routers/forum.py`

#### Endpointy Creator

```
POST /api/ideas
  Body:   { "problem_text": "...", "tags": [...] }
  Logika:
    1. LLM rozbija tekst na pola fiszki (krótki opis, istota, dla kogo, etap)
       Prompt z JSON mode, pola: title, short_desc, essence, target_group, stage
    2. Autotagger (wewnętrzne wywołanie /api/tag lub wspólna funkcja)
    3. INSERT ideas, INSERT submissions(type="idea")
  Return: { "data": { "idea": Idea } }

GET  /api/ideas/{id}
PATCH /api/ideas/{id}
  Body:   { "field": "title", "value": "Nowa nazwa" }  — edycja pole po polu
  Return: { "data": { "idea": Idea } }

POST /api/ideas/{id}/ai-assist  (SSE streaming)
  Body:   { "question": "Jak powinnam to opisać?" }
  Logika: kontekst = pełna fiszka, LLM odpowiada w stylu asystenta-mentora
  Return: SSE stream

GET  /api/grants/templates
  Return: { "data": { "templates": [GrantTemplate] } }
  Źródło: cms_content gdzie active=true

POST /api/grants/generate  (SSE streaming)
  Body:   { "idea_id": 1, "template_id": 2 }
  Logika:
    1. Pobierz template fields z cms_content
    2. Pobierz ideę
    3. LLM wypełnia każde pole wniosku strumieniując
  Return: SSE stream z JSON per pole: data: {"field": "opis", "content": "..."}
```

#### Endpointy Tester

```
POST /api/testers/apply
  Body:   { "name", "email", "organization", "expertise" }
  Logika: INSERT testers(approved=false), INSERT users(role="user")
  Return: { "data": { "tester_id": 5, "status": "pending" } }

GET  /api/test-sessions
  Auth:   role in ["tester", "admin"]
  Return: { "data": { "sessions": [TestSession] } }

POST /api/test-sessions
  Auth:   role = "tester"
  Body:   { "innovation_id", "feedback", "rating", "improvements" }
  Return: { "data": { "session": TestSession } }

GET /api/innovations/{id}/tests
  Return: publiczne podsumowanie testów (avg rating, count, anonimowe uwagi)
```

#### Endpointy Forum

```
GET  /api/forum
  Query:  ?parent_id=&limit=20&offset=0
  Return: { "data": { "posts": [ForumPost], "total": int } }
  Dostęp: wszyscy (zalogowani i nie)

POST /api/forum
  Body:   { "content": "...", "parent_id": null, "author_name": "Jan" }
  Auth:   opcjonalna (badge zależy od roli)
  Logika:
    badge = user.role jeśli zalogowany, else "user"
    INSERT forum_posts
  Return: { "data": { "post": ForumPost } }
```

---

### Agent 5 — Admin Panel + Middleman

**Branch:** `agent-5/admin-middleman`  
**Pliki:** `app/routers/admin.py`, `app/routers/middleman.py`

#### Endpointy Middleman

```
POST /api/middleman/start
  Body: {
    "innovation_id": 3,
    "institution_type": "gmina wiejska",
    "location": "Limanowa",
    "problem_desc": "Mamy dużo samotnych seniorów..."
  }
  Logika:
    1. Pobierz pełną innowację
    2. LLM generuje pierwsze pytanie doprecyzowujące
    3. INSERT middleman_sessions
  Return: { "data": { "session_id": "uuid", "first_question": "Ile macie ..." } }

POST /api/middleman/answer  (SSE streaming)
  Body: { "session_id": "uuid", "answer": "Ok mamy 3 pracowników..." }
  Logika:
    1. Pobierz sesję, dodaj odpowiedź do conversation JSON
    2. Jeśli LLM uzna że ma dość info → generuje finalny plan (JSON)
    3. Jeśli nie → kolejne pytanie
    4. Strumieniuj odpowiedź
    5. UPDATE middleman_sessions
  Plan format:
    { "staff_needed": "...", "estimated_cost": "5-10k zł/rok",
      "location_suggestions": "...", "steps": ["krok 1", ...],
      "timeline": "3 miesiące", "funding_hints": "..." }
  Return: SSE — data: {"type":"question","content":"..."} lub
                       {"type":"plan","content":{plan JSON}}
```

#### Endpointy Admin

```
GET  /api/admin/innovations
  Auth:   admin
  Query:  ?status=&tags=&search=
  Return: lista pełnych kart + status

POST /api/admin/innovations/{id}/approve
POST /api/admin/innovations/{id}/archive
POST /api/admin/innovations/{id}/flag-unmaintained
  Auth:   admin
  Return: zaktualizowana innowacja

GET  /api/admin/users
  Auth:   admin
  Return: { "data": { "users": [User] } }

POST /api/admin/users/{id}/set-role
  Auth:   admin
  Body:   { "role": "tester" }

GET  /api/admin/testers?approved=false
  Auth:   admin

POST /api/admin/testers/{id}/approve
  Auth:   admin
  Logika: UPDATE testers SET approved=true, UPDATE users SET role="tester"

GET  /api/admin/trends
  Auth:   admin
  Return: {
    "top_tags": [{"tag": "seniorzy", "count": 45}],
    "top_queries": [{"query": "...", "count": 12}],
    "submissions_by_day": [{"date": "2026-10-03", "count": 7}]
  }
  Źródło: search_logs

GET  /api/admin/stats
  Auth:   admin
  Return: {
    "total_innovations": 87,
    "total_submissions": 234,
    "total_forum_posts": 56,
    "active_testers": 12,
    "pending_testers": 3
  }

GET  /api/admin/cms
  Auth:   admin
  Return: { "data": { "items": [CmsContent] } }

POST /api/admin/cms
  Auth:   admin
  Body:   { "key": "grant_aktywne_nabory", "value": "..." }

POST /api/admin/grants/templates
  Auth:   admin
  Body:   { "name", "competition_name", "deadline", "fields": [...], "active": true }
  INSERT grant_templates
```

---

## Kolejność merge'owania

```
t=0h    Agent 1 → main  ← wszyscy czekają
t=2h    Agenci 2,3,4,5 tworzą branche i zaczynają
t=5h    Agent 3 merge seed_*.py (dane muszą być w DB)
t=6h+   Kolejne PR po gotowości każdego endpointu
t=20h   Code freeze backend, start frontend
t=23h   Gotowe demo
```

## Shared utility — wywołanie autotaggera wewnętrznie

Agenci 3 i 4 też potrzebują tagowania. Nie duplikujcie logiki — stwórzcie:

```python
# app/utils.py  — tworzy Agent 1 w Fazie 0
async def run_autotagger(text: str) -> dict:
    """Wywołuje LLM tagger, zwraca dict z tagami. Importujcie to zamiast pisać własny."""
```

---

## Checklist przed startem każdego agenta

- [ ] Zrobiłem `git pull origin main` po merge Fazy 0
- [ ] Mam działające `.env` z kluczem OpenRouter
- [ ] `python -m data.seed_innovations` przeszedł bez błędów (Agent 3 robi, reszta weryfikuje)
- [ ] `uvicorn app.main:app --reload` startuje
- [ ] Mój router jest zarejestrowany w `main.py`
