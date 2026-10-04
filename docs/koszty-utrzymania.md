# HubMI.pl — koszty utrzymania

> Szacunek na potrzeby wdrożenia po hackathonie. Wszystkie liczby, które nie wynikają wprost z kodu albo
> z cennika dostawcy, są **założeniami** — oznaczone i do zweryfikowania przed decyzją budżetową.
> Stan: 4.10.2026.

## W skrócie

| Pozycja | Pilotaż (1 000 sesji / mies.) | Region (10 000 sesji / mies.) | Duży ruch (50 000 sesji / mies.) |
|---|---|---|---|
| LLM (Claude Haiku 4.5 przez OpenRouter) | ok. 7 USD | ok. 68 USD | ok. 340 USD |
| Embeddingi (wyszukiwanie semantyczne) | < 0,1 USD | < 0,1 USD | < 0,5 USD |
| Serwer (VPS 2 vCPU / 4 GB RAM + kopie zapasowe) | ok. 30–60 zł | ok. 30–60 zł | ok. 60–120 zł (większy VPS) |
| Domena `.pl` | ok. 50–100 zł / rok | ok. 50–100 zł / rok | ok. 50–100 zł / rok |
| Certyfikat TLS | 0 zł (Let's Encrypt) | 0 zł | 0 zł |
| **Razem miesięcznie (bez ludzi)** | **ok. 60–100 zł** | **ok. 300–350 zł** | **ok. 1 400–1 600 zł** |

Kurs przyjęty do przeliczeń: **1 USD ≈ 4 zł** (założenie). Największą pozycją przy rosnącym ruchu jest
LLM, a w nim **czat o innowacjach** — patrz „Jak obniżyć koszty”.

„Sesja” = jedna osoba, która opisuje problem i przegląda wyniki (definicja i proporcje niżej).

---

## 1. Model językowy (LLM)

### Cennik

Aplikacja używa modelu **Claude Haiku 4.5** (`anthropic/claude-haiku-4.5` w OpenRouter):

| | Cena |
|---|---|
| Wejście (prompt) | 1,00 USD za 1 mln tokenów |
| Wyjście (odpowiedź) | 5,00 USD za 1 mln tokenów |

To stawki Anthropic; **założenie:** OpenRouter rozlicza Claude po tych samych stawkach (bez marży na tokenach).
Przed wdrożeniem sprawdź aktualny cennik na stronie modelu w OpenRouter.

### Ile kosztuje jedno wywołanie

Długości promptów zmierzone w kodzie (`app/utils.py`, `routers/matchmaking.py`, `routers/middleman.py`,
`app/idea_analysis.py`). Tokeny liczone w przybliżeniu: **1 token ≈ 3 znaki** polskiego tekstu (założenie —
dokładną liczbę daje panel OpenRouter po pierwszym miesiącu).

| Funkcja | Tokeny wejścia | Tokeny wyjścia | Koszt jednego wywołania |
|---|---|---|---|
| Autotagger (`/api/tag`) — tagi z opisu problemu | ok. 400 | ok. 80 | ok. 0,0008 USD |
| Poprawka i sedno dyktowania (`/api/voice-fix`) | ok. 550 | ok. 80 | ok. 0,001 USD |
| Wiadomość w czacie o innowacjach (`/api/chat`, kontekst 5 innowacji) | ok. 4 100 | ok. 250 | ok. 0,005 USD |
| Sesja Middlemana (plan wdrożenia, ok. 4 wywołania) | ok. 12 000 | ok. 1 000 | ok. 0,017 USD |
| Analiza pomysłu w Kreatorze (`/api/ideas/analyze`) | ok. 570 | ok. 300 | ok. 0,002 USD |

### Ile kosztuje jedna sesja

**Założenia o zachowaniu użytkowników** (do sprawdzenia w panelu analityki admina po starcie):
każda sesja to 1 opis problemu (autotagger + wyszukiwanie), 30% osób dyktuje opis, 30% osób zadaje w czacie
średnio 3 pytania (0,9 wiadomości na sesję), 5% uruchamia Middlemana, 2% zapisuje pomysł w Kreatorze.

| Element | Wywołań na sesję | Koszt na sesję |
|---|---|---|
| Autotagger | 1 | 0,0008 USD |
| Dyktowanie | 0,3 | 0,0003 USD |
| Czat | 0,9 | 0,0049 USD |
| Middleman | 0,05 | 0,0009 USD |
| Kreator | 0,02 | 0,00004 USD |
| **Razem** | | **ok. 0,007 USD (ok. 3 grosze)** |

Koszt miesięczny = liczba sesji × 0,007 USD. Bez klucza OpenRouter aplikacja działa na regułach lokalnych
(koszt LLM = 0), ale bez czatu z modelem, semantycznego wyszukiwania i dobrej poprawki dyktowania.

## 2. Embeddingi (wyszukiwanie semantyczne)

Model `openai/text-embedding-3-small` przez OpenRouter — **założenie cenowe: ok. 0,02 USD za 1 mln tokenów**
(sprawdzić przed wdrożeniem).

- Zapytanie użytkownika: ok. 50 tokenów → ułamek centa nawet przy 50 000 sesji.
- Indeks całego katalogu (114 innowacji ROPS, zmierzone ok. 69 000 tokenów): ok. 0,0014 USD za jedno pełne
  przeliczenie (`python -m data.seed_innovations`). Przy edycji w panelu przeliczana jest tylko jedna innowacja.

ChromaDB działa lokalnie na serwerze — bez osobnej opłaty.

## 3. Hosting

Aplikacja uruchamia się jednym poleceniem (`docker compose up -d --build`, opis w `README.md`) na dowolnym
serwerze z Dockerem. Dane (SQLite, ChromaDB, załączniki) leżą w jednym wolumenie `/data`.

| Pozycja | Założenie | Uwagi |
|---|---|---|
| VPS 2 vCPU / 4 GB RAM / 40 GB dysku | ok. 25–50 zł / mies. | Wystarcza na pilotaż i ruch regionalny (frontend Next.js + FastAPI + ChromaDB). Ceny orientacyjne z ofert popularnych dostawców — porównać przed zakupem. |
| Kopie zapasowe (snapshot dzienny) | ok. 5–10 zł / mies. | Albo nocna kopia wolumenu `/data` na zewnętrzny dysk / chmurę. |
| Większy VPS przy dużym ruchu (4 vCPU / 8 GB) | ok. 60–120 zł / mies. | Przy 50 000 sesji; alternatywnie przejście na Postgres + pgvector. |
| Domena `.pl` | ok. 50–100 zł / rok | Pierwszy rok często w promocji. |
| TLS | 0 zł | Let's Encrypt (np. przez Caddy lub nginx przed kontenerami). |
| Monitoring dostępności | 0 zł | Darmowe progi usług typu uptime albo samodzielnie hostowany Uptime Kuma. |

Instytucja publiczna może mieć własną infrastrukturę (serwer w ROPS/UMWM) — wtedy koszt hostingu zamienia się
w czas administratora (sekcja 4).

## 4. Zasoby ludzkie

Najważniejszy koszt po starcie to **ludzie, nie serwer**. Podajemy czas pracy; koszt w złotówkach zależy od
stawek w instytucji (koszt = godziny × stawka godzinowa).

| Rola | Zakres | Szacowany czas |
|---|---|---|
| **Moderator / opiekun społeczności** | Przegląd postów forum, zgłoszonych pomysłów (Kreator), zatwierdzanie testerów, odpowiedzi na zgłoszone potrzeby | 4–8 h tygodniowo (ok. 0,1–0,2 etatu) |
| **Kurator danych ROPS** | Dodawanie nowych innowacji z Biblioteki ROPS (panel `/admin/innowacje`), aktualizacja kart, archiwizacja i oznaczanie nieaktualnych, kontrola tagów | 2–4 h tygodniowo; więcej przy dużym imporcie |
| **Opieka techniczna** | Aktualizacje zależności i bezpieczeństwa, kopie zapasowe, monitoring, reakcja na awarie, rotacja kluczy | 4–8 h miesięcznie (umowa serwisowa albo informatyk ROPS) |
| **Kontrola jakości AI** | Przegląd próbek odpowiedzi czatu i Middlemana, korekta promptów, sprawdzanie kosztów w OpenRouter | 2–4 h miesięcznie |

Pomoc w przeliczeniu: przy 30 h miesięcznie łącznie (środek widełek dla pilotażu) koszt ludzi =
30 × stawka godzinowa — przy typowych stawkach w administracji to wielokrotność kosztu infrastruktury.

## 5. Jak obniżyć koszty

1. **Czat to ok. 70% kosztu LLM** — kontekst 5 innowacji (ok. 3 500 tokenów) idzie z każdym pytaniem.
   Prompt caching dla stałej części kontekstu (dostępny dla Claude) obniża koszt powtarzanego kontekstu;
   można też wysyłać krótsze opisy innowacji zamiast pełnych.
2. **Limity**: dzienny limit wiadomości czatu na sesję i limit długości opisu (już jest: 2 000 znaków).
3. **Bez klucza w części funkcji**: autotagger i poprawka dyktowania mają lokalne reguły — można włączyć LLM
   tylko dla czatu i Middlemana.
4. **Monitoring wydatków**: limit miesięczny w OpenRouter, żeby nieoczekiwany ruch nie wygenerował rachunku.

## 6. Co trzeba zweryfikować przed decyzją

- Aktualny cennik Claude Haiku 4.5 i `text-embedding-3-small` w OpenRouter.
- Rzeczywiste proporcje użycia funkcji (panel admina → Zaangażowanie / Trendy) po 2–4 tygodniach pilotażu.
- Rzeczywiste zużycie tokenów (panel OpenRouter) zamiast przybliżenia 1 token ≈ 3 znaki.
- Oferty hostingu (albo infrastruktura własna ROPS/UMWM) i kurs USD/PLN.
