# HackYeah 2026 — Setup narzędzi

Repo z konfiguracją AI skilli dla całego zespołu. Każdy powinien zainstalować te narzędzia przed hackathonm.

## Filozofia

- Żadnego backendu, baz danych ani autoryzacji
- Tylko hardkodowane dane (mocki)
- Tylko happy path
- Liczy się wyłącznie wygląd demo podczas prezentacji

---

## 1. Wymagania

- [Node.js](https://nodejs.org/) (v18+)
- [Claude Code](https://claude.ai/code)

---

## 2. Instalacja skilli (jednorazowo)

Odpal poniższe komendy — instalują wszystkie narzędzia globalnie.

### Impeccable — jakość wizualna UI

```bash
npx impeccable install
```

Wybierz opcję `[1] Detected only` i `project` gdy zapyta o lokalizację.

### Transitions.dev — gotowe CSS animacje

```bash
npx skills add Jakubantalik/transitions-dev
```

### GSAP — profesjonalne animacje JS

```bash
npx skills add https://github.com/greensock/gsap-skills
```

---

## 3. Co masz po instalacji

| Skill | Do czego |
|---|---|
| **impeccable** | Jakość UI — komendy `/polish`, `/delight`, `/bolder`, `/critique` |
| **transitions-dev** | 43+ gotowych CSS transitions (modal, card, icon swap, success check…) |
| **gsap-core** | Tweeny, easing, stagger |
| **gsap-timeline** | Sekwencje animacji |
| **gsap-scrolltrigger** | Animacje przy scrollowaniu — robi wrażenie na demo |
| **gsap-plugins** | Flip, Draggable, SplitText |
| **gsap-react** | GSAP w React (`useGSAP` hook) |
| **gsap-performance** | Optymalizacja animacji |
| **gsap-frameworks** | GSAP w Vue / Svelte |
| **gsap-utils** | Helpery (clamp, mapRange, interpolate) |

---

## 4. Workflow na hackathon

### Krok 1 — init projektu
```
/impeccable init
```
Ustawia kontekst produktu — AI będzie wiedział co budujesz.

### Krok 2 — budowanie UI
Mów AI wprost o animacjach, a skille aktywują się automatycznie:
- _"add a transition to the modal"_ → transitions-dev
- _"animate the dashboard numbers"_ → GSAP
- _"scroll animation on hero section"_ → GSAP ScrollTrigger

### Krok 3 — dopracowanie wyglądu
```
/polish     # poprawia spacing, kolory, spójność
/delight    # dodaje wow factor — animacje, detale
/bolder     # mocniejszy, bardziej wyrazisty design
/critique   # pokazuje co wygląda słabo
```

---

## 5. Prompt do wklejenia na początku sesji

```
Jesteś programistą na hackathonie. Twoim głównym celem jest dowiezienie świetnie wyglądającego dema w jak najkrótszym czasie.

Nie twórz prawdziwej, skomplikowanej logiki biznesowej, backendu, autoryzacji ani baz danych. Skup się w 100% na frontendzie, interfejsie użytkownika (UI/UX) i zrobieniu świetnego pierwszego wrażenia.

Zasady:
- Używaj wyłącznie hardkodowanych danych (mocków)
- Buduj tylko główną ścieżkę użytkownika (happy path)
- Sięgaj po gotowe biblioteki komponentów (shadcn/ui, MUI, Tailwind) zamiast pisać od zera
- Dodawaj fake loading states (spinnery, skeleton loadery) — wyglądają jak prawdziwe dane
- Animacje i przejścia między ekranami robią wrażenie — używaj ich
- Kod ma być jak najprostszy i szybki do napisania

Liczy się wyłącznie to, żeby aplikacja wyglądała na w pełni gotową i sprawną podczas kilkuminutowej prezentacji.
```
