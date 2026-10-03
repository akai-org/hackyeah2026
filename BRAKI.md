# HubMI — do zrobienia

## P0 — przed oddaniem

- [ ] Deploy + link do demo
- [ ] Dokument: koszt utrzymania i potrzebne zasoby
- [ ] Makiety UX/UI (mogą być zrzuty ekranu) + PDF ≤10 slajdów albo sprawdzić, czy film ma ≤3 min
- [ ] Forum: podpiąć `forum-board.tsx` i `forum-thread.tsx` pod `GET/POST /api/forum` (dziś posty znikają po odświeżeniu) + dodać `innovation_id` do `forum_posts`
- [ ] „Zostań testerem” (`tester-form.tsx`, `tester-apply-modal.tsx`) → `POST /api/testerzy` zamiast toastu / localStorage
- [ ] Archiwizacja w adminie nie ukrywa innowacji w Bibliotece: `admin_store.set_innovation_status` musi też aktualizować SQLite

## P1 — duży zysk, kilka godzin

- [ ] Strona z materiałami edukacyjnymi na `/api/resources?type=education` (backend gotowy)
- [ ] `/wyzwania` na danych z `/api/challenges` zamiast 4 hardkodowanych kart + linki do raportów ROPS
- [ ] Admin: widok zgłoszonych potrzeb (`/api/zasobnik/admin/needs`, `/trends`)
- [ ] Admin: dodawanie i edycja innowacji (CMS)
- [ ] Admin: prawdziwi użytkownicy, statystyki i trendy z SQLite zamiast `admin_store` w pamięci
- [ ] Zatwierdzenie testera ma zmieniać rolę w tabeli `users`
- [ ] Generator wniosków grantowych (1 przykładowy nabór + „Uzupełnij z fiszki” przez LLM)
- [ ] Odsłuch (`speechSynthesis`) + liczby prostym językiem na kafelkach
- [ ] Popup „Czy chodziło Ci o…?” po `voice-fix`
- [ ] Osadzone wideo na karcie innowacji
- [ ] Przycisk „Zapytaj eksperta” na karcie wyniku
- [ ] Eksport planu Middlemana (druk / PDF)
- [ ] Kreator: pokazać istniejące innowacje podobne do pomysłu
- [ ] Oceny testerów widoczne na karcie innowacji
- [ ] Forum z powrotem w nawigacji

## Sprzątanie

- [ ] Usunąć `/test-krojow` i `/konto`
- [ ] Jedna karta innowacji zamiast `/biblioteka/[id]` + `/innowacje/[id]`
- [ ] Jeden UI Middlemana zamiast `/wdrozenie` + `MiddlemanModal`
- [ ] Zaktualizować `STATUS.md`
- [ ] Hardkody na stronie głównej: `REGION_CONDITION`, „Artykuł dnia”

## Roadmapa do pitchu (nie kodować)

- „Zapytaj raport” — RAG po PDF z numerem strony
- Automatyczna aktualizacja danych GUS + import wskaźników z PDF
- Dialog z ROPS, mentorzy, katalog partnerów, powiadomienia
- Canva innowacji, wizualizacja pomysłu
- Brakujące wskaźniki: samotność, zdrowie psychiczne, wykluczenie cyfrowe, DPS/DDP, WTZ/ŚDS
- Prawdziwe logowanie (bez `X-Dev-Admin` i bez samodzielnego wyboru roli admina), Postgres + pgvector
