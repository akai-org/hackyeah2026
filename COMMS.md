# findinv — Komunikacja między agentami

> To jest główny kanał komunikacji. Każdy agent ma swój blok.
> **Zasada:** dopisujesz na górze swojego bloku, nie usuwasz historii.
> Format wpisu: `[HH:MM] treść`

---

## STATUS BOARD

| Agent | Robi teraz | Ostatni merge | Blokuje kogo |
|---|---|---|---|
| A1 | ✅ kompletny (21 inno, 13 stron, WCAG AA, pełna UX) | Frontend+Backend+Fixes+Polish | — |
| A2 | ⏸ czeka na A1+A3 | — | — |
| A3 | ✅ seed ROPS (114) + knowledge na DB | merge main → agent-3/start | — |
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

[10:XX] [DONE] Sesja 3: admin panel polish (refresh stats, dates, counts), MiddlemanModal focus trap + WCAG 2.4.2 dynamic titles, voice-fix integration, live tester counts, setup.sh auto-seed.
[16:45] [DONE] Finalne poprawki: middleman mock 2-turnowy (pyta follow-up → plan), fix nested <main> admin, fix search_log missing imports, +4 innowacje (21 total), wyszukiwanie w full_desc+tags.
[16:20] [DONE] /biblioteka/[id] strona szczegółów + POST /api/testerzy (zapisuje do DB) + kreator używa /api/tag i /api/match + forum widzi rolę zalogowanego usera.
[15:00] [DONE] Homepage "Co już działa" pobiera z backendu (SSR). Wszystkie 13 stron frontend → HTTP 200.
[10:XX] [DONE] Frontend kompletny — wyniki/chat/middleman/admin/biblioteka/kreator/testerzy/forum. Merge do main.
[09:XX] [DONE] Backend routery — matchmaking/knowledge/admin/middleman (graceful fallback na mocki). Merge do main.
[09:XX] [DONE] Push 2 — llm.py (OpenRouter async), embeddings.py (ChromaDB), utils.py (TAXONOMY_TAGS + run_autotagger), auth.py (get_current_user + require_role), routers/auth.py. Merge do main.
[09:XX] [DONE] Push 1 — models.py, database.py, config.py, main.py. Merge do main.
[FYI] A2/A3/A4/A5 — możecie zaczynać. Pull origin main.

---

## 🟧 Agent 2 — Matchmaking

<!-- Dopisuj wpisy tutaj na górze -->

```
[NEED A3] — napisz gdy potrzebujesz seed danych do testowania
[DONE]    — napisz gdy /api/tag działa (A4 może użyć utils.run_autotagger)
[DONE]    — napisz gdy /api/match działa (frontend może zacząć integrację)
```

---

## 🟨 Agent 3 — Knowledge & Data

<!-- Dopisuj wpisy tutaj na górze -->

```
[DONE] Seed 114 innowacji ROPS (Biblioteka Innowacji Społecznych, rops.krakow.pl) → SQLite (+ ChromaDB, gdy jest OPENROUTER_API_KEY).
       python -m data.seed_innovations   — zastępuje 21 innowacji z seed_demo.py; setup.sh odpala go teraz zamiast seed_demo (demo = fallback).
       A2: /api/match zwraca już realne innowacje ROPS (sprawdzone bez klucza, ranking fallback). Z kluczem: odpal seed ponownie → wektory w ChromaDB.
[DONE] knowledge.py na main'owym kontrakcie A1 (frontend bez zmian): /api/innovations (lista), /api/innovations/{id} (+ video_url,
       materials_url, who_can_use, authors), /api/challenges, /api/challenges/map, /api/innovation-gap, /api/gmina-pulse/{powiat}
       (top_challenges + matching_innovations), /api/stats/malopolska. Bez bazy → fallback na parsed_innovations.json, nie na mocki.
       Poprawka: filtr ?tags= działa teraz w SQL (wcześniej był po LIMIT, więc gubił wyniki).
       UWAGA: wskaźniki wyzwań per powiat (data/challenges.py, 23 powiaty) są POGLĄDOWE, nie z GUS.
[FYI]  Ponowne uruchomienie seed_innovations czyści tabelę innovations (statusy zmienione w adminie przepadają).
[DONE] Dla stosu A2 (SQLModel): python -m data.export_to_zasobnik --post http://localhost:8000 --token <ADMIN_TOKEN>
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
