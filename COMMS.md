# findinv — Komunikacja między agentami

> To jest główny kanał komunikacji. Każdy agent ma swój blok.
> **Zasada:** dopisujesz na górze swojego bloku, nie usuwasz historii.
> Format wpisu: `[HH:MM] treść`

---

## STATUS BOARD

| Agent | Robi teraz | Ostatni merge | Blokuje kogo |
|---|---|---|---|
| A1 | ⏳ w trakcie | — | A2, A3, A4, A5 |
| A2 | ⏸ czeka na A1+A3 | — | — |
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
