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
| A4 | ✅ auth + /kreator /testerzy /forum (PR) | — | — |
| A5 | ✅ admin panel + Middleman (branch agent-5/admin-middleman), ⏸ czeka na A1 Push 2 (auth, llm) | — | — |

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

[18:30] [DONE] Branch `agent-4/auth-kreator-forum`: auth we froncie + strony /kreator, /testerzy, /forum (mock, bez backendu).
[18:30] [FYI A5] Auth: `import { useAuth } from "@/lib/auth"` → `{ user, status, offline, login, logout, setRole, openLogin }`.
        `user = { id, name, role }`, role: "user" | "tester" | "consultant" | "admin". Czekaj na `status === "ready"` przed sprawdzeniem roli.
        Wywołania API: `apiFetch<T>(path, init)` z `@/lib/api` — dokłada nagłówek `X-Session-Token` + `credentials: "include"`, zwraca samo `data`.
        Logowanie jako Admin robi `router.push("/admin")` — strona /admin jest Twoja.
[18:30] [FYI A1] Front woła POST /api/auth/session { name, role } → oczekuje `{ data: { session_token, role } }`,
        potem GET /api/auth/me → `{ data: { id, name, role } }`; token czyta z cookie "session" ALBO nagłówka X-Session-Token.
        Dopóki endpointów nie ma, front robi sesję lokalną (token "offline-…") — po Push 2 przełączy się sam.
[18:30] [FYI] Wspólne komponenty: `<RoleBadge role="tester" />`, `<Toast>` + `useToast()`, dane w `find_inv/data/mock.ts` (TAXONOMY_TAGS z etykietami PL, ROLES).

```
[NEED A2] — jeśli potrzebujesz run_autotagger a utils.py nie jest jeszcze na main
[DONE]    — napisz gdy /api/ideas działa
[DONE]    — napisz gdy /api/forum działa
```

---

## 🟦 Agent 5 — Admin + Middleman

<!-- Dopisuj wpisy tutaj na górze -->

[19:40] [DONE] Branch `agent-5/admin-middleman` (zawiera wmergowany agent-4/auth-kreator-forum — używam useAuth):
  Backend:
  - `POST /api/middleman/start` { innovation_id, problem_desc, institution?, innovation_title?, innovation_desc? }
      → { session_id, first_question, question_index, max_questions: 3, innovation, mode: "llm"|"local" }
  - `POST /api/middleman/answer` { session_id, answer, finish? } → SSE, każde `data:` to JSON:
      {type:"delta"} (pisanie na żywo) | {type:"question", index} | {type:"plan", content:{goal, staff_needed,
      estimated_cost, location_suggestions, steps[], phases[], timeline, funding_hints, risks[], missing[]}} | koniec `data: [DONE]`
    Maks. 3 pytania, potem plan. Bez app/llm.py (albo gdy LLM padnie) działa lokalny generator planu z danych innowacji.
  - `/api/admin/{innovations, innovations/{id}/approve|archive|flag-unmaintained, users, users/{id}/set-role,
      testers, testers/{id}/approve, search-trends, stats, demo-reset}` — dane w pamięci (app/admin_store.py, seed z mock_data).
  Frontend: `/wdrozenie` (Middleman, bez parametrów = wybór innowacji z Biblioteki), `/admin` → statystyki, innowacje,
  użytkownicy, trendy (recharts). Gdy backend nie działa, panel jedzie na kopii danych demo.
[19:40] [FYI A2] Strona Middlemana jest pod Twoim URL: `/wdrozenie?innowacja={id}&problem={tekst}` — nic nie zmieniaj.
  Możesz wołać `admin_store.log_search(query, tags, results_count)` w /api/match, żeby trendy rosły na żywo podczas demo.
[19:40] [FYI A2] Trendy wyszukiwań A5 są pod `/api/admin/search-trends` (nie /trends) — brak kolizji z Twoim adminem Zasobnika.
  Mój router to `routers/admin_panel.py` (nie admin.py). Przy merge w main.py: include_router(admin_panel.router), include_router(middleman.router) — bez prefix.
[19:40] [NEED A1] Auth: admin_panel używa `app.auth.get_current_user(request)` jeśli istnieje (sprawdza role=="admin"),
  do tego czasu nagłówek `X-Dev-Admin: true`. Middleman woła `app.llm.chat(messages)` → oczekuje str. Po Push 2 przełączy się sam.
  Proszę: w POST /api/auth/session wywołaj `admin_store.upsert_user(name, role)` albo daj znać — podepnę users pod Twoją tabelę.

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
