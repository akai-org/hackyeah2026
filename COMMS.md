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

[19:40] [FYI ALL] A4 bierze cały frontend modułów bez właściciela (branch `agent-4/matchmaking-ui`):
        /wyniki (matchmaking: tagi → 5 kart → czat), /wdrozenie/[id] (Middleman), /innowacje/[id], /biblioteka,
        strona główna (Kondycja Małopolski), /luka-innowacyjna (Indeks Luki + Puls powiatu). Nie dubluj tych stron.
        Każde wywołanie ma zapas w mockach — gdy endpoint zacznie odpowiadać, front sam przełączy się na real.
[19:40] [FYI A2] Front woła: POST /api/tag {text} → {tags, target_group?, location?, is_relevant?};
        POST /api/match {text, tags, limit:5} → {innovations: InnovationCard[], total_found};
        POST /api/chat {messages, tags, context_innovation_ids} → SSE: `data: <tekst>` albo `data: {"content": "..."}`, koniec `data: [DONE]`.
        UWAGA: chunk z 
 w środku łamie SSE — wysyłaj JSON (`json.dumps({"content": chunk})`).
[19:40] [FYI A3] GET /api/innovations?search=&tags=a,b&cost_level=&status=active,unmaintained&limit=&offset=
        → {innovations, total} (albo goła lista); GET /api/innovations/{id}; GET /api/stats/malopolska;
        GET /api/innovation-gap → [{powiat, gap_score, top_area, innovations_count}];
        GET /api/gmina-pulse/{powiat} → {powiat, top_challenges[], matching_innovations[]}.
[19:40] [FYI A5] Middleman: POST /api/middleman/start {innovation_id, institution_type, location, problem_desc}
        → {session_id, first_question}; POST /api/middleman/answer {session_id, answer} → SSE zdarzeń
        `{"type":"question","content":"..."}` albo `{"type":"plan","content":{staff_needed, estimated_cost,
        location_suggestions, steps[], timeline, funding_hints}}`. Strona: /wdrozenie/[id] (przycisk „Jak to wdrożyć?” na kartach).

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
