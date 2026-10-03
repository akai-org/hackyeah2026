---
name: findinv — HubMI.pl
description: Małopolska's civic almanac for social innovation discovery
colors:
  deep: "#0E2A47"
  leaf: "#1D5BA6"
  butter: "#F7E4B0"
  mint: "#D8E6F7"
  sage: "#E9EFF6"
  paper: "#F5F7FA"
  surface: "#FFFFFF"
  ink: "#15202E"
  muted: "#4A5A6E"
  alert: "#B42318"
  line: "#D3DBE5"
  field: "#7B8898"
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
  ui: "8px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  2xl: "48px"
components:
  button-primary:
    backgroundColor: "{colors.leaf}"
    textColor: "{colors.surface}"
    rounded: "{rounded.ui}"
    padding: "8px 20px"
    height: "48px"
  button-primary-hover:
    backgroundColor: "{colors.deep}"
    textColor: "{colors.surface}"
    rounded: "{rounded.ui}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.deep}"
    rounded: "{rounded.ui}"
    padding: "8px 20px"
    height: "48px"
  button-secondary-hover:
    backgroundColor: "{colors.sage}"
    textColor: "{colors.deep}"
    rounded: "{rounded.ui}"
  chip:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.ui}"
    padding: "8px 16px"
    height: "48px"
  chip-hover:
    backgroundColor: "{colors.mint}"
    textColor: "{colors.ink}"
    rounded: "{rounded.ui}"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.ui}"
    padding: "24px"
---

# DESIGN.md – HubMI.pl (Małopolski Hub Innowacji Społecznych)

Plik dla osób i narzędzi AI budujących interfejs. Czytaj go przed każdym nowym ekranem i trzymaj się go. Jeśli coś w kodzie łamie te zasady, popraw kod, nie plik.

---

## 1. Idea w trzech zdaniach

Platforma wygląda jak **rzetelny serwis administracji publicznej**: jasne, chłodne tło, granatowe nagłówki, jeden niebieski akcent i cienkie, jasne ramki. Głównymi odbiorcami są pracownicy gmin, powiatów i ROPS, więc interfejs ma budzić zaufanie i nie rozpraszać. Cała treść (formularze, wyniki, plan wdrożenia) jest bardzo czytelna, bo korzystają z niej także seniorzy i osoby z niepełnosprawnościami.

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

Paleta instytucjonalna dla pracowników gmin, powiatów i ROPS: chłodne, neutralne tło, granat do nagłówków i **jeden niebieski akcent** (kolor administracji publicznej, kojarzony z zaufaniem). Nazwy tokenów zostały z poprzedniej, zielonej wersji, żeby nie przepisywać komponentów; liczy się rola, nie nazwa.

Wszystkie pary kontrastów poniżej policzone wg WCAG. Wymagane minimum: 4,5:1 dla zwykłego tekstu, 3:1 dla dużego tekstu i elementów interfejsu.

| Token | Hex | Rola |
|---|---|---|
| `paper` | `#F5F7FA` | tło strony |
| `surface` | `#FFFFFF` | karty, pola, panele z treścią, nagłówek i stopka |
| `sage` | `#E9EFF6` | tło sekcji, hover przycisków drugorzędnych |
| `mint` | `#D8E6F7` | zaznaczenie, aktywne chipy, tło ikon |
| `butter` | `#F7E4B0` | jedyny ciepły kolor: statusy „do weryfikacji”, „wstępne wyniki” |
| `deep` | `#0E2A47` | nagłówki, tekst przycisków drugorzędnych, focus, hover przycisku głównego |
| `leaf` | `#1D5BA6` | **akcent**: przycisk główny, linki, ikony, pasek nad nagłówkiem, wykresy |
| `ink` | `#15202E` | tekst podstawowy |
| `muted` | `#4A5A6E` | tekst pomocniczy |
| `alert` | `#B42318` | błędy i ostrzeżenia (zawsze z ikoną i tekstem) |
| `line` | `#D3DBE5` | ramki kart, sekcji, tabel i separatory |
| `field` | `#7B8898` | ramki pól formularzy (3,6:1 na białym) |

**Akcenty dodatkowe** (oszczędnie, żeby strona nie była jednolita): tło ikony w jasnym odcieniu, ikona w ciemnym. Nigdy na przyciskach i linkach, te zostają niebieskie. Kolor zawsze idzie w parze z ikoną albo słowem.

