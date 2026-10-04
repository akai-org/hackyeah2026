---
name: findinv — FindInv.pl
description: Małopolska's civic almanac for social innovation discovery
colors:
  primary: "#345995"
  primary-hover: "#284778"
  primary-foreground: "#FFFFFF"
  secondary: "#C2D2B8"
  accent: "#F4845F"
  accent-foreground: "#412722"
  background: "#F4FBF8"
  surface: "#FFFFFF"
  foreground: "#412722"
  muted: "#5E4B46"
  border: "#5F7568"
  success: "#2E6B45"
  warning: "#7A4E00"
  destructive: "#A3322A"
  focus: "#1F3F73"
  overlay: "#412722"
typography:
  display:
    fontFamily: "Atkinson Hyperlegible, system-ui, sans-serif"
    fontSize: "clamp(2.75rem, 7vw, 5rem)"
    fontWeight: 700
    lineHeight: 1.15
  headline:
    fontFamily: "Atkinson Hyperlegible, system-ui, sans-serif"
    fontSize: "2.125rem"
    fontWeight: 700
    lineHeight: 1.2
  title:
    fontFamily: "Atkinson Hyperlegible, system-ui, sans-serif"
    fontSize: "1.625rem"
    fontWeight: 700
    lineHeight: 1.3
  body:
    fontFamily: "Atkinson Hyperlegible, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Atkinson Hyperlegible, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
rounded:
  ui: "12px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  2xl: "48px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.ui}"
    padding: "8px 20px"
    height: "48px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.ui}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.primary}"
    rounded: "{rounded.ui}"
    padding: "8px 20px"
    height: "48px"
  button-secondary-hover:
    backgroundColor: "{colors.primary} / 10%"
    textColor: "{colors.primary}"
    rounded: "{rounded.ui}"
  chip:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.ui}"
    padding: "8px 16px"
    height: "48px"
  chip-hover:
    backgroundColor: "{colors.primary} / 10%"
    textColor: "{colors.foreground}"
    rounded: "{rounded.ui}"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.ui}"
    padding: "24px"
---

# DESIGN.md – FindInv.pl (Małopolski Hub Innowacji Społecznych)

Plik dla osób i narzędzi AI budujących interfejs. Czytaj go przed każdym nowym ekranem i trzymaj się go. Jeśli coś w kodzie łamie te zasady, popraw kod, nie plik.

---

## 1. Idea w trzech zdaniach

Platforma wygląda jak **spokojna szklarnia z liśćmi monstery**, w której ktoś **wyciął litery z gazet i okleił nimi tablicę ogłoszeń**. Zielone, ciche tło daje odpoczynek i zaufanie. Wycięte litery (ransom note) są jedynym głośnym elementem i pojawiają się tylko tam, gdzie służą nazwie, nagłówkom i hasłom. Cała reszta (formularze, wyniki, plan wdrożenia) jest bardzo czytelna, bo korzystają z niej seniorzy, urzędnicy i osoby z niepełnosprawnościami.

**Skąd ten pomysł:** innowacja społeczna to wycinanie rozwiązań z różnych miejsc i sklejanie ich w całość, która pasuje do konkretnej gminy. Kolaż z wyciętych liter mówi dokładnie to samo, tylko wizualnie. Monstera (liście z dziurami) to rośliną, która rośnie w każdym domu i w każdym urzędzie, więc jest swojska, nie korporacyjna.

**Zasada nadrzędna:** cała „zabawa" kolażem jest dekoracją na wierzchu. Pod spodem zawsze leży zwykły, dostępny tekst (WCAG 2.1 AA). Nigdy odwrotnie.

---

## 2. Zasady (kolejność ma znaczenie)

1. **Czytelność przed stylem.** Treść, której człowiek potrzebuje do działania (pole wpisywania, wyniki, przyciski, plan wdrożenia), zawsze jest w spokojnym kroju bezszeryfowym, na jednolitym tle.
2. **Głośno tylko w jednym miejscu.** Ransom note stosujemy do: logo, nagłówka strony głównej, tytułów sekcji (maks. 6 słów) i pustych stanów. Nie używamy go do akapitów, etykiet pól, przycisków ani komunikatów błędów.
3. **Monstera jest tłem, nie treścią.** Liście są dekoracją `aria-hidden`, ucięte przez krawędź ekranu, nigdy pod tekstem o niskim kontraście.
4. **Papier, nie plastik.** Elementy wyglądają jak karteczki przyklejone do tablicy: lekkie przesunięcie, twardy mały cień. Gradienty i groszek tylko jako cicha dekoracja tła (sekcja 3.3), nigdy na komponentach.
5. **Ruch tylko na prośbę użytkownika** (plus jeden wyjątek, patrz sekcja 9).
6. **Tryb prosty.** Użytkownik może jednym przyciskiem wyłączyć cały kolaż. Zostaje czysty, spokojny interfejs.

