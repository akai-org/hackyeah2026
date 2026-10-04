# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Primary — Residents & NGOs:** People with a social problem (loneliness, senior isolation, digital exclusion) who need a concrete, proven solution, not a Google search. They describe their problem in plain language or by voice and expect ranked, relevant results immediately.

**Primary — Municipal officials:** Civil servants at gminny level who have found a relevant innovation and need a practical implementation plan for their specific institution — budget, timeline, steps. They use the Middleman AI feature.

**Secondary — ROPS workers:** Regional social policy officers who manage the innovation database, verify submissions, and monitor platform trends via the admin panel.

**Supporting — Innovation testers & consultants:** People who pilot innovations and give structured feedback, or domain experts who answer questions in the forum.

**Auth model:** No real authorization. Users click "Zaloguj się" → pick a role (mieszkaniec / tester / konsultant / admin) → receive a UUID session cookie. This is a hackathon demo.

## Product Purpose

findinv (presented publicly as HubMI.pl) closes the gap between Małopolska's validated social innovations and the people who need them. Dozens of proven programs — for seniors, lonely residents, digitally excluded citizens — exist in ROPS Kraków's library but are invisible to most municipalities and NGOs. The platform matches plain-language problem descriptions to the right innovations via AI, then helps institutions understand how to actually implement them.

Success means: a jury evaluator describes a real social problem, sees five relevant, credible innovations within seconds, and can drill into a step-by-step implementation guide — all in under four minutes of live demo.

## Positioning

The autotagger + semantic search pipeline turns an unstructured human problem description into a ranked shortlist of verified ROPS innovations — without the user knowing any taxonomy or keywords. A plain innovation database cannot do this; it requires the user to already know what to search for.

## Operating Context

Built in 24 hours at HackYeah 2026 (Tauron Arena Kraków, 3–4 October 2026). Deadline: 4 October 11:00. Jury evaluation is the only production event. The platform runs locally or on a single-server deploy for the demo; no scaling, SLA, or post-hackathon operations are planned.

The demo flow the jury will see:
1. Homepage with live Małopolska stats (SSR, revalidates every 2 min)
2. Matchmaking: type or speak a problem → see autotag chips → 5 innovation cards → RAG chat
3. Innovation detail → Middleman AI → implementation plan (streaming)
4. Admin panel: stats, trends, manage innovations

## Capabilities and Constraints

**Working:**
- `/wyniki` — voice input (Web Speech API), LLM autotagger, ChromaDB semantic match, 5 result cards, RAG streaming chat
- `/biblioteka` — filterable innovation list; `/biblioteka/[id]` — detail with print, copy link, Middleman trigger
- `/innowacje/[id]` — standalone innovation detail page
- `/wdrozenie` — Middleman AI as a standalone route (reached from result cards via `?innowacja={id}&problem={desc}`)
- `/edukacja` — searchable/filterable list of real ROPS educational materials (markdown-rendered)
- `/wnioski` — grant generator (GrantGenerator component; AI analysis mocked)
- `/luka-innowacyjna` — gap index visualization (GapIndex component; mock data)
- `/wyzwania` — challenges browser (mock data)
- `/kreator` — idea form with mock AI analysis
- `/admin/*` — stats, trends (Recharts), innovation/user/idea/needs/engagement management, CSV export; sub-pages: statystyki, trendy, innowacje, pomysly, potrzeby, uzytkownicy, testy, forum, zaangazowanie
- `/forum`, `/testerzy`, `/testerzy/panel` — forum threads with role badges, tester signup and panel
- `/deklaracja-dostepnosci` — legal accessibility declaration (WCAG compliance statement)
- MiddlemanModal — 2-turn AI dialog (follow-up question → implementation plan), SSE streaming, focus trap

**i18n:** Cookie-based language switcher (`lang` cookie). Supported locales: `pl` (Polish, default), `en` (English), `uk` (Ukrainian). All UI strings are translated; backend data re-fetches on language change.

**Constraints / known mocks:**
- Auth is role-picker only — no passwords, no verification
- 115 real innovations in SQLite + ChromaDB (seeded via seed_demo.py / embed_to_chroma.py)
- Kreator AI analysis is mocked (no real grant generation)
- Gmina Pulse map data is mocked; challenges and gap index use mock_data.py
- No real user accounts, no persistent session state beyond cookie

**Stack:** Next.js 16 App Router · React 19 · Tailwind CSS v4 · FastAPI (Python 3.12) · SQLite (aiosqlite + SQLAlchemy) · ChromaDB · OpenRouter (LLM: Claude Haiku for fast tasks, stronger model for Middleman)

## Brand Commitments

**Name:** findinv (internal/repo name); HubMI.pl (challenge brief / public-facing label). No logo exists.

**Color palette (committed — do not change):**
- `deep` #1B4332 — primary dark green; focus rings, headings, strong UI
- `leaf` #2D6A4F — secondary green; interactive accents
- `ink` #14251C — body text
- `muted` #3D5A4A — secondary text
- `paper` #EEF3EA — page background (with subtle paper texture)
- `surface` #FAFCF7 — card / panel background
- `sage` #D3E3D0 — borders, dividers
- `mint` #B8DCC4 — selection highlight, tags
- `butter` #F2E2A0 — warm accent (callouts)
- `alert` #8A2D1F — errors, warnings

**Typography (committed):**
- Primary: Atkinson Hyperlegible — accessibility-first, used for all body and UI text
- Display / CutoutText: Abril Fatface, Alfa Slab One, Playfair Display, Courier Prime, Bitter — used only in the collage heading component

**Signature component:** CutoutText — ransom-note collage heading with per-character rotation, clip-path pieces, drop-shadow, and a stick-in animation. Used on 404 and homepage heroes.

**Accessibility mode:** `data-simple="true"` on `<html>` disables all animations, removes paper texture, bumps font size to 111% and line-height to 1.7. Every UI element must work in this mode.

**Background:** Subtle SVG fractal noise texture at ≤4% opacity on `paper` background. Disabled in simple mode and print.

## Evidence on Hand

- 115 real innovations from ROPS Biblioteka Innowacji Społecznych (seeded via embed_to_chroma.py and seed_demo.py)
- Mock challenges, gap index, Małopolska stats, forum posts (mock_data.py)
- No real user testimonials, no production metrics, no real grant data — do not fabricate any.

## Product Principles

1. **Match immediately** — the autotagger and semantic search must feel instant and accurate; no dead ends, no "no results" on a real problem description.
2. **Institutional first** — every innovation card and implementation plan must be legible to a non-technical civil servant, not a developer or researcher.
3. **Honest mocks** — mock data is clearly presented as demo data; no fake authority or fabricated proof.
4. **Accessibility as default** — Atkinson Hyperlegible, WCAG AA, data-simple mode, and reduced-motion support are structural, not optional enhancements.
5. **Demo confidence** — the four-minute jury flow must feel complete, polished, and real at every step; dead states and error screens must never appear.

## Accessibility & Inclusion

WCAG AA target. Atkinson Hyperlegible as the primary font. Full data-simple accessibility mode: larger text, no animations, no decorative textures. `prefers-reduced-motion` kills all animations and transitions unconditionally. Dynamic page titles on all client pages (WCAG 2.4.2). MiddlemanModal has a full focus trap and ARIA labeling.
