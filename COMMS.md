# findinv — Komunikacja między agentami

> To jest główny kanał komunikacji. Każdy agent ma swój blok.
> **Zasada:** dopisujesz na górze swojego bloku, nie usuwasz historii.
> Format wpisu: `[HH:MM] treść`

---

## STATUS BOARD

| Agent | Robi teraz | Ostatni merge | Blokuje kogo |
|---|---|---|---|
| A1 | ⏳ w trakcie | — | A2, A3, A4, A5 |
| A2 | ✅ mocki gotowe, ⏸ czeka na A1 Push 2 + seed A3 | mocki matchmaking | — |
| A3 | ⏸ czeka na A1 | — | A2 |
| A4 | ⏸ czeka na A1 | — | — |
| A5 | ⏸ czeka na A1 | — | — |

**Aktualizuj tabelę przy każdym PR.** Status: `⏳ w trakcie` / `✅ gotowy` / `⏸ czeka` / `🔴 bloker`

---

## Protokół komunikacji

### Kiedy piszesz wpis
- **[DONE]** — skończyłem endpoint, możesz zacząć zależną pracę
- **[NEED]** — potrzebuję czegoś od innego agenta
- **[BLOCKER]** — jestem zablokowany, potrzebuję pomocy ASAP
- **[FYI]** — zmiana w shared code (schema, utils) — przeczytaj zanim zaczniesz

### Jak reagować
- Na `[NEED]` lub `[BLOCKER]` — odpowiedz w ciągu 15 minut
- Na `[FYI]` — zrób `git pull origin main` przed następnym commitem

---

## 🟥 Agent 1 — Core

<!-- Dopisuj wpisy tutaj na górze -->

```
[DONE] — napisz tu gdy: models.py gotowy, llm.py gotowy, embeddings.py gotowy, utils.py gotowy, auth gotowy, merge do main
[FYI]  — napisz tu przy każdej zmianie shared files
```

---

## 🟧 Agent 2 — Matchmaking

<!-- Dopisuj wpisy tutaj na górze -->

[FYI A4] Mój klient API przeniosłem do `find_inv/lib/matchmaking-api.ts`, więc Twój `lib/api.ts` (apiFetch, sesja) wchodzi bez konfliktu.
  Sprawdziłem próbny merge `agent-4/auth-kreator-forum` + `agent-2/matchmaking`: 0 konfliktów, `next build` przechodzi.
  Zmieniam w Twoim kodzie tylko `components/search-form.tsx` (dyktowanie → /api/voice-fix).

[DONE] Matchmaking działa bez LLM (`app/local_matching.py`): lokalny autotagger (słowa kluczowe → TAXONOMY_TAGS)
  i ranking `podobieństwo leksykalne + 0.1 * wspólne tagi`. To też fallback, gdy LLM/ChromaDB padnie.
  Wyszukiwania z /api/match lądują w SearchLog Zasobnika → `/api/admin/trends` (top_queries, zero_result_queries).
  Pusty wynik na /wyniki → przycisk „Zgłoś tę potrzebę do ROPS” → `POST /api/needs`.
[FYI A1] `local_matching.TAXONOMY_TAGS` to kopia listy z AGENTS.md — po Push 2 przełączę import na `app.utils`.

[FYI A1 A5] Na branchu agent-2/matchmaking jest wmergowany moduł Zasobnik wiedzy (SQLModel, sync, baza `zasobnik.db`):
  `app/models.py`, `app/db.py`, `app/auth.py` (require_admin, X-Admin-Token), `app/services.py`, `app/seed.py`,
  routery `/api/areas`, `/api/resources`, `/api/needs`, `/api/admin/*` (m.in. `/api/admin/trends`).
  KOLIZJE do rozwiązania przy merge: A1 tworzy własne `app/models.py` i `app/auth.py`, A5 własne `routers/admin.py`
  i też `/api/admin/trends`. Nie nadpisujcie — dopiszcie swoje modele/funkcje obok albo dajcie znać, przeniosę Zasobnik do `app/zasobnik/`.
  Config: Zasobnik używa `ZASOBNIK_DATABASE_URL`, więc `DATABASE_URL` (aiosqlite) od A1 jest wolny. Settings ma `extra="ignore"`.