| Token | Hex | Gdzie |
|---|---|---|
| `forest` / `forest-soft` | `#1A7F55` / `#DFF2E8` | „Aktywna”, testerzy, „Dobra kondycja”, niski koszt, wykres tagów |
| `ember` / `ember-soft` | `#A84B19` / `#FCE6D8` | „Wymaga uwagi”, „Nieaktualna”, średni koszt |
| `plum` / `plum-soft` | `#6B44A6` / `#ECE5F7` | konsultanci, czwarty kafelek w zestawach |

Zestawy kafelków (kroki, kafelki statystyk, wyzwania, liczniki w panelu) dostają barwy w stałej kolejności: niebieski, zielony, ceglasty, fioletowy. Zestaw sprawdzony walidatorem palet (rozróżnialność także przy daltonizmie, z podpisem tekstowym).

**Mapa i Indeks Luki:** jedna skala zieleni od jasnej (mała luka) do ciemnej (duża luka), `lib/gap-scale.ts`, wspólna dla mapy i listy powiatów.

**Sprawdzone kontrasty:**
- `surface` na `leaf` 6,8 (tekst przycisku głównego) · `surface` na `deep` 14,6
- `leaf` na `surface` 6,8 · na `paper` 6,4 · na `sage` 6,0 · na `mint` 5,5 (linki)
- `muted` na `surface` 7,1 · na `paper` 6,6 · na `sage` 5,9
- `alert` na `surface` 6,4
- `field` na `surface` 3,6 (granica pola)

**Zakazy:** żadnych gradientów jako ozdoby; akcent tylko w kolorze `leaf` (bez drugiego koloru akcentowego); nie używać `butter` jako tła dużych obszarów; informacja nigdy nie jest przekazywana samym kolorem.

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
- **Cień:** jeden, miękki i płytki (`shadow-paper`): `0 1px 2px` + `0 4px 16px` w odcieniu granatu, przezroczystość 6%. Tylko karty i okna dialogowe.
- **Ramki:** 1 px (`--bw`). Karty, sekcje i tabele: `line`. Pola formularzy: `field`. Przycisk główny: ramka w kolorze tła. Obszary dotykowe minimum **48 × 48 px**.
- **Promień:** 8 px (`rounded-ui`) dla wszystkich kart, pól i przycisków.
- **Nagłówek strony:** białe tło, pasek 4 px w kolorze `leaf` u góry, znak „H” w niebieskim kwadracie obok nazwy.

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

## 7. Monstera (wycofana)

> Liście monstery, papierowe chmurki i „taśmy” na kartach zostały usunięte przy przejściu na paletę instytucjonalną. Poniższy opis zostaje tylko jako historia; nie dodawaj tych ozdób z powrotem.

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
- **Główny:** tło `leaf`, tekst `surface`, wysokość min. 48 px, tekst 18 px/700. Hover: tło `deep`. Active: przesunięcie o 1 px.
- **Drugorzędny:** tło `surface`, tekst `deep`, ramka 1 px `field`. Hover: ramka `leaf`, tło `sage`.
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
- Każdy element interaktywny: `outline: 3px solid #0E2A47; outline-offset: 3px;` a na ciemnym tle (np. przycisk główny): dodatkowy biały pierścień `box-shadow: 0 0 0 3px #FFFFFF`. Nigdy `outline: none` bez zamiennika.

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
        paper:   "#F5F7FA",
        surface: "#FFFFFF",
        sage:    "#E9EFF6",
        mint:    "#D8E6F7",
        butter:  "#F7E4B0",
        deep:    "#0E2A47",
        leaf:    "#1D5BA6",
        ink:     "#15202E",
        muted:   "#4A5A6E",
        alert:   "#B42318",
        line:    "#D3DBE5",
        field:   "#7B8898",
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
      borderRadius: { ui: "8px" },
      boxShadow: { paper: "0 1px 2px rgba(14, 42, 71, 0.06), 0 4px 16px rgba(14, 42, 71, 0.06)" },
    },
  },
};
```

```css
:root { color-scheme: light; }
body { background: #F5F7FA; color: #15202E; font-size: 1.125rem; }
:focus-visible { outline: 3px solid #0E2A47; outline-offset: 3px; }
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