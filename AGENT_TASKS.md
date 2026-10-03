# Runda 2 — zadania dla 4 agentów Claude Code

> 4 komputery, na każdym jeden agent na swoim branchu. Agent sam commituje, pushuje i otwiera PR do `main`.

---

## Jak odpalić — 4 komputery, 1 agent na komputer

| Komputer | Agent | Branch |
|---|---|---|
| 1 | 🟥 A1 — UX / a11y / strona główna | `agent-1/ux-a11y` |
| 2 | 🟧 A2 — Kreator / AI / generator wniosków | `agent-2/kreator-ai` |
| 3 | 🟨 A3 — Karta / wyszukiwarka / testerzy / forum | `agent-3/karta-forum` |
| 4 | 🟦 A4 — Admin / CMS / deploy | `agent-4/admin-cms` |

### Krok 0 — RAZ, na jednym komputerze (zanim inni zaczną)

Ten plik musi być na `main`, żeby pozostali go mieli:

```bash
cd ~/HackYeah/hackyeah2026
git checkout main && git pull origin main
git add AGENT_TASKS.md && git commit -m "docs: zadania dla agentów — runda 2" && git push origin main
```

### Krok 1 — na KAŻDYM komputerze: wymagania (jednorazowo, jeśli czegoś brakuje)

Sprawdź, czy działa (każda komenda ma wypisać wersję / „Logged in”):

```bash
git --version && node --version && python3 --version && gh auth status && claude --version
```

Czego brakuje — doinstaluj:
- **Claude Code:** `npm install -g @anthropic-ai/claude-code`, potem `claude` i zaloguj się.
- **GitHub CLI:** `brew install gh` (Windows: `winget install GitHub.cli`), potem `gh auth login` (GitHub.com → SSH lub HTTPS → przeglądarka).
- Dostęp do repo `akai-org/hackyeah2026` (push) — test: `git ls-remote git@github.com:akai-org/hackyeah2026.git`.

### Krok 2 — na KAŻDYM komputerze: JEDNA komenda (reszta dzieje się sama)

Wklej blok swojego komputera do terminala, w miejsce `WKLEJ_KLUCZ` wpisz klucz OpenRouter zespołu i wciśnij Enter.
Odpalasz w folderze repo, będąc na spullowanym `main`. Komenda odpala Claude'a na pełnym autopilocie.
Dalej **Claude sam** zakłada swój branch, robi setup (`setup.sh`, `.env`), wykonuje zadania, commituje, pushuje
i otwiera PR. Przy pierwszym uruchomieniu z `--dangerously-skip-permissions` Claude raz pyta o potwierdzenie,
potem już o nic.

**🟥 Komputer 1 — Agent 1**
```bash
export OPENROUTER_API_KEY=WKLEJ_KLUCZ; claude --dangerously-skip-permissions "Jesteś Agentem 1. Przeczytaj AGENT_TASKS.md: sekcje 'Zasady wspólne' i 'Agent 1'. Zacznij od kroku 0 z 'Zasad wspólnych' (branch agent-1/ux-a11y + setup), potem wykonaj wszystkie zadania Agenta 1 do końca: commity, pushe, PR. Nie zadawaj pytań, nie czekaj na mnie."
```

**🟧 Komputer 2 — Agent 2**
```bash
export OPENROUTER_API_KEY=WKLEJ_KLUCZ; claude --dangerously-skip-permissions "Jesteś Agentem 2. Przeczytaj AGENT_TASKS.md: sekcje 'Zasady wspólne' i 'Agent 2'. Zacznij od kroku 0 z 'Zasad wspólnych' (branch agent-2/kreator-ai + setup), potem wykonaj wszystkie zadania Agenta 2 do końca: commity, pushe, PR. Nie zadawaj pytań, nie czekaj na mnie."
```

**🟨 Komputer 3 — Agent 3**
```bash
export OPENROUTER_API_KEY=WKLEJ_KLUCZ; claude --dangerously-skip-permissions "Jesteś Agentem 3. Przeczytaj AGENT_TASKS.md: sekcje 'Zasady wspólne' i 'Agent 3'. Zacznij od kroku 0 z 'Zasad wspólnych' (branch agent-3/karta-forum + setup), potem wykonaj wszystkie zadania Agenta 3 do końca: commity, pushe, PR. Nie zadawaj pytań, nie czekaj na mnie."
```