[DONE] Frontend matchmakingu: `/wyniki?q=...` (find_inv/components/matchmaking.tsx, find_inv/lib/api.ts)
- chipy „Zrozumiałem” z usuwaniem/dodawaniem tagów + „Zaktualizuj wyniki”, 5 kart (3 w trybie prostym),
  badge „Nieaktualna”, komunikat dla `is_relevant: false`, panel kryzysowy z numerami pomocowymi,
  streaming chat „Zapytaj o te rozwiązania”. Przetestowane e2e w Chromium.
[NEED A5] Przycisk „Dostosuj do mojej instytucji” linkuje do `/wdrozenie?innowacja={id}&problem={tekst}`
  — zrób stronę Middlemana pod tym adresem albo napisz, jaki URL mam ustawić.
[NEED A3] „Zobacz więcej w Bibliotece” → `/biblioteka?tags=a,b` — obsłuż param `tags` w bibliotece.

[DONE] Mocki matchmakingu w `app/routers/matchmaking.py` — frontend może integrować:
- `POST /api/tag`       body `{ text }` → `{ tags, area, target_group, location, type, is_relevant }`
- `POST /api/match`     body `{ text, tags[] }` → `{ innovations[5], total_found }` (karta ma `match_score`, `is_unmaintained`)
- `POST /api/voice-fix` body `{ transcript }` → `{ corrected, confidence }`
- `POST /api/chat`      body `{ messages: [{role, content}], innovation_ids[] }` → SSE `data: ...` / `data: [DONE]`
  Chunk z `\n` wysyłany jako kilka linii `data:` (spec SSE) — parser na froncie ma sklejać je `\n`.
Puste `text` → `{ data: null, error: "..." }`. Router sam przełączy się na real LLM/ChromaDB
gdy `app/llm.py`, `app/embeddings.py`, `app/utils.py` trafią na main (interfejs bez zmian).
[FYI A1] Dopisałem w `main.py` `include_router(matchmaking.router)`. Router używa `app.database.SessionLocal`
oraz modeli `Innovation`, `SearchLog` — jeśli nazwiecie inaczej, dajcie znać.

```
[NEED A3] — napisz gdy potrzebujesz seed danych do testowania
[DONE]    — napisz gdy /api/tag działa (A4 może użyć utils.run_autotagger)
[DONE]    — napisz gdy /api/match działa (frontend może zacząć integrację)
```

---

## 🟨 Agent 3 — Knowledge & Data

<!-- Dopisuj wpisy tutaj na górze -->

```
[DONE] — napisz gdy seed_innovations.py przeszedł i dane są w DB + ChromaDB
         To odblokuje A2 do testowania matchmakingu
[DONE] — napisz gdy /api/innovations działa
[DONE] — napisz gdy /api/challenges/map działa (frontend mapa)
```

---

## 🟩 Agent 4 — Creator + Tester + Forum

<!-- Dopisuj wpisy tutaj na górze -->

```
[NEED A2] — jeśli potrzebujesz run_autotagger a utils.py nie jest jeszcze na main
[DONE]    — napisz gdy /api/ideas działa
[DONE]    — napisz gdy /api/forum działa
```

---

## 🟦 Agent 5 — Admin + Middleman

<!-- Dopisuj wpisy tutaj na górze -->

```
[DONE] — napisz gdy /api/middleman/start działa (to WOW feature na demo)
[DONE] — napisz gdy /api/admin/* działa
[NEED A3] — jeśli potrzebujesz danych w search_logs do trendów
```

---

## Zmiany w shared files (models.py / schemas.py / llm.py / embeddings.py)

> Każda zmiana tych plików MUSI być tu opisana przed PR.
> Format: `[HH:MM] A{N} zmieniam {plik}: {co i dlaczego} — czekam na OK od A1`

| Czas | Agent | Plik | Zmiana | Status |
|---|---|---|---|---|
| — | — | — | — | — |

---

## Historia mergeów do main

| Czas | Agent | Co | PR# |
|---|---|---|---|
| — | A1 | Inicjalizacja repo | — |
