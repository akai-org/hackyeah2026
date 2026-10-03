# DESIGN.md – HubMI.pl (Małopolski Hub Innowacji Społecznych)

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
4. **Papier, nie plastik.** Elementy wyglądają jak karteczki przyklejone do tablicy: lekkie przesunięcie, twardy mały cień, brak gradientów i rozmytych poświat.
5. **Ruch tylko na prośbę użytkownika** (plus jeden wyjątek, patrz sekcja 9).
6. **Tryb prosty.** Użytkownik może jednym przyciskiem wyłączyć cały kolaż. Zostaje czysty zielony interfejs.

---

## 3. Kolory

Wszystkie pary kontrastów poniżej policzone wg WCAG (wartości po dwukropku to współczynniki kontrastu). Wymagane minimum: 4,5:1 dla zwykłego tekstu, 3:1 dla dużego tekstu i elementów interfejsu.

| Nazwa | Hex | Rola |
|---|---|---|
| **Papier** (`paper`) | `#EEF3EA` | tło strony |
| **Biała kartka** (`surface`) | `#FAFCF7` | karty, pola, panele z treścią |
| **Szałwia** (`sage`) | `#D3E3D0` | tło sekcji, drugie tło, litery kolażu |
| **Mięta** (`mint`) | `#B8DCC4` | zaznaczenie, aktywne chipy, litery kolażu |
| **Masło** (`butter`) | `#F2E2A0` | jedyny ciepły akcent: wycięte litery, plakietka „wstępne wyniki" |
| **Głęboka monstera** (`deep`) | `#1B4332` | nagłówki, główne przyciski, ramka focusu |
| **Liść** (`leaf`) | `#2D6A4F` | linki, ikony, stany aktywne |
| **Atrament** (`ink`) | `#14251C` | tekst podstawowy |
| **Mech** (`muted`) | `#3D5A4A` | tekst pomocniczy |
| **Alarm** (`alert`) | `#8A2D1F` | błędy i ostrzeżenia (zawsze z ikoną i tekstem) |

**Sprawdzone kontrasty:**
- `ink` na `paper` 14,22 · na `surface` 15,51 · na `sage` 11,95 · na `mint` 10,73 · na `butter` 12,33
- `muted` na `paper` 6,76 · na `surface` 7,37 · na `sage` 5,68
- `deep` na `paper` 9,84 · na `sage` 8,27 · na `butter` 8,53
- `surface` na `deep` 10,73 · `surface` na `leaf` 6,19 (tekst na przyciskach)
- `leaf` na `paper` 5,67 · na `surface` 6,19 (linki)
- `alert` na `surface` 8,21 · na `paper` 7,53

**Zakazy:** żadnych gradientów jako ozdoby; żadnego tekstu na liściach; nie używać `butter` jako tła dużych obszarów (to przyprawa, nie danie); informacja nigdy nie jest przekazywana samym kolorem.

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

Nagłówki zwykłe: Atkinson 700, kolor `deep`. **Bez WIELKICH LITER w etykietach**, bez zbędnych etykiet nad nagłówkami. Pisownia zdaniowa.

---

## 5. Układ i kształty

- Szerokość treści: maks. 1120 px, wyśrodkowana. Tekst wyrównany **do lewej** (nigdy justowany, nigdy centrowany w akapitach). Wyjątek: hero może być do lewej z liściem po prawej.
- Siatka odstępów: 4 px (`4, 8, 12, 16, 24, 32, 48, 72`).
- **Dwa rodzaje krawędzi:**
  - **Kartki dekoracyjne** (nagłówki, plakietki, litery): lekko nieregularny wielokąt przez `clip-path`, rotacja −3° do +3°.
  - **Elementy interaktywne** (przyciski, pola, chipy): prosty zaokrąglony prostokąt, promień 12 px, bo muszą wyglądać jak coś, w co można kliknąć.
- **Cień:** jeden, twardy, mały: `3px 3px 0 rgba(27, 67, 50, 0.25)` dla kartek, brak cienia dla pól i przycisków (mają ramkę 2 px).
- **Ramki pól i przycisków:** 2 px `deep`. Obszary dotykowe minimum **48 × 48 px**.

### Struktura strony głównej (szkic)

