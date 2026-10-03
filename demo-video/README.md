# Film demo HubMI (60 s, 1920×1080)

Gotowy plik: `hubmi-demo.mp4`.

## Jak powstał

1. **Nagrania** (`capture/`): Playwright klika po działającej aplikacji (`localhost:3000` + `:8000`) i zapisuje klatki z CDP screencast ze znacznikami czasu.
   ```bash
   cd capture && npm i playwright && npx playwright install chromium
   node capture.mjs            # wszystkie sceny; albo: node capture.mjs search admin
   ```
   Klatki trafiają do `../remotion/public/clips/<scena>/`.
2. **Montaż** (`remotion/`): Remotion składa nagrania (tempo, kamera, napisy, przejścia).
   ```bash
   cd remotion && npm i
   node gen-meta.mjs           # znaczniki czasu nagrań → src/clipMeta.ts
   npm run studio              # podgląd na żywo
   node render.mjs frames      # render klatek
   python encode.py frames out/hubmi-demo.mp4   # wymaga: pip install av pillow
   ```

Teksty napisów są w `src/scenes/AppScenes.tsx`, a tempo i kamera każdej sceny w `src/shots.ts`.

## Uwagi

- Na tym Windowsie Smart App Control blokuje niepodpisany `ffmpeg.exe` z Remotion, dlatego MP4 koduje PyAV (`encode.py`). Z tego samego powodu `render.mjs` wskazuje Chrome z Playwrighta przez krótką ścieżkę 8.3 (`MICHAJ~1`), bo ścieżka z „ł” psuje start przeglądarki.
- Middleman szuka innowacji w pustej tabeli `findinv.db`, a 115 innowacji jest w `zasobnik.db`. Bez poprawki pokazuje „Innowacja społeczna” zamiast tytułu. Na potrzeby nagrania `capture.mjs` dokłada do zapytania prawdziwy tytuł i opis (`page.route`).