---

## 3. Kolory

Jeden semantyczny system tokenów. **Nazwa opisuje funkcję koloru, nie jego wygląd.** Wartości żyją wyłącznie w `app/globals.css` (`@theme`); komponenty używają tylko nazw (`bg-primary`, `text-muted`, `border-border`, `var(--color-focus)`). Domyślna paleta Tailwinda jest wyłączona (`--color-*: initial`), więc nie ma drugiego, równoległego systemu. Żadnych hexów, `rgb()` ani `hsl()` w komponentach.

### 3.1 Tokeny

| Token | Hex | Rola | Udział |
|---|---|---|---:|
| `background` | `#F4FBF8` | tło strony, hero, duże powierzchnie | ~55% |
| `secondary` | `#C2D2B8` | sekcje, duże bloki, panele, skeletony, ścieżki pasków, dekoracje | ~20% |
| `surface` | `#FFFFFF` | karty, pola, modale, dropdowny | ~10% |
| `primary` | `#345995` | CTA, przyciski, linki, stany aktywne i zaznaczone, kluczowe ikony, słupki wykresów | ~8% |
| `foreground` | `#412722` | nagłówki, treść, etykiety, nawigacja | ~5% |
| `accent` | `#F4845F` | taśma na kartach, plakietki wyróżniające (konsultant, „Nowy", „Wstępne wyniki") | ~2% |
| `muted` | `#5E4B46` | tekst pomocniczy, metadane, placeholdery | |
| `border` | `#5F7568` | granice pól, przycisków, kart; `border-border/40` dla dekoracyjnych separatorów | |
| `success` | `#2E6B45` | potwierdzenia, statusy „aktywna / sprawdzone / ocenione" | |
| `warning` | `#7A4E00` | „do weryfikacji", dane przykładowe, brak połączenia | |
| `destructive` | `#A3322A` | błędy, walidacja, odrzucanie | |
| `focus` | `#1F3F73` | obrys focusu (3 px, odstęp 3 px) | |

Tokeny pomocnicze: `primary-hover` (`#284778`), `primary-foreground` (`#FFFFFF`, tekst na `primary`), `accent-foreground` (`#412722`, tekst na `accent`), `overlay` (zawsze z kryciem, np. `bg-overlay/60` pod modalem), cień `shadow-raised` (zabarwiony `foreground`).

### 3.2 Zasady użycia

- **Stany:** hover elementu z tekstem `primary` → `bg-primary/10`; hover neutralny → `bg-secondary/60`; zaznaczony chip / segment → `bg-primary text-primary-foreground`; zaznaczona karta wyboru → `border-primary bg-primary/10`.
- **Statusy** zawsze tym samym wzorem: `border-{status} bg-{status}/10 text-{status}` plus ikona i słowo. Błędy: `border-destructive bg-surface text-destructive`, `role="alert"`.
- **Na pełnym `secondary` tylko `foreground` i `muted`.** `primary` ma tam 4,39:1, statusy ~4:1. Panele z linkami, przyciskami lub błędami dostają `bg-secondary/60` (wszystkie kolory tekstu ≥ 4,5:1).
- `accent` nigdy jako tekst ani granica (2,41:1 na tle) i nigdy jako duże tło. Tekst na `accent` to `accent-foreground`.
- Informacja nigdy nie jest przekazywana samym kolorem (ikona, słowo, położenie, podkreślenie).

