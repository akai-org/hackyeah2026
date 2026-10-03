# findinv — Prompty startowe dla agentów

> Wklej odpowiedni prompt swojemu agentowi AI przed rozpoczęciem pracy.
> Agent powinien zacząć od przeczytania CONTEXT.md i swojej sekcji w AGENTS.md.

---

## 🟥 Agent 1 — Core

```
Jesteś Agentem 1 w projekcie findinv budowanym na hackathonie HackYeah 2026.

Zacznij od przeczytania tych plików z repo:
- CONTEXT.md — pełny kontekst projektu
- AGENTS.md sekcja "Agent 1" — Twoje zadania

Budujesz fundament backendu FastAPI w find_inv_server/. Reszta zespołu czeka na Ciebie.
Pracujesz w dwóch szybkich pushach do gałęzi main.

PUSH 1 — zrób to w ciągu 30 minut:
Pliki do stworzenia w find_inv_server/:
- requirements.txt (zaktualizuj o: sqlalchemy[asyncio] aiosqlite chromadb openai>=1.0)
- app/config.py (settings z python-dotenv, odczyt .env)
- app/database.py (SQLAlchemy async engine, SessionLocal, Base, get_db dependency, SQLite)
- app/models.py (tabele: users, testers, innovations, challenges, innovation_gap_index, search_logs — pełna lista kolumn w AGENTS.md)
- app/main.py (FastAPI app, CORS dla localhost:3000, rejestracja routerów jako zaślepki)
- .env.example (zaktualizuj o nowe zmienne: OPENROUTER_API_KEY, OPENROUTER_MODEL, OPENROUTER_EMBED_MODEL, DATABASE_URL, CHROMA_PATH)

Po skończeniu: PR do main, merge sam bez czekania na review, napisz [DONE] Push 1 w COMMS.md.

PUSH 2 — zrób to w ciągu 90 minut od startu:
Pliki do stworzenia w find_inv_server/app/:
- llm.py (OpenRouter async client przez openai SDK, funkcje chat() i embed())
- embeddings.py (ChromaDB singleton kolekcja "innovations", embed_and_store(), similarity_search())
- utils.py (TAXONOMY_TAGS lista 25 tagów, run_autotagger() — 1 LLM call JSON mode)
- auth.py (get_current_user middleware z cookie/header, require_role() Depends factory)
- routers/auth.py (POST /api/auth/session, POST /api/auth/set-role, GET /api/auth/me)
- data/seed_innovations.py (szkielet z komentarzem TODO dla Agenta 3)

Po skończeniu: PR do main, merge, napisz [DONE] Push 2 w COMMS.md.

Nie piszesz żadnych endpointów domenowych. Nie seedujesz danych.
```

---

## 🟧 Agent 2 — Matchmaking

```
Jesteś Agentem 2 w projekcie findinv budowanym na hackathonie HackYeah 2026.

Zacznij od przeczytania tych plików z repo:
- CONTEXT.md — pełny kontekst projektu
- AGENTS.md sekcja "Agent 2" — Twoje zadania i ustalone decyzje

Budujesz moduł Matchmaking — najważniejszy moduł całej aplikacji (40% oceny jury).
Pracujesz w find_inv_server/app/routers/matchmaking.py.

KROK 1 — zacznij od razu (nie czekaj na nikogo):
Stwórz find_inv_server/app/routers/matchmaking.py z mock responses.
Importuj dane z find_inv_server/data/mock_data.py (plik już jest w repo).
Zaimplementuj 4 endpointy jako mocki:
- POST /api/tag → zwraca MOCK_TAG_RESPONSE
- POST /api/match → zwraca MOCK_INNOVATIONS[:5]
- POST /api/voice-fix → zwraca transcript bez zmian
- POST /api/chat → SSE streaming z hardkodowaną odpowiedzią

Zrób PR z mockami od razu — frontend może integrować bez czekania na Ciebie.

KROK 2 — po [DONE] Push 2 od Agenta 1 w COMMS.md:
Podmień mocki na realne wywołania:
- /api/tag: wywołaj utils.run_autotagger(text), zapisz do search_logs
- /api/chat: pobierz opisy innowacji po ids, wstrzyknij jako RAG context, stream llm.chat()
- /api/voice-fix: 1 LLM call, JSON mode, fix gramatyki po polsku

KROK 3 — po [DONE] seed od Agenta 3 w COMMS.md:
Podmień /api/match:
1. embed(text) → similarity_search(n=50)
2. SELECT innovations WHERE embedding_id IN (ids)
3. score = cosine_score + 0.1 * len(set(innov.tags) & set(query_tags))
4. sort desc, top 5

Ustalone decyzje których nie zmieniasz:
- Tagi tylko z TAXONOMY_TAGS z app/utils.py
- 5 kart, ranking cosine + tag boost
- is_relevant: false → zwracasz tylko flagę, komunikat robi frontend
- is_unmaintained: true gdy status="unmaintained" w DB
- Historia chatu: frontend trzyma w stanie, Ty dostajesz pełne messages[] każdorazowo

Po każdym działającym endpoincie: PR + [DONE] w COMMS.md.
```

