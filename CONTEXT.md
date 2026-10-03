# findinv — Kontekst projektu dla agentów

> Przeczytaj ten plik PRZED napisaniem pierwszej linii kodu.

---

## Czym jest findinv?

Platforma dla Województwa Małopolskiego budowana na hackathonie **HackYeah 2026** (Tauron Arena Kraków, 3–4 października 2026, 24h).

Zadanie konkursowe pochodzi od **ROPS Kraków** (Regionalny Ośrodek Polityki Społecznej) i nazywa się **HubMI.pl**.

**Problem który rozwiązujemy:** Małopolska ma dziesiątki sprawdzonych innowacji społecznych (programy dla seniorów, inicjatywy walki z samotnością, cyfrowe włączenie) — ale urzędnicy gminni, NGO i mieszkańcy nie wiedzą że istnieją. Równocześnie ludzie zgłaszają problemy, które już mają gotowe rozwiązania. findinv łączy te dwie strony.

---

## Użytkownicy (w kolejności ważności dla demo)

| Użytkownik | Co robi na platformie |
|---|---|
| **Mieszkaniec / NGO** | Opisuje problem → dostaje pasujące innowacje (Matchmaking) |
| **Urzędnik gminny** | Znajduje innowację → pyta AI jak ją wdrożyć u siebie (Middleman) |
| **Pracownik ROPS** | Zarządza bazą innowacji, weryfikuje zgłoszenia (Admin) |
| **Tester innowacji** | Testuje innowacje i daje feedback (Tester) |
| **Ekspert / konsultant** | Odpowiada na pytania na forum |

**Auth:** BRAK prawdziwej autoryzacji. Użytkownik klika "Zaloguj się" → wybiera rolę (user/tester/admin/consultant) → dostaje session token. To hackathon.

---

## Architektura w jednym zdaniu

```
Next.js frontend  ←→  FastAPI backend  ←→  SQLite + ChromaDB  ←→  OpenRouter (LLM)
```

- **SQLite** — dane relacyjne (innowacje, użytkownicy, forum, fiszki)
- **ChromaDB** — wektory do semantic search (embeddingi innowacji)
- **OpenRouter** — LLM (tanie modele np. Claude Haiku dla szybkich tasków, mocniejszy dla Middlemana)
- **Brak zewnętrznego auth** — session token w cookie/headerze, rola ustawiana bez weryfikacji

---

## 7 modułów — priorytety

| # | Moduł | Priorytet | Opis w jednym zdaniu |
|---|---|---|---|
| 1 | **Matchmaking społeczny** | 🔴 KRYTYCZNY | User opisuje problem → autotagger → 5 kart innowacji + RAG chat |
| 2 | **Zasobnik wiedzy** | 🔴 KRYTYCZNY | Homepage z kondycją Małopolski, live search innowacji |
| 3 | **Kreator pomysłów** | 🟠 WAŻNY | Fiszka pomysłu + AI asystent + generator wniosków grantowych |
| 4 | **Tester innowacji** | 🟡 ŚREDNI | Zgłoszenie testera, panel feedbacku |
| 5 | **Forum / komunikacja** | 🟡 ŚREDNI | Wątki z badge'ami ról |
| 6 | **Panel admina** | 🟠 WAŻNY | CMS, trendy, zarządzanie użytkownikami |
| 7 | **Middleman AI** | 🔴 KRYTYCZNY | AI przerabia innowację na konkretny plan dla instytucji |

---

## Moduł 1 — Matchmaking (najważniejszy, tu są punkty)

**Flow użytkownika:**
```
[user wpisuje problem lub mówi do mikrofonu]
        ↓
[voice-fix: LLM poprawia gramatykę jeśli voice]
        ↓
[autotagger: LLM nadaje tagi z zamkniętej listy TAXONOMY_TAGS]
[tagi pokazują się użytkownikowi jako chipy — widać że system rozumie]
        ↓
[match: embedding query → ChromaDB → ranking po tagach → 5 kart]
        ↓
[karty innowacji z ROPS: tytuł, opis, koszt, gdzie wdrożono, badge "Nieaktualna" jeśli unmaintained]
        ↓
[user może pisać z AI chatbotem który zna kontekst tych 5 innowacji (RAG streaming)]
        ↓
[przy każdej karcie: przycisk "Jak to wdrożyć?" → Middleman]
```

**Kluczowe decyzje (ustalone):**
- Tagi TYLKO z `TAXONOMY_TAGS` (lista w `app/utils.py`) — zamknięta taksonomia
- Ranking: cosine similarity z ChromaDB + boost za każdy pasujący tag
- 5 kart na pierwszej odpowiedzi, "Zobacz więcej" = redirect do `/innowacje?tags=...`
- Early rejection: jeśli `is_relevant: false` z autotaggera → komunikat na frontendzie (backend tylko zwraca flagę)
- Badge "Nieaktualna" (szary) jeśli `status="unmaintained"` w DB
- Voice: Web Speech API w przeglądarce (Chrome/Edge), backend dostaje już tekst
- Historia chatu: trzyma frontend w React state, backend dostaje pełne `messages[]` przy każdym wywołaniu