**Sprawdzone kontrasty (WCAG 2.2 AA):**
- `foreground` na `background` 13,00 · `surface` 13,65 · `secondary` 8,59 · `accent` 5,40
- `muted` na `background` 7,78 · `surface` 8,17 · `secondary` 5,14
- `primary` na `background` 6,65 · `surface` 6,98 · `secondary/60` 5,21 · `primary/10` 6,00
- `primary-foreground` na `primary` 6,98 · na `primary-hover` 9,28
- `success` na `surface` 6,35 · `warning` 7,20 · `destructive` 6,89 (na swoich tłach `/10` ≥ 5,4)
- `border` na `background` 4,73 · `surface` 4,96 · `secondary` 3,12 (≥ 3:1 dla granic komponentów)
- `focus` na `background` 9,92 · `secondary` 6,55 · `accent` 4,12

### 3.3 Gradienty i groszek

Dekoracja, nie treść. Statyczne, bez animacji, wyłączane w druku i w trybie kontrastu.
- `.bg-glow`: miękkie radialne plamy (`secondary` 60%, `primary` 7%, mała plama `accent` 10%) na `background`. Tylko hero.
- `.bg-section-fade`: `background → secondary`, zatrzymane na 70% `secondary` (tam `primary` ma jeszcze 4,99:1, statusy ≥ 4,5:1). Sekcja „Jak to działa" i stopka.
- `.bg-dots`: kropki `foreground` przy 8% krycia co 22 px, wygaszane maską od narożnika (`.bg-dots-bottom` dla lewego dolnego). Hero i stopka. Pod tekstem praktycznie znikają.

### 3.4 Wysoki kontrast

`html[data-contrast="high"]` podmienia **te same tokeny** (żółty na czarnym): `background` #000, `surface` #0D0D0D, `secondary` #1C1C1C, `foreground`/`primary`/`border` #FFF500, `muted` #FFF, `primary-foreground` #000, `accent` #FF9E7A, `success` #5EE08A, `warning` #FFC94D, `destructive` #FF8A80, `focus` #7FE7FF. Do tego: ramki 3 px, focus 4 px z odstępem, podkreślone linki, brak cieni, gradientów, groszku i dekoracji kolażu. Kartogram ma własne kroki skali (`--map-1…4`). Komponenty niczego tu nie nadpisują.

---

## 4. Typografia

Dwa światy krojów: **spokojny** (cała treść) i **wycięty** (tylko nagłówki kolażowe).

### 4.1 Krój podstawowy: Atkinson Hyperlegible
Krój zaprojektowany przez Braille Institute z myślą o osobach słabowidzących. Litery są maksymalnie rozróżnialne, co dobrze służy seniorom. Używamy go do całej treści, formularzy, przycisków i etykiet.

- Google Fonts: `Atkinson Hyperlegible` (400, 700), dla trybu `next/font`: `latin` + `latin-ext`.
- **Sprawdź polskie znaki** (ą ć ę ł ń ó ś ź ż) na stronie testowej przed pracą nad resztą. Fallback: `system-ui, "Segoe UI", Roboto, sans-serif`.

### 4.2 Kroje „wycięte z gazet" (tylko nagłówki kolażu)
Pula 5 krojów o wyraźnie różnym charakterze. Każda litera dostaje jeden z nich losowo (deterministycznie, patrz 6.3).

| Rola | Krój | Uwaga |
|---|---|---|
| gruba szeryfowa | `Abril Fatface` | mocny kontrast |
| płyta | `Alfa Slab One` | ciężka, nagłówkowa |
| szeryfowa klasyczna | `Playfair Display` (700/900) | elegancka |
| maszynowa | `Courier Prime` (700) | efekt maszyny do pisania |
| plakatowa bezszeryfowa | `Bitter` lub `Atkinson Hyperlegible` 700 | spokojne ogniwo, żeby kolaż nie był chaosem |

**Zasada:** minimum 2 z 5 liter w słowie ma być z kroju spokojnego (Atkinson lub Bitter). Dzięki temu słowo da się przeczytać jednym spojrzeniem. Przed użyciem każdego kroju sprawdź ogonki. Jeśli któryś ich nie ma, usuń go z puli.

### 4.3 Skala typograficzna
Bazowy rozmiar to **18 px** (nie 16), bo odbiorcami są seniorzy. Interlinia w treści 1,6. Długość linii maks. 70 znaków.

