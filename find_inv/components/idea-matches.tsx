"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { Loader2, Search } from "lucide-react";

import { MatchCard } from "@/components/match-card";
import type { InnovationCard } from "@/data/innovations";
import { matchInnovations } from "@/lib/matchmaking";

// Pasujące innowacje pod fiszką, na żywo: po ~800 ms bez pisania pytamy POST /api/match.
// Wyniki tylko dokładają się pod fiszką — nic nad nimi nie znika ani nie skacze.

const DEBOUNCE_MS = 800;
const MIN_LENGTH = 15;
const LIMIT = 3;

type IdeaMatchesProps = {
  /** Tekst fiszki albo opisu pomysłu. */
  text: string;
  tags?: string[];
};

export function IdeaMatches({ text, tags = [] }: IdeaMatchesProps) {
  const headingId = useId();
  const query = text.replace(/\s+/g, " ").trim();
  const tagKey = tags.join(",");
  const [results, setResults] = useState<{ query: string; innovations: InnovationCard[] } | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (query.length < MIN_LENGTH) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      setPending(true);
      matchInnovations(query, tagKey ? tagKey.split(",") : [], LIMIT, { log: false })
        .then(({ innovations }) => {
          if (!cancelled) setResults({ query, innovations });
        })
        .finally(() => {
          if (!cancelled) setPending(false);
        });
    }, DEBOUNCE_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, tagKey]);

  if (query.length < MIN_LENGTH && !results) return null;

  return (
    <section aria-labelledby={headingId} className="mt-10 max-w-5xl">
      <h2 id={headingId} className="flex flex-wrap items-center gap-3 text-xl font-bold text-foreground">
        Podobne innowacje, które już działają
        {pending && (
          <span className="inline-flex items-center gap-1.5 text-base font-normal text-muted">
            <Loader2 aria-hidden="true" className="size-4 animate-spin" />
            szukam…
          </span>
        )}
      </h2>
      <p className="mt-1 text-muted">Odświeżają się, gdy piszesz. Może ktoś już robi coś podobnego — warto podpatrzyć.</p>

      {/* Komunikat dla czytnika tylko z liczbą wyników, żeby nie zasypywać go przy każdej zmianie. */}
      <p role="status" aria-live="polite" className="sr-only">
        {results && !pending ? `Znaleziono ${results.innovations.length} podobnych innowacji.` : ""}
      </p>

      {results && results.innovations.length > 0 ? (
        <ul className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {results.innovations.map((innovation, index) => (
            <li key={innovation.id}>
              <MatchCard innovation={innovation} queryTags={tags} query={results.query} rank={index + 1} source="inne" />
            </li>
          ))}
        </ul>
      ) : (
        results && <p className="mt-4">Nie znalazłem jeszcze podobnych innowacji. Dopisz więcej szczegółów.</p>
      )}

      {results && (
        <Link
          href={`/wyniki?q=${encodeURIComponent(results.query.slice(0, 500))}`}
          className="mt-6 inline-flex min-h-12 items-center gap-2 font-bold text-foreground underline underline-offset-4"
        >
          <Search aria-hidden="true" className="size-5" />
          Zobacz więcej wyników
        </Link>
      )}
    </section>
  );
}
