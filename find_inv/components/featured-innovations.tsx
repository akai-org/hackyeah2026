"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Pause, Play } from "lucide-react";

import { MatchCard } from "@/components/match-card";
import { MOCK_INNOVATIONS, type InnovationCard } from "@/data/innovations";
import type { Tag } from "@/data/mock";
import { listInnovations } from "@/lib/knowledge";
import { cn } from "@/lib/utils";

// „Popularne innowacje dla: …” — napis i karty zmieniają się razem, jednym zegarem i jedną animacją
// (łagodne wygaszenie i pojawienie się). Karty pasują do grupy: wyszukiwanie w Bibliotece po słowie kluczowym,
// bez backendu — dane mock po tagu. Rotacja zatrzymuje się po najechaniu, fokusie albo przyciskiem (WCAG 2.2.2).

type Audience = { label: string; search: string; tags: Tag[] };

const AUDIENCES: Audience[] = [
  { label: "Seniorzy", search: "senior", tags: ["seniorzy"] },
  { label: "Niewidomi", search: "niewidom", tags: ["niepełnosprawność", "dostępność"] },
  { label: "Młodzież", search: "młodzież", tags: ["młodzież", "dzieci"] },
  { label: "Migranci", search: "migrant", tags: ["migranci"] },
];

const SHOW_MS = 8000;
const FADE_MS = 450;

function mockFor(audience: Audience): InnovationCard[] {
  return MOCK_INNOVATIONS.filter(
    (innovation) => innovation.status === "active" && audience.tags.some((tag) => innovation.tags.includes(tag)),
  ).slice(0, 3);
}

export function FeaturedInnovations({ headingId, children }: { headingId: string; children?: ReactNode }) {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [byAudience, setByAudience] = useState<InnovationCard[][]>(() => AUDIENCES.map(mockFor));
  const fadeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Wszystkie grupy pobieramy od razu, żeby przy zmianie napisu karty były gotowe (bez migania pustej listy).
  useEffect(() => {
    AUDIENCES.forEach((audience, position) => {
      listInnovations({ search: audience.search, limit: 3 }).then((result) => {
        if (!result.innovations.length) return;
        setByAudience((current) => current.map((list, i) => (i === position ? result.innovations.slice(0, 3) : list)));
      });
    });
  }, []);

  const stopped = paused || hovered;

  useEffect(() => {
    if (stopped) return;
    const interval = setInterval(() => {
      setVisible(false);
      fadeTimer.current = setTimeout(() => {
        setIndex((current) => (current + 1) % AUDIENCES.length);
        setVisible(true);
      }, FADE_MS);
    }, SHOW_MS);
    return () => {
      clearInterval(interval);
      if (fadeTimer.current) clearTimeout(fadeTimer.current);
      setVisible(true);
    };
  }, [stopped]);

  const fade = cn(
    "transition-[opacity,translate] ease-out motion-reduce:transition-none",
    visible ? "translate-y-0 opacity-100" : "translate-y-1.5 opacity-0",
  );

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setHovered(false);
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 id={headingId} className="text-2xl font-medium text-foreground">
          Popularne innowacje dla:{" "}
          <span className={cn("inline-block font-bold text-primary", fade)} style={{ transitionDuration: `${FADE_MS}ms` }}>
            {AUDIENCES[index].label}
          </span>
        </h2>
        <button
          type="button"
          onClick={() => setPaused((current) => !current)}
          aria-pressed={paused}
          className="inline-flex min-h-12 items-center gap-2 font-medium text-primary underline underline-offset-4 hover:text-primary-hover"
        >
          {paused ? <Play aria-hidden="true" className="size-5" /> : <Pause aria-hidden="true" className="size-5" />}
          {paused ? "Wznów zmienianie" : "Zatrzymaj zmienianie"}
        </button>
      </div>

      {children}

      <ul
        className={cn("mt-10 grid auto-rows-fr items-stretch gap-8 md:grid-cols-2 lg:grid-cols-3", fade)}
        style={{ transitionDuration: `${FADE_MS}ms` }}
      >
        {byAudience[index].map((innovation) => (
          <li key={innovation.id} className="hover-lift flex">
            <MatchCard innovation={innovation} />
          </li>
        ))}
      </ul>
    </div>
  );
}