**🟦 Komputer 4 — Agent 4**
```bash
export OPENROUTER_API_KEY=WKLEJ_KLUCZ; claude --dangerously-skip-permissions "Jesteś Agentem 4. Przeczytaj AGENT_TASKS.md: sekcje 'Zasady wspólne' i 'Agent 4'. Zacznij od kroku 0 z 'Zasad wspólnych' (branch agent-4/admin-cms + setup), potem wykonaj wszystkie zadania Agenta 4 do końca: commity, pushe, PR. Nie zadawaj pytań, nie czekaj na mnie."
```

> Windows: odpal w **Git Bash** (nie PowerShell) — wtedy komenda działa bez zmian.
> `--dangerously-skip-permissions` = agent sam odpala komendy i pushuje bez pytania. Działa tylko na swoim branchu
> i nie merguje do `main`, ale nie zostawiaj na tym komputerze niczego, czego nie chcesz ryzykować.

### W trakcie i po

- Postęp widać w PR-ach: `gh pr list` (każdy agent ma draft PR z checkboxami) i w `COMMS.md` na `main`/branchach.
- Gdy sesja się urwie: `claude --continue` w tym samym katalogu wznawia pracę.
- Agent kończy `gh pr ready` i **nie merguje**. Merge robi człowiek, w kolejności: **A1 → A3 → A2 → A4**
  (A1 ma wspólny dialog, A3 zmiany w `models.py`). Po każdym merge'u pozostali agenci sami rebase'ują się na `origin/main`.

---

## Zasady wspólne (dla każdego agenta)

0. **Start (automatycznie, bez pytania):**
   - Upewnij się, że jesteś na aktualnym `main`: `git checkout main && git pull origin main`.
   - Załóż swój branch z sekcji agenta: `git checkout -b <branch>` (jeśli już istnieje lokalnie lub na `origin` —
     `git checkout <branch>` i `git pull --rebase origin <branch>`, kontynuujesz pracę).
   - Setup: jeśli brak `find_inv/node_modules` lub `find_inv_server/.venv` → `bash setup.sh` (bez argumentu!
     jeśli seed ROPS padnie bez klucza — idź dalej).
   - `.env`: jeśli `find_inv_server/.env` nie istnieje → `cp find_inv_server/.env.example find_inv_server/.env`.
     Jeśli zmienna środowiskowa `OPENROUTER_API_KEY` jest ustawiona — wpisz ją do `.env` (`OPENROUTER_API_KEY=...`)
     i ustaw `OPENROUTER_MODEL=anthropic/claude-haiku-4.5`. **Nigdy nie commituj `.env` ani klucza.**
   - Sprawdź `gh auth status`. Jeśli niezalogowany — pracuj dalej, pushuj gitem, a na końcu wypisz link
     `https://github.com/akai-org/hackyeah2026/pull/new/<branch>` zamiast tworzyć PR.
1. **Kontekst:** przeczytaj `AGENTS.md`, `COMMS.md`, `STATUS.md`, `CONTEXT.md`. Obowiązuje format odpowiedzi
   FastAPI `{ "data": ..., "error": null }` i SSE `data: ...\n\n` / `data: [DONE]\n\n`.
2. **Dane do testów:** `cd find_inv_server && source .venv/bin/activate && python -m data.seed_innovations`.
3. **Własność plików:** zmieniaj tylko pliki ze swojej sekcji „Pliki”. Jeśli musisz dotknąć cudzego pliku —
   minimalna zmiana + wpis w `COMMS.md` `[FYI A{N}]`. `models.py`, `llm.py`, `embeddings.py` — tylko z wpisem w `COMMS.md`.
4. **Nie pytaj użytkownika.** Gdy coś jest niejasne — podejmij rozsądną decyzję, zapisz ją w opisie PR i w `COMMS.md`.
5. **Rytm pracy — jedno zadanie = jeden commit:**
   - Po każdym skończonym zadaniu z listy: weryfikacja → `git add` konkretnych plików → commit → `git push`.
   - Commit: conventional commits po polsku, np. `feat(kreator): obsługa plików PDF`. Każdy commit kończy linia:
     `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`
   - Po **pierwszym** pushu: `git push -u origin <branch>` i `gh pr create --draft --base main` z opisem
     (lista zadań jako checkboxy). Kolejne pushe aktualizują ten PR — zaznaczaj odhaczone checkboxy (`gh pr edit`).
   - Opis PR kończy linia: `🤖 Generated with [Claude Code](https://claude.com/claude-code)`