| Token | Rozmiar | Użycie |
|---|---|---|
| `text-sm` | 16 px | metadane, pomocnicze (nigdy mniej) |
| `text-base` | 18 px | treść, pola, etykiety |
| `text-lg` | 21 px | wstęp, opis karty |
| `text-xl` | 26 px | tytuł karty innowacji |
| `text-2xl` | 34 px | tytuł sekcji (zwykły albo kolaż) |
| `text-hero` | `clamp(2.75rem, 7vw, 5rem)` | nagłówek strony głównej (kolaż) |

Nagłówki zwykłe: Atkinson 700, kolor `foreground`. **Bez WIELKICH LITER w etykietach**, bez zbędnych etykiet nad nagłówkami. Pisownia zdaniowa.

---

## 5. Układ i kształty

- Szerokość treści: maks. 1120 px, wyśrodkowana. Tekst wyrównany **do lewej** (nigdy justowany, nigdy centrowany w akapitach). Wyjątek: hero może być do lewej z liściem po prawej.
- Siatka odstępów: 4 px (`4, 8, 12, 16, 24, 32, 48, 72`).
- **Dwa rodzaje krawędzi:**
  - **Kartki dekoracyjne** (nagłówki, plakietki, litery): lekko nieregularny wielokąt przez `clip-path`, rotacja −3° do +3°.
  - **Elementy interaktywne** (przyciski, pola, chipy): prosty zaokrąglony prostokąt, promień 12 px, bo muszą wyglądać jak coś, w co można kliknąć.
- **Cień:** `shadow-raised` dla kart (zabarwiony `foreground`), twardy `shadow-cutout` dla wycinków papieru, brak cienia dla pól i przycisków (mają ramkę 2 px).
- **Ramki pól i przycisków:** 2 px `border` (przycisk główny: `primary`). Obszary dotykowe minimum **48 × 48 px**.

### Struktura strony głównej (szkic)

```
┌────────────────────────────────────────────────────────┐
│ [logo kolażowe: FindInv]        Biblioteka  Pomoc  [Prosty widok] │
├────────────────────────────────────────────────────────┤
│  ┌──────────────────────────┐      🌿 monstera           │
│  │ Z cz̶y̶m̶ masz kłopot?       │      (ucięta, w tle)       │
│  │ (nagłówek kolażowy)      │                            │
│  └──────────────────────────┘                            │
│  Opisz własnymi słowami. Znajdziemy, co już działa.      │
│  ┌───────────────────────────────────────┐ [🎤][Szukaj]  │
│  │ pole tekstowe, duże, 3 linijki         │              │
│  └───────────────────────────────────────┘              │
│  Przykłady:  [Samotny senior na wsi] [Brak transportu]   │
└────────────────────────────────────────────────────────┘
```

### Struktura wyników (szkic)

```
Zrozumiałem:  (samotność ✕) (seniorzy ✕) (wieś ✕)  [+ dodaj]
[Wstępne wyniki – dopracowuję…]          ← plakietka masło

┌─ Karta innowacji ───────────────────────────┐
│ Tytuł (Atkinson 700, 26 px)                 │
│ Dlaczego pasuje: „fragment z karty…"       │
│ Dowód skuteczności: ● Sprawdzone            │
│ [Zobacz kartę]   [Dostosuj do mojej instytucji] │
└─────────────────────────────────────────────┘
(max 5 kart, w trybie prostym max 3)
```

---

## 6. Ransom note – specyfikacja komponentu

### 6.1 Co to jest
Komponent `<CutoutText>` renderuje tekst jako ciąg pojedynczych liter, a każda litera wygląda jak wycinek z gazety: własny krój, własne tło, lekki obrót, nierówne krawędzie.

### 6.2 Wygląd jednej litery
- Tło: losowo z `background`, `surface`, `secondary` i rzadko `accent` (maks. 1 na 5 liter).
- Tekst: `foreground`. **Kontrast każdej litery z jej tłem ≥ 4,5:1** (najniższy: `foreground` na `accent` 5,40).
- Obrót: od −4° do +4°. Przesunięcie pionowe od −0.06em do +0.06em.
- Rozmiar: różnica do ±12% względem sąsiednich liter, nigdy mniej niż 90% rozmiaru bazowego.
- Padding: 0.08em 0.18em. Odstęp między literami 2 px, a między słowami 0.4em.
- Krawędź: `clip-path: polygon(...)` z 5–7 punktami lekko odchylonymi od prostokąta (±2%), dla każdej litery inny.
- Cień: ten sam twardy mały cień z sekcji 5.
- Spacje: prawdziwa spacja, bez tła.