---

## 🟨 Agent 3 — Knowledge & Data

```
Jesteś Agentem 3 w projekcie findinv budowanym na hackathonie HackYeah 2026.

Zacznij od przeczytania tych plików z repo:
- CONTEXT.md — pełny kontekst projektu
- AGENTS.md sekcja "Agent 3" — Twoje zadania

Budujesz seed danych ROPS i moduł Knowledge Base.
Bez Twoich danych Matchmaking (Agent 2) zwraca mocki — Twój seed ich odblokuje.

KROK 1 — zacznij od razu (nie potrzebujesz DB):
Sparsuj pliki z find_inv_server/data/rops_raw/ do find_inv_server/data/parsed_innovations.json.
Wyciągnij pola: title, short_desc, full_desc, category, area, target_group,
location, cost_level, implementation_time_months, testers_count,
where_implemented, source_url.
Rób to lokalnie, bez commita.

KROK 2 — po [DONE] Push 1 od Agenta 1 w COMMS.md:
Uzupełnij find_inv_server/data/seed_innovations.py (szkielet już jest w repo):
1. Wczytaj parsed_innovations.json
2. Wywołaj utils.run_autotagger() dla każdej innowacji → zapisz tagi
3. INSERT do tabeli innovations
4. embed_and_store(str(id), title+" "+short_desc+" "+full_desc, metadata)
Uruchom: python -m data.seed_innovations
Napisz [DONE] seed w COMMS.md — to odblokuje Agenta 2.

KROK 3 — równolegle pisz find_inv_server/app/routers/knowledge.py z mockami:
Importuj z find_inv_server/data/mock_data.py, po seedzie podmień na SELECT z DB.

Endpointy do zbudowania:
- GET /api/innovations?search=&tags=&category=&area=&status=&limit=20&offset=0
- GET /api/innovations/{id}
- GET /api/challenges?powiat=&area=
- GET /api/challenges/map → [{ powiat, challenges[], gap_index }]
- GET /api/stats/malopolska → możesz zostawić MOCK_STATS_MALOPOLSKA, dane statyczne
- GET /api/gmina-pulse/{powiat} → top 3 wyzwania + 3 pasujące innowacje (similarity_search)
- GET /api/innovation-gap → [{ powiat, gap_score, top_area, innovations_count }]

Po każdym działającym endpoincie: PR + [DONE] w COMMS.md.
```

---

## 🟩 Agent 4 — Frontend: Kreator + Tester + Forum + Auth

```
Jesteś Agentem 4 w projekcie findinv budowanym na hackathonie HackYeah 2026.

Zacznij od przeczytania tych plików z repo:
- CONTEXT.md — pełny kontekst projektu
- AGENTS.md sekcja "Agent 4" — Twoje zadania
- find_inv/AGENTS.md — zasady Next.js w tym projekcie

Pracujesz wyłącznie w find_inv/ (Next.js). Nie piszesz backendu.

KROK 1 — zacznij od razu:
Zbuduj shared auth w find_inv/lib/auth.ts:
- Hook useAuth() pobierający GET /api/auth/me przy starcie
- Trzyma usera (id, name, role) w React context
- Przycisk "Zaloguj się" w navbarze → modal z wyborem roli:
  [Mieszkaniec] [Tester] [Konsultant] [Admin]
- Po kliknięciu: POST /api/auth/session { name: "Gość", role: "..." }
- Zapisz session_token w cookie "session"
- Badge z rolą widoczny w navbarze po zalogowaniu

KROK 2 — strony mock (hardkodowane dane, zero backendu):

/kreator — kreator pomysłów:
- Textarea "Opisz swój pomysł społeczny"
- Klikalne chipy tagów (z TAXONOMY_TAGS)
- Przycisk "Analizuj" → fake loading 1.5s → wyświetla kartę fiszki z hardkodowanymi polami
- Pola fiszki: tytuł, istota pomysłu, dla kogo, etap realizacji

/testerzy — zgłoszenie testera:
- Strona informacyjna "Zostań testerem innowacji"
- Formularz: imię, email, organizacja, specjalizacja
- Po submit: toast "Zgłoszenie wysłane, admin je rozpatrzy"
- Dane nigdzie nie idą (state lokalny)

/forum — forum dyskusyjne:
- Lista wątków z MOCK_FORUM_POSTS (przepisz z mock_data.py na TypeScript)
- Badge'e ról przy każdym poście: user / tester / admin / konsultant
- Textarea do dodawania posta → dodaje do lokalnego state (fake)
- Nie woła backendu

Utwórz find_inv/data/mock.ts z typescriptowymi wersjami danych z find_inv_server/data/mock_data.py.

Po każdej gotowej stronie: PR + [DONE] w COMMS.md.
```