6. **Weryfikacja przed każdym commitem** (to, co dotyczy zmienionych plików):
   - frontend: `cd find_inv && npm run lint && npm run build`
   - backend: `cd find_inv_server && source .venv/bin/activate && pytest -q`
   - nowy endpoint: odpal `fastapi dev app/main.py` i sprawdź go `curl`em.
   Nie commituj czerwonego builda. Jeśli test padał już na `main` — zanotuj w PR, nie naprawiaj cudzego.
7. **Synchronizacja z main:** co ~3 commity i przed zakończeniem: `git fetch origin && git rebase origin/main`,
   rozwiąż konflikty (zachowaj zmiany obu stron), ponowna weryfikacja, `git push --force-with-lease`.
8. **COMMS.md:** na starcie wpis w swoim bloku `[HH:MM] A{N} start: <branch>`, po każdym większym kawałku `[DONE] ...`.
9. **Koniec:** wszystkie zadania odhaczone → rebase na `origin/main` → zielony build i testy →
   `gh pr ready` → wpis `[DONE] runda 2` w `COMMS.md`. **Nie merguj PR samodzielnie.**
   Na koniec wypisz podsumowanie: co zrobione, co pominięte i dlaczego, link do PR.
10. Teksty w UI po polsku. Bez wymyślonych danych/statystyk prezentowanych jako prawdziwe.

---

## 🟥 Agent 1 — UX, dostępność, strona główna

**Branch:** `agent-1/ux-a11y`
**Pliki:** `find_inv/app/layout.tsx`, `find_inv/app/page.tsx`, `find_inv/app/globals.css`,
`find_inv/components/site-header.tsx`, `site-footer.tsx`, `components/ui/*` (dialog/modal), `powiat-map.tsx`,
`innovation-of-the-day.tsx`, `featured-innovations.tsx`, `find_inv/app/wyzwania/`, nowa `find_inv/app/edukacja/`;
usuwane: `app/test-krojow/`, `app/konto/`, `app/testerzy/`.

**Najpierw (inni od tego zależą):** zadanie 1 — zmerguj/pushnij szybko i wpisz `[FYI ALL]` w `COMMS.md`.

1. **Wspólny dialog/modal** w `components/ui/`: klik w zblurowane tło zamyka, `Esc` zamyka, focus trap,
   Tab dochodzi do przycisku zamknięcia (z `aria-label="Zamknij"`), focus wraca na element otwierający.
   Podmień istniejące popupy na ten komponent tam, gdzie to jedna linijka importu; resztę opisz w `COMMS.md`
   dla A2/A3 (modale Middlemana i testera należą do nich).
2. **Sticky header** + link **„Przejdź do treści”** (skip link widoczny przy focusie, cel `#main`).
3. **Smooth scroll** dla linków-kotwic na stronie głównej (`scroll-behavior: smooth` + `scroll-margin-top`
   pod wysokość sticky headera), z wyłączeniem przy `prefers-reduced-motion`.
4. **Kolejność sekcji strony głównej** = kolejność linków w nawigacji (ujednolić jedno albo drugie, logicznie).
5. **Skacząca mapa** (`powiat-map.tsx`) — częściowo naprawione w PR #17 ("map doesn't move while clicking"); sprawdź, czy coś jeszcze skacze, jeśli nie — pomiń: zarezerwowany wymiar / `aspect-ratio` / skeleton, zero layout shift przy ładowaniu.
6. **Kontrast:** przejrzyj tokeny kolorów w `globals.css` i teksty na tłach; dociągnij do WCAG AA (4.5:1 tekst, 3:1 duże/UI).
7. **Animacje (nieagresywne):** subtelny fade/slide-in sekcji przy wejściu w viewport (IntersectionObserver + CSS),
   hover na kartach; wszystko wyłączone przy `prefers-reduced-motion`.
8. **Hardkody strony głównej:** `REGION_CONDITION` i „Artykuł dnia” — z API (jeśli brak danych → sekcja się chowa, nie zmyślamy).
9. **Forum z powrotem w nawigacji.**
10. **Usuń** `/test-krojow`, `/konto`, `/testerzy` (i linki do nich). Zgłaszanie testera zostaje w modalu na karcie innowacji (robi A3).
11. **`/wyzwania`** na danych z `GET /api/challenges` zamiast 4 hardkodowanych kart + linki do raportów ROPS (`source`).
12. **Strona edukacyjna** `/edukacja` z `GET /api/resources?type=education` (backend gotowy) + link w nawigacji/stopce.

---

## 🟧 Agent 2 — Kreator, AI, generator wniosków