```
┌────────────────────────────────────────────────────────┐
│ [logo kolażowe: HubMI]        Biblioteka  Pomoc  [Prosty widok] │
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
- Tło: losowo z `paper`, `surface`, `sage`, `mint`, `butter` (maks. 1 na 5 liter w `butter`).
- Tekst: `ink` lub `deep`. **Kontrast każdej litery z jej tłem ≥ 4,5:1.** Wszystkie kombinacje z tabeli wyżej spełniają ten warunek.
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
- Przy `prefers-reduced-motion` oraz w „Prostym widoku" wyświetlamy zwykły nagłówek Atkinson 700 w kolorze `deep`, bez kolażu.

### 6.5 Gdzie wolno / gdzie nie wolno
| Wolno | Nie wolno |
|---|---|
| logo „HubMI", nagłówek strony głównej | akapity i opisy |
| tytuły sekcji (krótkie) | etykiety pól i przycisków |
| puste stany („Nic tu jeszcze nie ma") | komunikaty błędów |
| nagłówek karty wdrożeniowej (PDF) | tytuły kart innowacji z długimi nazwami |

---

## 7. Monstera

- **Format:** własne SVG (lub wygenerowane przez AI i uproszczone). Jednokolorowe, płaskie, z charakterystycznymi dziurami i nacięciami liścia, bez gradientów.
- **Kolory liści:** `mint` i `sage` (tło), `leaf` i `deep` dla jednego akcentowego liścia. Opacity 100%, bo kolory są już spokojne.
- **Pozycjonowanie:** liście wyłażą spoza krawędzi ekranu (hero: prawy górny róg; stopka: lewy dolny róg; puste stany: pod napisem). Maks. 2 liście widoczne na ekranie jednocześnie.
- **Dostępność:** `aria-hidden="true"`, `pointer-events: none`, `role="presentation"`. Nigdy nie wchodzą pod tekst treści. Zostawiamy minimum 24 px wolnej przestrzeni od tekstu.
- **Mobile:** jeden liść, mniejszy, w rogu nagłówka.
- Liście jako „wycinki": jeden liść w hero może mieć obrys papieru (biała ramka 6 px i twardy cień), żeby spinał świat monstery z kolażem.
- **Tło papierowe (opcjonalnie):** bardzo delikatna tekstura szumu (opacity ≤ 4%), wbudowana w CSS jako SVG `feTurbulence`. Nie może pogarszać kontrastu.

---

## 8. Komponenty

### Pole „Opisz problem"
- Textarea 3 linijki, min. wysokość 120 px, ramka 2 px `deep`, tło `surface`, promień 12 px.
- Widoczna etykieta nad polem: „Opisz swój problem". Placeholder tylko jako podpowiedź, nie zamiennik etykiety.
- Obok przyciski: **Mikrofon** (ikona + tekst „Podyktuj") oraz **Szukaj**. Na wąskim ekranie pod polem.
- Mikrofon: stan nagrywania wyraźnie widoczny i czytany przez `aria-live`: „Nagrywam…", „Gotowe, sprawdź tekst". Obok krótka informacja o przetwarzaniu mowy. Przycisk ukrywany tam, gdzie przeglądarka nie obsługuje dyktowania.
- Przykłady problemów jako chipy pod polem (po kliknięciu wpisują tekst).

### Przyciski
- **Główny:** tło `deep`, tekst `surface`, ramka 2 px `deep`, wysokość min. 48 px, tekst 18 px/700. Hover: tło `leaf`. Active: przesunięcie o 1 px.
- **Drugorzędny:** tło `surface`, tekst `deep`, ramka 2 px `deep`.
- **Etykiety opisują akcję:** „Szukaj", „Dostosuj do mojej instytucji", „Pobierz plan (PDF)". Nie „Dalej" i nie „Wyślij".
- Brak strzałek `→` doklejanych do przycisków.

### Chipy tagów („Zrozumiałem: …")
- Tło `mint`, tekst `ink`, ramka 2 px `deep`, wysokość min. 40 px (dotyk 48 px z paddingiem).
- Z przyciskiem usunięcia (`✕`), który ma `aria-label="Usuń tag samotność"`.
- Po zmianie tagów lista wyników nie odświeża się sama, tylko pojawia się przycisk „Zaktualizuj wyniki".

### Karta innowacji
- Tło `surface`, ramka 2 px `deep`, delikatnie przechylona tylko na hoverze **nie** (karty stoją prosto, bo zawierają treść). Dekoracyjny „kawałek taśmy" (prostokąt `butter` przechylony o 4°, `aria-hidden`) w górnym rogu.
- Zawartość: tytuł, „Dlaczego pasuje" (cytat z karty), odznaka dowodu skuteczności (ikona + słowo: Sprawdzone / Wstępne / Brak danych), dwa przyciski.
- Cytat w `blockquote` z lewą pionową linią 4 px `leaf`.

### Plakietka „Wstępne wyniki"
- Tło `butter`, tekst `deep`, ikona zegara, rola `status`, `aria-live="polite"`. Po zakończeniu zamienia się w „Wyniki dopracowane" i znika po 4 sekundach (nie znika przy czytniku ekranu przed odczytaniem).

### Plan wdrożenia („Middleman")
- Zwykły dokument na `surface` z nagłówkami Atkinson. Kolaż tylko w tytule.
- Wyraźny pasek: „To jest szkic. Sprawdź koszty i przepisy przed wdrożeniem." Tło `sage`, ikona informacji.
- Sekcje: Cel · Kto realizuje · Czego potrzeba · Etapy (30/60/90 dni) · Ryzyka · Do uzupełnienia.
- Braki oznaczone tekstem „do uzupełnienia" z ikoną, nie samym kolorem.

### Komunikaty
- Błędy: ikona + tekst w `alert` na `surface`, ramka `alert` 2 px, `role="alert"`. Mówią, co się stało i co zrobić. Nie przepraszają.
- Pusty wynik: „Nie znalazłem pasującej innowacji. Wybierz najbliższy obszar albo opisz problem inaczej." Poniżej 3 kategorie z Mapy Wyzwań. Zgłoszenie zapisuje się jako luka dla ROPS.
- Kryzys (słowa wskazujące przemoc, myśli samobójcze): zamiast wyników spokojny panel z numerami pomocowymi, bez kolażu i bez ozdób.

### Focus
- Każdy element interaktywny: `outline: 3px solid #1B4332; outline-offset: 3px;` a na tle `deep` (np. przycisk główny): dodatkowy biały pierścień `box-shadow: 0 0 0 3px #FAFCF7`. Nigdy `outline: none` bez zamiennika.

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