### 6.3 Losowość musi być deterministyczna
Nie używaj `Math.random()` przy renderowaniu (błąd hydracji w Next.js i litery skaczące po odświeżeniu). Wylicz „ziarno" z tekstu i pozycji litery (np. prosty hash `charCode * 31 + index`) i z niego wybierz krój, tło, obrót i kształt.

### 6.4 Dostępność (obowiązkowe)
```tsx
<h1 aria-label="Z czym masz kłopot?" className="cutout">
  <span aria-hidden="true">{/* litery */}</span>
</h1>
```
- Czytnik ekranu czyta jedno zwykłe zdanie, a nie litery po kolei.
- Tekst powinien być też zaznaczalny i kopiowalny (litery jako zwykłe znaki w `span`).
- Maks. **6 słów** i maks. **40 znaków** na jeden nagłówek kolażowy.
- Na ekranach węższych niż 480 px zmniejsz obrót do ±2° i wyłącz różnice rozmiarów.
- Przy `prefers-reduced-motion` oraz w „Prostym widoku" wyświetlamy zwykły nagłówek Atkinson 700 w kolorze `foreground`, bez kolażu.

### 6.5 Gdzie wolno / gdzie nie wolno
| Wolno | Nie wolno |
|---|---|
| logo „FindInv", nagłówek strony głównej | akapity i opisy |
| tytuły sekcji (krótkie) | etykiety pól i przycisków |
| puste stany („Nic tu jeszcze nie ma") | komunikaty błędów |
| nagłówek karty wdrożeniowej (PDF) | tytuły kart innowacji z długimi nazwami |

---

## 7. Monstera

- **Format:** własne SVG (lub wygenerowane przez AI i uproszczone). Jednokolorowe, płaskie, z charakterystycznymi dziurami i nacięciami liścia, bez gradientów.
- **Kolory liści:** `secondary` (domyślnie), `primary` tylko dla jednego akcentowego liścia. Opacity 100%, bo kolory są już spokojne.
- **Pozycjonowanie:** liście wyłażą spoza krawędzi ekranu (hero: prawy górny róg; stopka: lewy dolny róg; puste stany: pod napisem). Maks. 2 liście widoczne na ekranie jednocześnie.
- **Dostępność:** `aria-hidden="true"`, `pointer-events: none`, `role="presentation"`. Nigdy nie wchodzą pod tekst treści. Zostawiamy minimum 24 px wolnej przestrzeni od tekstu.
- **Mobile:** jeden liść, mniejszy, w rogu nagłówka.
- Liście jako „wycinki": jeden liść w hero może mieć obrys papieru (biała ramka 6 px i twardy cień), żeby spinał świat monstery z kolażem.
- **Tło papierowe (opcjonalnie):** bardzo delikatna tekstura szumu (opacity ≤ 4%), wbudowana w CSS jako SVG `feTurbulence`. Nie może pogarszać kontrastu.

---

## 8. Komponenty

### Pole „Opisz problem"
- Textarea 3 linijki, min. wysokość 120 px, ramka 2 px `border`, tło `surface`, promień 12 px.
- Widoczna etykieta nad polem: „Opisz swój problem". Placeholder tylko jako podpowiedź, nie zamiennik etykiety.
- Obok przyciski: **Mikrofon** (ikona + tekst „Podyktuj") oraz **Szukaj**. Na wąskim ekranie pod polem.
- Mikrofon: stan nagrywania wyraźnie widoczny i czytany przez `aria-live`: „Nagrywam…", „Gotowe, sprawdź tekst". Obok krótka informacja o przetwarzaniu mowy. Przycisk ukrywany tam, gdzie przeglądarka nie obsługuje dyktowania.
- Przykłady problemów jako chipy pod polem (po kliknięciu wpisują tekst).

### Przyciski
- **Główny:** tło `primary`, tekst `primary-foreground`, ramka 2 px `primary`, wysokość min. 48 px, tekst 18 px/700. Hover: `primary-hover`. Active: przesunięcie o 1 px.
- **Drugorzędny:** tło `surface`, tekst `primary`, ramka 2 px `border`. Hover: `primary/10`.
- **Etykiety opisują akcję:** „Szukaj", „Dostosuj do mojej instytucji", „Pobierz plan (PDF)". Nie „Dalej" i nie „Wyślij".
- Brak strzałek `→` doklejanych do przycisków.

### Chipy tagów („Zrozumiałem: …")
- Tło `primary/10`, tekst `foreground`, ramka 2 px `primary`, wysokość min. 40 px (dotyk 48 px z paddingiem).
- Z przyciskiem usunięcia (`✕`), który ma `aria-label="Usuń tag samotność"`.
- Po zmianie tagów lista wyników nie odświeża się sama, tylko pojawia się przycisk „Zaktualizuj wyniki".

### Karta innowacji
- Tło `surface`, ramka 2 px `border`, cień `shadow-raised`, delikatnie przechylona tylko na hoverze **nie** (karty stoją prosto, bo zawierają treść). Dekoracyjny „kawałek taśmy" (prostokąt `accent` przechylony o 4°, `aria-hidden`) w górnym rogu.
- Zawartość: tytuł, „Dlaczego pasuje" (cytat z karty), odznaka dowodu skuteczności (ikona + słowo: Sprawdzone / Wstępne / Brak danych), dwa przyciski.
- Cytat w `blockquote` z lewą pionową linią 4 px `secondary`.
- Odznaka dowodu: Sprawdzone `success`, Wstępne `warning`, Brak danych neutralna.

### Plakietka „Wstępne wyniki"
- Tło `accent`, tekst `accent-foreground`, ikona zegara, rola `status`, `aria-live="polite"`. Po zakończeniu zamienia się w „Wyniki dopracowane" i znika po 4 sekundach (nie znika przy czytniku ekranu przed odczytaniem).

### Plan wdrożenia („Middleman")
- Zwykły dokument na `surface` z nagłówkami Atkinson. Kolaż tylko w tytule.
- Wyraźny pasek: „To jest szkic. Sprawdź koszty i przepisy przed wdrożeniem." Tło `secondary/60`, ikona informacji.
- Sekcje: Cel · Kto realizuje · Czego potrzeba · Etapy (30/60/90 dni) · Ryzyka · Do uzupełnienia.
- Braki oznaczone tekstem „do uzupełnienia" z ikoną, nie samym kolorem.

### Komunikaty
- Błędy: ikona + tekst w `destructive` na `surface`, ramka `destructive` 2 px, `role="alert"`. Ostrzeżenia `warning`, potwierdzenia i toasty `success`, ten sam wzór. Mówią, co się stało i co zrobić. Nie przepraszają.
- Pusty wynik: „Nie znalazłem pasującej innowacji. Wybierz najbliższy obszar albo opisz problem inaczej." Poniżej 3 kategorie z Mapy Wyzwań. Zgłoszenie zapisuje się jako luka dla ROPS.
- Kryzys (słowa wskazujące przemoc, myśli samobójcze): zamiast wyników spokojny panel z numerami pomocowymi, bez kolażu i bez ozdób.

### Focus
- Każdy element interaktywny: `outline: 3px solid var(--color-focus); outline-offset: 3px;` a na tle `primary` (klasa `.focus-on-primary`): dodatkowy pierścień `box-shadow: 0 0 0 3px var(--color-surface)`. Pola bez własnego obrysu: `focus-within:outline-focus` na opakowaniu. Nigdy `outline: none` bez zamiennika.

---

## 9. Ruch

- **Jeden moment:** przy pierwszym wejściu na stronę główną litery nagłówka kolażowego „przyklejają się" kolejno (kilka dziesiątych sekundy, razem do 900 ms): przesunięcie 6 px i obrót, nic więcej.
- Poza tym ruch tylko jako odpowiedź na akcję: rozwijanie karty, pojawienie się wyników, potwierdzenie.
- Zakazane: wjazdy sekcji przy przewijaniu, hover-przechylanie wszystkich kart, paralaksa, pływające liście.
- `@media (prefers-reduced-motion: reduce)` wyłącza wszystko, w tym animację liter.

---

## 10. Tryb prosty (obowiązkowy)

Przełącznik „Prosty widok" w nagłówku, zapamiętany w `localStorage`. Po włączeniu:
- zero kolażu (zwykłe nagłówki),
- jeden liść lub brak liści,
- czcionka 20 px, linie 1,7, maks. 3 wyniki,
- większy kontrast ramek (3 px),
- brak animacji.

---

## 11. Język interfejsu (po polsku, prosto)

- Pisz tak, jak mówi pracownik OPS do mieszkańca: krótkie zdania, czasowniki, bez żargonu („zgłoszenie", nie „ticket"; „plan wdrożenia", nie „implementation roadmap").
- Pisownia zdaniowa. Bez wykrzykników.
- Ta sama akcja ma tę samą nazwę wszędzie: „Szukaj" → wyniki „Znaleziono…"; „Pobierz plan (PDF)" → komunikat „Plan pobrany".
- Przykładowe hasła nagłówkowe (do kolażu): „Z czym masz kłopot?", „Co już działa", „Dostosuj do siebie", „Zapytaj mentora", „Nic tu jeszcze nie ma".

---

## 12. Tokeny: Tailwind i CSS

Kolory i cienie to tokeny CSS w `@theme` (`app/globals.css`), bo tryb kontrastu musi je podmieniać w locie. `tailwind.config.ts` (przez `@config`) trzyma tylko kroje, skalę tekstu, promień i szerokość treści.

```css
/* app/globals.css (fragment) */
@theme {
  --color-*: initial;            /* bez domyślnej palety Tailwinda */
  --color-background: #f4fbf8;
  --color-surface: #ffffff;
  --color-secondary: #c2d2b8;
  --color-foreground: #412722;
  --color-muted: #5e4b46;
  --color-border: #5f7568;
  --color-primary: #345995;
  --color-primary-hover: #284778;
  --color-primary-foreground: #ffffff;
  --color-accent: #f4845f;
  --color-accent-foreground: #412722;
  --color-success: #2e6b45;
  --color-warning: #7a4e00;
  --color-destructive: #a3322a;
  --color-focus: #1f3f73;
  --color-overlay: #412722;
  --shadow-raised: 0 12px 24px color-mix(in srgb, var(--color-foreground) 16%, transparent);
}

html[data-contrast="high"] { --color-background: #000000; --color-foreground: #fff500; /* … */ }

:focus-visible { outline: 3px solid var(--color-focus); outline-offset: 3px; }
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation: none !important; transition: none !important; }
}
```

SVG i wykresy (recharts, kartogram) dostają tokeny jako `var(--color-…)` / `var(--map-…)`, nigdy hex.

---

## 13. Zasady dla AI (wklej na początku sesji vibe-codingu)

1. Czytaj ten plik. Nie wprowadzaj nowych kolorów ani krojów bez uzasadnienia. Kolory tylko przez tokeny z sekcji 3, nigdy hex w komponencie.
2. Kolaż (ransom note) tylko w logo, hero, tytułach sekcji i pustych stanach, w komponencie `<CutoutText>` z `aria-label`.
3. Każdy tekst: kontrast ≥ 4,5:1, rozmiar ≥ 16 px (treść 18 px), cele dotykowe ≥ 48 px.
4. Cała aplikacja działa bez myszy: widoczny focus, logiczna kolejność, `aria-live` dla zmian wyników i dyktowania.
5. Liście monstery są `aria-hidden` i nie leżą pod tekstem.
6. Nie dodawaj animacji poza opisaną w sekcji 9. Szanuj `prefers-reduced-motion`.
7. Każdy ekran ma działającą wersję w trybie prostym.
8. Teksty po polsku, proste, bez żargonu. Nie używaj prawdziwych danych osobowych w przykładach.
9. Po zbudowaniu ekranu uruchom Lighthouse i axe, popraw błędy i dopiero potem przechodź dalej.

---

## 14. Lista kontrolna przed oddaniem

- [ ] Polskie znaki wyświetlają się poprawnie we wszystkich krojach z puli
- [ ] Nagłówki kolażowe mają `aria-label` i nie zawierają więcej niż 6 słów
- [ ] Tryb prosty działa na każdym ekranie
- [ ] Kontrast sprawdzony narzędziem (axe / Lighthouse) bez błędów krytycznych
- [ ] Nawigacja samą klawiaturą od pola problemu do pobrania planu
- [ ] Dyktowanie ma wersję zastępczą (przeglądarka bez wsparcia)
- [ ] Ekran z komunikatem „nie znalazłem" i ekran kryzysowy zaprojektowane
- [ ] Makiety UX/UI wyeksportowane do prezentacji (PDF, maks. 10 slajdów)