**Branch:** `agent-2/kreator-ai`
**Pliki:** `find_inv/components/idea-*.tsx`, `middleman.tsx`, `middleman-modal.tsx`, `dictation.tsx`,
`find_inv/app/kreator/`, `find_inv/app/wdrozenie/`, nowa `find_inv/app/wnioski/`,
`find_inv_server/app/routers/ideas.py`, `middleman.py`, nowy `routers/grants.py` (+ rejestracja w `main.py`).

1. **Generator wniosków grantowych (najwyższy priorytet):**
   - backend `routers/grants.py`: `GET /api/grants` (1 przykładowy nabór, np. FIO/PFRON — struktura sekcji wniosku jako dane),
     `POST /api/grants/fill` body `{ grant_id, idea }` → LLM uzupełnia sekcje wniosku z fiszki (JSON mode, fallback bez klucza).
   - frontend `/wnioski`: wybór naboru, formularz sekcji, przycisk **„Uzupełnij z fiszki”** (z kreatora / wklejenie tekstu),
     edycja pól, eksport (druk/PDF przez `window.print` + style `@media print`). Link z kreatora i z nawigacji.
2. **Pasujące innowacje pod fiszką na żywo:** w trakcie tworzenia fiszki pod nią pokazują się pasujące innowacje
   (debounce ~800 ms, `POST /api/match`). **Fiszka nigdy nie znika** — wyniki dokładają się pod nią.
3. **PDF w kreatorze:** upload pliku PDF → backend wyciąga tekst (`pypdf`, dodaj do `requirements.txt`), limit rozmiaru,
   tekst trafia do autotaggera i wypełnia fiszkę. Obsługa błędów (skan bez tekstu → komunikat).
4. **Jeden UI Middlemana** zamiast `/wdrozenie` + `MiddlemanModal`: zostaw jeden komponent, drugi wejściowy punkt
   przekieruj na niego. Okno **„Jak to wdrożyć”** ma być **duże** (prawie pełny ekran, czytelny plan).
   Użyj wspólnego dialogu od A1, jeśli już jest na `main` (sprawdź `COMMS.md`); jeśli nie — zrób lokalnie zamykanie
   kliknięciem w tło + `Esc` + focus trap.
5. **Ostrzeżenie o halucynacjach:** widoczny, spokojny komunikat „Odpowiedzi generuje AI i mogą zawierać błędy —
   zweryfikuj przed wdrożeniem” przy Middlemanie, czacie (`match-chat` — dopisz minimalnie + `[FYI A3]`), kreatorze i generatorze wniosków.
   Zrób z tego jeden komponent.
6. **Eksport planu Middlemana** (druk / PDF przez `window.print` + style print).
7. **Popup „Czy chodziło Ci o…?”** po `POST /api/voice-fix`, gdy poprawiony tekst różni się od transkrypcji
   (akceptuj / zostaw oryginał).

---

## 🟨 Agent 3 — Karta innowacji, wyszukiwarka, testerzy, forum

**Branch:** `agent-3/karta-forum`
**Pliki:** `find_inv/app/innowacje/`, `find_inv/app/biblioteka/`, `find_inv/app/wyniki/`, `find_inv/app/forum/`,
`find_inv/components/innovation-*.tsx`, `backend-innovation-card.tsx`, `match-*.tsx`, `search-form.tsx`,
`library-browser.tsx`, `forum-*.tsx`, `tester-*.tsx`, `test-request.tsx`, `role-badge.tsx`,
`find_inv_server/app/routers/tester.py`, nowy `routers/forum.py`, `models.py` (z wpisem w `COMMS.md`).

**Zmiany w `models.py` zrób jako pierwszy commit** (forum_posts z `innovation_id`, ratings, tester_assignments)
i pushnij od razu + `[FYI A4]` w `COMMS.md` — A4 rebase'uje się na tym.

1. **Forum (P0):** backend `GET/POST /api/forum` (lista wątków, wątek, dodanie posta; `innovation_id` opcjonalny),
   podpięcie `forum-board.tsx` i `forum-thread.tsx` — posty przetrwają odświeżenie. Na karcie innowacji sekcja
   dyskusji filtrowana po `innovation_id`.
2. **„Zostań testerem” (P0):** `tester-apply-modal.tsx` / `tester-form.tsx` → `POST /api/testerzy` (zapis w SQLite,
   `approved=false`) zamiast toastu/localStorage. Strona `/testerzy` jest usuwana przez A1 — zgłoszenie żyje w modalu.
3. **Tag testera tylko dla przypisanych:** tabela przypisań tester ↔ innowacja; badge „Tester” przy osobie/komentarzu
   na danej innowacji pokazuje się tylko, gdy tester jest przypisany do **tej** innowacji.