```ts
// tailwind.config.ts (fragment)
export default {
  theme: {
    extend: {
      colors: {
        paper:   "#EEF3EA",
        surface: "#FAFCF7",
        sage:    "#D3E3D0",
        mint:    "#B8DCC4",
        butter:  "#F2E2A0",
        deep:    "#1B4332",
        leaf:    "#2D6A4F",
        ink:     "#14251C",
        muted:   "#3D5A4A",
        alert:   "#8A2D1F",
      },
      fontFamily: {
        body: ["Atkinson Hyperlegible", "system-ui", "Segoe UI", "Roboto", "sans-serif"],
        cut1: ["Abril Fatface", "serif"],
        cut2: ["Alfa Slab One", "serif"],
        cut3: ["Playfair Display", "serif"],
        cut4: ["Courier Prime", "monospace"],
        cut5: ["Bitter", "serif"],
      },
      fontSize: {
        sm:   ["1rem",    { lineHeight: "1.5" }],
        base: ["1.125rem",{ lineHeight: "1.6" }],
        lg:   ["1.3125rem",{ lineHeight: "1.55" }],
        xl:   ["1.625rem",{ lineHeight: "1.3" }],
        "2xl":["2.125rem",{ lineHeight: "1.2" }],
      },
      borderRadius: { ui: "12px" },
      boxShadow: { paper: "3px 3px 0 rgba(27, 67, 50, 0.25)" },
    },
  },
};
```

```css
:root { color-scheme: light; }
body { background: #EEF3EA; color: #14251C; font-size: 1.125rem; }
:focus-visible { outline: 3px solid #1B4332; outline-offset: 3px; }
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation: none !important; transition: none !important; }
}
```

---

## 13. Zasady dla AI (wklej na początku sesji vibe-codingu)

1. Czytaj ten plik. Nie wprowadzaj nowych kolorów ani krojów bez uzasadnienia.
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