# HubMI.pl — Status projektu

> Aktualizacja: 2026-10-03. Deadline: 4 październik 11:00.

---

## Co jest zrobione

### Backend fundament (Agent 1 — kompletny)
- `models.py` — wszystkie tabele: users, testers, innovations, challenges, innovation_gap_index, search_logs, ideas
- `database.py` — SQLite async (aiosqlite + SQLAlchemy)
- `config.py` — settings z .env
- `main.py` — FastAPI + CORS + rejestracja routerów
- `auth.py` — get_current_user (cookie/header), require_role
- `llm.py` — OpenRouter async client (chat + embed)
- `embeddings.py` — ChromaDB singleton, embed_and_store, similarity_search
- `utils.py` — TAXONOMY_TAGS (25 tagów), run_autotagger
- `routers/auth.py` — POST /api/auth/session, POST /api/auth/set-role, GET /api/auth/me

### Backend routery
- `routers/matchmaking.py` — /api/tag, /api/match, /api/voice-fix, /api/chat (z fallbackami)
- `routers/knowledge.py` — /api/innovations, /api/innovations/{id}, /api/challenges, /api/challenges/map, /api/stats/malopolska, /api/gmina-pulse/{powiat}, /api/innovation-gap, /api/ideas, /api/forum, /api/testerzy
- `routers/admin.py` — /api/admin/innovations (+approve/archive/flag), /api/admin/users (+set-role), /api/admin/testers (+approve), /api/admin/trends, /api/admin/stats, /api/admin/recent, /api/admin/ideas (+set-status)
- `routers/middleman.py` — /api/middleman/start, /api/middleman/answer (SSE)

### Dane demo
- 21 innowacji w SQLite przez `seed_demo.py` (auto-run na setup.sh)
- `mock_data.py` — MOCK_INNOVATIONS, MOCK_TAG_RESPONSE, MOCK_CHALLENGES, MOCK_GAP_INDEX, MOCK_STATS_MALOPOLSKA, MOCK_FORUM_POSTS

### Frontend — 13 stron (wszystkie HTTP 200)
- `/` — homepage SSR z live stats z backendu (revalidate 120s)
- `/wyniki` — matchmaking: voice input, autotagger z chipami, 5 kart, RAG chat streaming
- `/biblioteka` — lista innowacji z filtrowaniem
- `/biblioteka/[id]` — karta szczegółów: print button, copy link, przycisk "Jak wdrożyć?" → Middleman
- `/kreator` — formularz pomysłu + fake AI analiza (mock)
- `/testerzy` — formularz zgłoszeniowy (woła /api/testerzy)
- `/forum` — wątki z badge'ami ról
- `/admin` — redirect do /admin/statystyki
- `/admin/statystyki` — liczniki + recent activity panel (wołają /api/admin/stats + /api/admin/recent)
- `/admin/innowacje` — tabela + Zatwierdź/Archiwizuj/Nieaktywna + CSV export
- `/admin/uzytkownicy` — lista + zmiana roli + zatwierdzanie testerów
- `/admin/trendy` — wykresy recharts (top tagi, zgłoszenia per dzień)
- `/admin/pomysly` — lista pomysłów z /api/admin/ideas
- `/deklaracja-dostepnosci` — strona WCAG
- `not-found.tsx` — custom 404

### UX / WCAG AA
- Auth: modal picker (mieszkaniec/tester/konsultant/admin), name input, UUID cookie
- Dynamic page titles na wszystkich stronach klienckich (WCAG 2.4.2)
- MiddlemanModal — focus trap, ARIA, streaming SSE, 2-turnowy dialog (pytanie follow-up → plan)
- Voice dictation — Web Speech API + /api/voice-fix post-processing
- Print CSS na /biblioteka/[id]
- CutoutText heading na 404

---

## Co jest mockiem / nie działa w pełni

### Krytyczne — wpływają na 40% oceny (Realizacja wyzwania)