4. **Ocena 1–5 gwiazdek:** komponent gwiazdek (dostępny z klawiatury, `aria-label`), `POST /api/innovations/{id}/rating`,
   średnia + liczba ocen na karcie. **Oceny testerów** widoczne osobno na karcie innowacji.
5. **„Używałem tej inicjatywy”** — usuń zmianę taga/roli po kliknięciu (zostaje tylko licznik/potwierdzenie).
6. **Wyszukiwarka — tagi:** poziomy scroll między tagami (strzałki + scroll, działa na mobile), wybór/zmiana tagu
   **dociąga wyniki** z API (nie filtruje tylko lokalnie).
7. **Jedna karta innowacji:** scal `/biblioteka/[id]` i `/innowacje/[id]` w jedną stronę (`/innowacje/[id]`),
   stara ścieżka robi redirect; podmień linki.
8. **Na karcie innowacji:** osadzone wideo (YouTube/Vimeo z `source_url`/pola wideo, lazy, tylko gdy jest),
   przycisk **„Zapytaj eksperta”** (otwiera czat/forum z kontekstem innowacji), **odsłuch** (`speechSynthesis`, pl-PL,
   start/stop) i **liczby prostym językiem** na kafelkach (np. „ok. 3 miesiące”, „niski koszt — do 10 tys. zł”).

---

## 🟦 Agent 4 — Admin, CMS, deploy

**Branch:** `agent-4/admin-cms`
**Pliki:** `find_inv_server/app/routers/admin.py`, `admin_panel.py`, `admin_store.py`, `find_inv/app/admin/`,
`find_inv/components/admin/*`, pliki deployu (`Dockerfile`, `docker-compose.yml`, konfiguracja hostingu),
`STATUS.md`, nowy `docs/koszty-utrzymania.md`.

**Zmiany w modelach:** poczekaj na pierwszy commit A3 w `models.py` (sprawdź `COMMS.md` / `git fetch && git log origin/agent-3/karta-forum`),
a do tego czasu rób zadania 1, 2, 5, 6, 8. Własne pola dopisuj z wpisem w `COMMS.md`.

1. **Archiwizacja (P0):** `admin_store.set_innovation_status` musi aktualizować też SQLite, żeby zarchiwizowana
   innowacja znikała z Biblioteki/wyników. Test w pytest.
2. **Deploy + link do demo (P0):** przygotuj deploy frontu i backendu (np. Dockerfile + compose, albo Vercel + Render/Fly —
   wybierz najprostsze), opisz kroki w `README.md`. Jeśli nie masz dostępu do konta hostingu — przygotuj wszystko
   do odpalenia jedną komendą i zapisz w PR, co musi zrobić człowiek (klucze, login).
3. **CMS innowacji:** w `/admin/innowacje` dodawanie, edycja (wszystkie pola karty) i usuwanie innowacji;
   backend `POST/PUT/DELETE /api/admin/innovations[/{id}]`, przy zapisie przelicz embedding w ChromaDB, przy usunięciu usuń wektor.
4. **Usuwanie w adminie:** admin może usuwać innowacje, komentarze/posty forum (moderacja — po merge'u forum A3
   albo od razu na tabeli z `models.py`), użytkowników. Potwierdzenie przed usunięciem.
5. **Prawdziwe dane w adminie:** użytkownicy, statystyki i trendy z SQLite (`users`, `testers`, `search_logs`,
   `innovations`) zamiast `admin_store` w pamięci.
6. **Zatwierdzenie testera** zmienia `testers.approved=true` **i** `users.role="tester"`. Test w pytest.
7. **Widok zgłoszonych potrzeb** w adminie z `GET /api/zasobnik/admin/needs` i `/trends` (tabela + wykres recharts).
8. **Dokument `docs/koszty-utrzymania.md`:** koszt utrzymania (hosting, LLM per zapytanie × szacowany ruch, embeddingi,
   domena), potrzebne zasoby ludzkie (moderacja, aktualizacja danych ROPS), z założeniami. Na koniec zaktualizuj `STATUS.md`.

---

## Poza agentami (robią ludzie)

- Makiety UX/UI (mogą być zrzuty ekranu) + PDF ≤10 slajdów **albo** film ≤3 min.
- Roadmapa do pitchu — tylko na slajdy: „Zapytaj raport” (RAG po PDF z numerem strony), automatyczne dane GUS,
  dialog z ROPS / mentorzy / partnerzy / powiadomienia, canva innowacji, brakujące wskaźniki,
  prawdziwe logowanie + Postgres/pgvector.
