"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { ChevronDown, ChevronUp, Loader2 } from "lucide-react";

import { formatNumber } from "@/components/malopolska-stats";
import { MatchCard } from "@/components/match-card";
import { Button } from "@/components/ui/button";
import { MOCK_GAP_INDEX, type GapEntry } from "@/data/innovations";
import { getGapIndex, getPulse, type GminaPulse } from "@/lib/knowledge";
import { cn, plural } from "@/lib/utils";

// Indeks Luki Innowacyjnej: gdzie problemów jest dużo, a innowacji mało („białe plamy”).
// Jedna seria → jeden kolor (leaf), bez legendy; słupki ≤ 24 px z zaokrąglonym końcem, wartość przy końcu słupka
// w kolorze tekstu. Każdy wiersz jest też zwykłym tekstem, więc wykres nie potrzebuje osobnej tabeli.

type GapIndexProps = {
  /** Ile powiatów pokazać (np. 3 na stronie głównej). Bez limitu: wszystkie + „Puls powiatu”. */
  limit?: number;
};

function Pulse({ entry }: { entry: GapEntry }) {
  const [pulse, setPulse] = useState<GminaPulse | null>(null);

  useEffect(() => {
    getPulse(entry.powiat, entry.top_area).then(setPulse);
  }, [entry.powiat, entry.top_area]);

  if (!pulse) {
    return (
      <p role="status" className="flex items-center gap-2 text-muted">
        <Loader2 aria-hidden="true" className="size-5 animate-spin" />
        Wczytuję dane powiatu…
      </p>
    );
  }

  return (
    <div className="grid gap-6">
      <div>
        <h4 className="text-lg font-bold text-deep">Najważniejsze wyzwania</h4>
        {pulse.top_challenges.length ? (
          <ul className="mt-3 grid gap-3 md:grid-cols-3">
            {pulse.top_challenges.map((challenge) => (
              <li key={challenge.id} className="border-l-4 border-leaf bg-paper py-3 pr-3 pl-4">
                <p className="font-bold text-deep">{challenge.title}</p>
                <p className="mt-1">
                  <span className="text-xl font-bold text-deep tabular-nums">
                    {formatNumber(challenge.indicator_value)}
                  </span>{" "}
                  {challenge.indicator_unit}
                </p>
                <p className="mt-1 text-sm text-muted">
                  {challenge.source}, {challenge.data_year} r.
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-muted">Brak szczegółowych wskaźników dla tego powiatu.</p>
        )}
      </div>
      <div>
        <h4 className="text-lg font-bold text-deep">Co może pomóc</h4>
        <ul className="mt-3 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {pulse.matching_innovations.map((innovation) => (
            <li key={innovation.id} className="flex">
              <MatchCard
                innovation={innovation}
                headingLevel="h5"
                query={`Powiat ${entry.powiat}: ${entry.top_area}`}
              />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function GapIndex({ limit }: GapIndexProps) {
  const ids = useId();
  const [entries, setEntries] = useState<GapEntry[]>(MOCK_GAP_INDEX);
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    getGapIndex().then(setEntries);
  }, []);

  const sorted = [...entries].sort((a, b) => b.gap_score - a.gap_score);
  const visible = limit ? sorted.slice(0, limit) : sorted;
  const scaleMax = Math.max(1, Math.ceil(Math.max(...entries.map((entry) => entry.gap_score))));

  return (
    <div>
      <p id={`${ids}-skala`} className="text-sm text-muted">
        Indeks od 0 do {scaleMax}. Im dłuższy pasek, tym więcej problemów i mniej sprawdzonych rozwiązań w powiecie.
      </p>
      <ol className="mt-4 grid gap-3">
        {visible.map((entry, index) => {
          const width = Math.max(2, (entry.gap_score / scaleMax) * 100);
          const panelId = `${ids}-puls-${index}`;
          const expanded = open === entry.powiat;
          return (
            <li key={entry.powiat} className="border-(length:--bw) border-deep bg-surface">
              <div className="grid items-center gap-x-6 gap-y-2 p-4 md:grid-cols-[11rem_minmax(0,1fr)_15rem]">
                <h3 className="text-lg font-bold text-deep">
                  <span className="sr-only">{index + 1}. </span>Powiat {entry.powiat}
                </h3>

                <div className="flex items-center gap-3">
                  <div className="relative h-6 flex-1 border-l border-muted" aria-hidden="true">
                    <div className="h-full rounded-r-[4px] bg-leaf" style={{ width: `${width}%` }} />
                  </div>
                  <p className="w-24 shrink-0 tabular-nums">
                    <span className="sr-only">Indeks luki: </span>
                    <span className="font-bold text-deep">{formatNumber(entry.gap_score)}</span>
                    <span className="sr-only"> z {scaleMax}</span>
                  </p>
                </div>

                <p className="text-base">
                  Najczęściej: <span className="font-bold">{entry.top_area}</span>
                  <br />
                  <span className="text-muted">
                    {entry.innovations_count} {plural(entry.innovations_count, "innowacja", "innowacje", "innowacji")} w
                    Bibliotece
                  </span>
                </p>
              </div>

              {!limit && (
                <div className="border-t-2 border-sage px-4 py-3">
                  <Button
                    type="button"
                    variant="secondary"
                    aria-expanded={expanded}
                    aria-controls={panelId}
                    onClick={() => setOpen(expanded ? null : entry.powiat)}
                  >
                    {expanded ? <ChevronUp aria-hidden="true" /> : <ChevronDown aria-hidden="true" />}
                    {expanded ? "Zwiń" : "Puls powiatu"}
                    <span className="sr-only"> {entry.powiat}</span>
                  </Button>
                  <div id={panelId} hidden={!expanded} className={cn(expanded && "mt-5 pb-2")}>
                    {expanded && <Pulse entry={entry} />}
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ol>
      {limit && sorted.length > limit && (
        <Link
          href="/luka-innowacyjna"
          className="mt-6 inline-flex min-h-12 items-center font-bold text-leaf underline underline-offset-4 hover:text-deep"
        >
          Zobacz wszystkie powiaty i puls każdego z nich
        </Link>
      )}
    </div>
  );
}
