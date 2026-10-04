"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, MapPin, Users } from "lucide-react";

import type { InnovationCard } from "@/data/innovations";
import { apiFetch } from "@/lib/api";

// „Artykuł dnia”: jedna innowacja z Biblioteki ROPS, losowana według daty — przez cały dzień ta sama dla
// wszystkich (nie skacze po odświeżeniu), następnego dnia inna. Archiwalne nie biorą udziału.

/** Numer dnia w kalendarzu lokalnym — zmienia się o północy, nie o północy UTC. */
function dayNumber(date: Date) {
  return Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000);
}

/** Rozrzuca kolejne dni po katalogu, żeby dzień po dniu nie trafiały sąsiednie karty. */
function pickIndex(day: number, total: number) {
  return (day * 7919) % total;
}

function shorten(text: string, max: number) {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, clean.lastIndexOf(" ", max)).replace(/[,;:.]$/, "")}…`;
}

type Page = { innovations?: InnovationCard[]; total?: number };

/** Prosto z API, bez zapasowych danych przykładowych — artykuł dnia ma być prawdziwą innowacją albo żadną. */
function fetchPage(offset: number) {
  return apiFetch<Page>(`/api/innovations?include_archived=false&limit=1&offset=${offset}`);
}

async function innovationOfTheDay(): Promise<InnovationCard | null> {
  // Najpierw sama liczba innowacji, potem ta jedna — bez pobierania całego katalogu.
  const { total } = await fetchPage(0);
  if (!total) return null;
  const { innovations } = await fetchPage(pickIndex(dayNumber(new Date()), total));
  return innovations?.[0] ?? null;
}

/** Cała sekcja „Artykuł dnia”. Gdy API nie zwróci innowacji — sekcja się chowa (nic nie zmyślamy). */
export function InnovationOfTheDaySection({ id }: { id: string }) {
  const headingId = `${id}-tytul`;
  const [innovation, setInnovation] = useState<InnovationCard | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "empty">("loading");

  useEffect(() => {
    let active = true;
    innovationOfTheDay()
      .then((found) => {
        if (!active) return;
        setInnovation(found);
        setState(found ? "ready" : "empty");
      })
      .catch(() => active && setState("empty"));
    return () => {
      active = false;
    };
  }, []);

  if (state === "empty") return null;

  return (
    <section id={id} data-reveal aria-labelledby={headingId} className="border-y-(length:--bw) border-border">
      <div className="mx-auto max-w-content px-4 py-10 sm:px-6 lg:py-12">
        <article className="mx-auto max-w-3xl border-(length:--bw) border-border bg-surface p-6 shadow-raised md:p-8">
          <p className="text-sm font-medium text-muted">Artykuł dnia z Biblioteki Innowacji ROPS</p>
          {innovation ? <InnovationBody innovation={innovation} headingId={headingId} /> : <Skeleton headingId={headingId} />}
        </article>
      </div>
    </section>
  );
}

function Skeleton({ headingId }: { headingId: string }) {
  return (
    <div aria-busy="true">
      <h2 id={headingId} className="sr-only">
        Wczytuję artykuł dnia
      </h2>
      <div aria-hidden="true" className="mt-2 h-8 w-3/4 animate-pulse rounded-ui bg-secondary" />
      <div aria-hidden="true" className="mt-4 h-5 w-full animate-pulse rounded-ui bg-secondary" />
      <div aria-hidden="true" className="mt-2 h-5 w-5/6 animate-pulse rounded-ui bg-secondary" />
    </div>
  );
}

function InnovationBody({ innovation, headingId }: { innovation: InnovationCard; headingId: string }) {
  return (
    <>
      <h2 id={headingId} className="mt-2 text-2xl font-bold text-foreground">
        {innovation.title}
      </h2>
      {innovation.category && (
        <p className="mt-2 inline-flex rounded-ui border-2 border-border bg-secondary/60 px-3 py-0.5 text-sm font-medium text-foreground">
          {innovation.category}
        </p>
      )}
      <p className="mt-3 max-w-[65ch] text-lg">{shorten(innovation.short_desc, 280)}</p>
      <dl className="mt-4 space-y-2">
        {innovation.target_group && (
          <div className="flex items-start gap-2">
            <dt>
              <Users aria-hidden="true" className="mt-1 size-5 text-primary" />
              <span className="sr-only">Dla kogo</span>
            </dt>
            <dd>{shorten(innovation.target_group, 140)}</dd>
          </div>
        )}
        {innovation.where_implemented && (
          <div className="flex items-start gap-2">
            <dt>
              <MapPin aria-hidden="true" className="mt-1 size-5 text-primary" />
              <span className="sr-only">Gdzie działa</span>
            </dt>
            <dd>{shorten(innovation.where_implemented, 140)}</dd>
          </div>
        )}
      </dl>
      <Link
        href={`/innowacje/${innovation.id}`}
        className="mt-5 inline-flex min-h-12 items-center gap-2 font-medium text-primary underline underline-offset-4 hover:text-primary-hover"
      >
        Czytaj całą kartę
        <span className="sr-only">: {innovation.title}</span>
        <ArrowRight aria-hidden="true" className="size-5" />
      </Link>
    </>
  );
}