---

## 🟦 Agent 5 — Admin Panel + Middleman AI

```
Jesteś Agentem 5 w projekcie findinv budowanym na hackathonie HackYeah 2026.

Zacznij od przeczytania tych plików z repo:
- CONTEXT.md — pełny kontekst projektu
- AGENTS.md sekcja "Agent 5" — Twoje zadania

Budujesz panel admina (backend + frontend) oraz Middleman AI.
Jury zaloguje się jako admin i będzie klikać po panelu — musi działać.

KROK 1 — zacznij od razu (admin backend z mock auth):
Stwórz find_inv_server/app/routers/admin.py.
Tymczasowy auth do czasu Push 2 od Agenta 1: sprawdzaj header X-Dev-Admin: true.
Po [DONE] Push 2 w COMMS.md: zamień na Depends(require_role("admin")).

Endpointy admina:
- GET  /api/admin/innovations?status=&tags=&search=
- POST /api/admin/innovations/{id}/approve → UPDATE status="active"
- POST /api/admin/innovations/{id}/archive → UPDATE status="archived"
- POST /api/admin/innovations/{id}/flag-unmaintained → UPDATE status="unmaintained"
- GET  /api/admin/users
- POST /api/admin/users/{id}/set-role   body: { "role": "tester"|"consultant"|"user" }
- GET  /api/admin/testers?approved=false
- POST /api/admin/testers/{id}/approve (UPDATE testers + UPDATE users SET role="tester")
- GET  /api/admin/trends → top tagi i zapytania z search_logs
- GET  /api/admin/stats → COUNT z każdej tabeli

KROK 2 — admin frontend w find_inv/app/admin/:
Strony wołają powyższe endpointy, wyświetlają realne dane.
Dostęp tylko dla zalogowanych z rolą "admin" (sprawdź przez useAuth()).

/admin/innowacje — tabela innowacji z przyciskami Zatwierdź/Archiwizuj/Nieaktywna
/admin/uzytkownicy — lista użytkowników, dropdown zmiany roli, "Zatwierdź testera"
/admin/trendy — wykresy (recharts): top tagi, zapytania per dzień
/admin/statystyki — duże liczniki: innowacje, użytkownicy, testerzy, wyszukiwania

KROK 3 — Middleman (zacznij mock, podmień po Push 2 od Agenta 1):
Stwórz find_inv_server/app/routers/middleman.py.

Mock (od razu):
- POST /api/middleman/start → hardkodowane pierwsze pytanie
- POST /api/middleman/answer → SSE z hardkodowanym planem JSON

Po [DONE] Push 2 od Agenta 1, podmień na real LLM:
- /api/middleman/start: pobierz innowację z DB, 1 LLM call → pierwsze pytanie
- /api/middleman/answer SSE: MAX 3 pytania, potem finalny plan:
  { staff_needed, estimated_cost, location_suggestions, steps[], timeline, funding_hints }
  
System prompt Middlemana:
"Jesteś ekspertem od wdrażania innowacji społecznych w Polsce. Znasz realia małych gmin,
OPS i NGO. Zadajesz MAX 3 krótkie pytania zanim dajesz konkretny plan w formacie JSON.
Bądź praktyczny i konkretny — podaj realne koszty, źródła finansowania (PFRON, FIO, EFS+)."

Po każdym działającym endpoincie / stronie: PR + [DONE] w COMMS.md.
```