| Co | Gdzie | Stan | Żeby naprawić |
|---|---|---|---|
| **Autotagger LLM** | `routers/matchmaking.py:22` | Fallback na MOCK_TAG_RESPONSE gdy brak API key lub wyjątek | Wgrać OPENROUTER_API_KEY do .env |
| **Semantic search ChromaDB** | `routers/matchmaking.py:54` | Fallback na text search w SQLite gdy ChromaDB puste; text search działa ale bez semantyki | Wgrać API key + uruchomić seed z embeddingami |
| **RAG chat** | `routers/matchmaking.py:159` | Fallback na mock_gen() — zwraca hardkodowaną odpowiedź, nie zna kontekstu innowacji | Wgrać API key |
| **Middleman LLM** | `routers/middleman.py:79` | Fallback na MOCK_PLAN gdy brak API key | Wgrać API key |
| **Dane ROPS** | `data/rops_raw/` | Katalog nie istnieje — surowe dane z ROPS Kraków nigdy nie zostały wgrane; seed_demo.py ma 21 realistycznych innowacji ale nie są prawdziwymi danymi ROPS | Scrape z rops.krakow.pl lub wgrać ręcznie |

### Ważne — Agent 3 (Knowledge & Seed) nie zaczął

| Co | Gdzie | Stan |
|---|---|---|
| **ChromaDB embeddingi** | `data/seed_innovations.py` | Plik istnieje, ale `rops_raw/` jest pusty — seed z embeddingami nigdy nie przeszedł; SQLite ma dane z seed_demo.py ale ChromaDB jest puste |
| `GET /api/innovation-gap` | `routers/knowledge.py:163` | Zwraca MOCK_GAP_INDEX — nie ma realnych danych z OZPS |
| `GET /api/challenges/map` | `routers/knowledge.py:138` | Zwraca mock challenges — nie ma realnych wyzwań per powiat |
| `GET /api/gmina-pulse/{powiat}` | `routers/knowledge.py:156` | Zwraca pierwsze 3 mock innowacje, ignoruje powiat |

### Pomniejsze / OK na demo

| Co | Stan |
|---|---|
| Admin auth | Używa X-Dev-Admin header zamiast session — wystarczy na hackathon |
| `/api/forum` | Woła SQLite, fallback na MOCK_FORUM_POSTS — działa |
| `/api/voice-fix` | Woła LLM, fallback na echo — działa |
| `/kreator` | Fake AI analiza (setTimeout) — celowo mock per AGENTS.md |

---

## Kolejność działań na teraz (4 październik, do 11:00)

### 1. Wgrać klucz OpenRouter (5 minut) — PRIORYTET 1
```
find_inv_server/.env
  OPENROUTER_API_KEY=sk-or-...
```
To odblokuje: autotagger LLM, RAG chat, Middleman, voice-fix.

### 2. Zaembedować innowacje do ChromaDB (15 minut) — PRIORYTET 2
```bash
cd find_inv_server
python -m data.seed_demo        # SQLite już ma dane, ale można przepuścić ponownie
# albo: dodać flagę --embed do seed_demo.py żeby dla każdej innowacji wywołał embed_and_store
```
Bez tego `/api/match` używa text search (działa, ale bez semantyki).

### 3. Opcjonalnie: scrape ROPS Kraków — PRIORYTET 3
Tylko jeśli jest czas. Strony do scrapowania:
- https://rops.krakow.pl/innowacje-spoleczne/biblioteka-innowacji-spolecznych/kategorie
- Wynik zapisać do `find_inv_server/data/rops_raw/`
- Uruchomić `seed_innovations.py`

---

## Stack przypomnienie

```
Frontend:   Next.js App Router    → find_inv/
Backend:    FastAPI (async)       → find_inv_server/
DB:         SQLite (aiosqlite)    → find_inv_server/findinv.db
Vectors:    ChromaDB              → find_inv_server/chroma_db/
LLM:        OpenRouter API        → .env OPENROUTER_API_KEY
```

## Uruchomienie

```bash
./setup.sh        # instaluje zależności, seeduje SQLite, startuje oba serwery
# lub ręcznie:
cd find_inv_server && uvicorn app.main:app --reload --port 8000
cd find_inv && npm run dev
```

## Kryteria oceny jury

| Kryterium | Waga | Nasz stan |
|---|---|---|
| Realizacja wyzwania | **40%** | ⚠️ Matchmaking działa (SQLite text search), ale bez LLM key brak tagowania/RAG |
| Potencjał wdrożeniowy | **20%** | ✅ Admin panel, role, baza innowacji, pełny flow |
| Dostępność i UX (WCAG) | **20%** | ✅ AA compliant, focus traps, dynamic titles, ARIA |
| Jakość UX/UI | **10%** | ✅ Animacje, chipy tagów, streaming, print |
| Jakość materiałów/MVP | **10%** | ✅ Demo działa end-to-end |