---

## Dane źródłowe (Agent 3 odpowiada za załadowanie)

Wszystkie dane pochodzą z **ROPS Kraków**:

| Źródło | Co zawiera | Gdzie w aplikacji |
|---|---|---|
| Biblioteka Innowacji ROPS | Opisy innowacji społecznych (wideo, tekst) | Matchmaking, Zasobnik |
| OZPS (raporty od 2012) | Powody korzystania z pomocy społecznej per gmina | Mapa Wyzwań, Stats |
| Diagnoza usług 2023–2030 | Deficyty i potrzeby | Mapa Wyzwań |
| Biuletyn es.O.es | Dobre praktyki | Zasobnik |
| Mapa Wyzwań Społecznych (PDF) | Wyzwania per obszar | Challenges, Gap Index |

**Pliki surowe wrzucasz do:** `backend/data/rops_raw/`

**Linki do ręcznego scrape:**
- https://rops.krakow.pl/innowacje-spoleczne/biblioteka-innowacji-spolecznych/kategorie
- https://rops.krakow.pl/badania-analizy-raporty/raporty-z-badan
- https://obserwator.rops.krakow.pl/
- https://rops.krakow.pl/innowacje-spoleczne/publikacje-ze-swiata-innowacji

---

## Design (dla frontendu — czytaj gdy zaczniesz Next.js)

- **Kolor główny:** zieleń (konkretny odcień do ustalenia, coś jak `#2D6A4F` lub podobne)
- **Styl:** łagodne animacje, duże czytelne fonty, dużo białej przestrzeni
- **Zasada:** małe attention span — użytkownik ma zrozumieć co zrobić w 3 sekundy
- **Dostępność:** WCAG 2.1 poziom AA (wymóg regulaminowy, 20% oceny jury!)
  - Kontrast kolorów min. 4.5:1
  - Wszystko dostępne klawiaturą
  - ARIA labels na interaktywnych elementach
  - Tekst alternatywny dla obrazków
- **Języki:** tylko polski

---

## Kryteria oceny jury (wagi)

| Kryterium | Waga | Co to znaczy praktycznie |
|---|---|---|
| Realizacja wyzwania | **40%** | Działa matchmaking + realne dane ROPS |
| Potencjał wdrożeniowy | **20%** | Wygląda jak coś co można użyć po hackathonie |
| Dostępność i UX (WCAG) | **20%** | Intuicyjne, działa dla każdego, accessibility |
| Jakość UX/UI | **10%** | Estetyczne, nieszablonowe |
| Jakość materiałów/MVP | **10%** | Demo działa, prezentacja klarowna |

**Minimum żeby dostać nagrodę: 50% maksymalnej oceny.**

---

## Co nas wyróżni na pitchu

1. **Autotagger widoczny wizualnie** — chipy tagów pojawiają się zanim wyniki → jury widzi że system "myśli"
2. **Indeks Luki Innowacyjnej** — mapa pokazuje gdzie jest problem ale brak innowacji (białe plamy)
3. **Middleman** — urzędnik dostaje konkretny plan: kogo zatrudnić, ile kosztuje, gdzie zorganizować
4. **Streaming chat** — odpowiedź AI "wpisuje się" na żywo, silne wrażenie na demo
5. **Realne dane ROPS** — nie mock data, prawdziwe innowacje z Małopolski

---

## Czego NIE robimy (żeby zdążyć)

- Brak prawdziwego auth (tylko mock session)
- Brak GUS BDL API live (zahardkodowane wskaźniki wystarczą)
- Brak mapy powiatów jeśli nie ma czasu (lista wystarczy)
- Brak emaili, powiadomień, płatności
- Brak i18n (tylko PL)
- Brak testów automatycznych

---

## Stack techniczny

```
Frontend:   Next.js (App Router)
Backend:    FastAPI (Python, async)
DB:         SQLite (aiosqlite + SQLAlchemy async)
Vectors:    ChromaDB (lokalnie, plik na dysku)
LLM:        OpenRouter API (OpenAI-compatible)
            - szybkie taski: tani model (Haiku)
            - Middleman/chat: mocniejszy model
```

---

## Repo i komunikacja

- Repo: GitHub (jeden wspólny)
- Branch per agent: `agent-{N}/{feature}`
- PR do `main` po każdym działającym endpoincie
- **Nie modyfikuj** `models.py` `schemas.py` `llm.py` `embeddings.py` bez PR z opisem
- Szczegółowy podział zadań: `AGENTS.md`
- Pełny plan API: `hubmi-backend-plan.md`

---

## Deadline

**4 października 2026, godz. 11:00** — finalne zgłoszenie przez https://hackyeah2026.hacktribe.co/

Wyniki: godz. ~17:45 tego samego dnia.
