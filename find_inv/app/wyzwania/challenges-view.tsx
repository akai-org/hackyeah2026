"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ExternalLink, Search } from "lucide-react";

import { formatNumber } from "@/components/malopolska-stats";
import type { Challenge } from "@/data/innovations";
import { apiFetch } from "@/lib/api";

// Wyzwania społeczne z GET /api/challenges, pogrupowane po obszarze. Każda liczba ma powiat, rok i źródło
// z linkiem. Bez danych z API — komunikat, nie przykładowe karty.

type ApiChallenge = Challenge & { severity?: number };

type Group = {
  area: string;
  title: string;
  description: string;
  unit: string;
  items: ApiChallenge[];
};

/** „GUS, Bank Danych Lokalnych (bdl.stat.gov.pl)” → https://bdl.stat.gov.pl; pełny URL zostaje bez zmian. */
export function sourceUrl(source: string): string | null {
  const url = source.match(/https?:\/\/[^\s)]+/)?.[0];
  if (url) return url;
  const domain = source.match(/\(([a-z0-9.-]+\.[a-z]{2,})(\/[^\s)]*)?\)/i);
  return domain ? `https://${domain[1]}${domain[2] ?? ""}` : null;
}

/** Nazwa źródła bez domeny w nawiasie. */
function sourceName(source: string) {
  return source.replace(/\s*\([^)]*\)\s*$/, "").trim() || source;
}

function powiatLabel(powiat: string) {
  return powiat.startsWith("m. ") ? `${powiat.slice(3)} (miasto)` : `powiat ${powiat}`;
}

function SourceLink({ source, year }: { source: string; year?: number }) {
  const url = sourceUrl(source);
  const text = `${sourceName(source)}${year ? `, ${year} r.` : ""}`;
  if (!url) return <span>{text}</span>;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 font-semibold text-leaf underline underline-offset-4 hover:text-deep"
    >
      {text}
      <ExternalLink aria-hidden="true" className="size-4 shrink-0" />
      <span className="sr-only">(otwiera się w nowej karcie)</span>
    </a>
  );
}

export function ChallengesView() {
  const [challenges, setChallenges] = useState<ApiChallenge[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [powiat, setPowiat] = useState("");

  useEffect(() => {
    let active = true;
    apiFetch<ApiChallenge[]>("/api/challenges")
      .then((data) => active && setChallenges(Array.isArray(data) ? data : []))
      .catch(() => active && setFailed(true));
    return () => {
      active = false;
    };
  }, []);

  const powiaty = useMemo(
    () => [...new Set((challenges ?? []).map((item) => item.powiat))].sort((a, b) => a.localeCompare(b, "pl")),
    [challenges],
  );

  const groups = useMemo(() => {
    const byArea = new Map<string, Group>();
    for (const item of challenges ?? []) {
      if (powiat && item.powiat !== powiat) continue;
      const group = byArea.get(item.area) ?? {
        area: item.area,
        title: item.title,
        description: item.description,
        unit: item.indicator_unit,
        items: [],
      };
      group.items.push(item);
      byArea.set(item.area, group);
    }
    for (const group of byArea.values()) {
      group.items.sort((a, b) => (b.severity ?? 0) - (a.severity ?? 0) || a.powiat.localeCompare(b.powiat, "pl"));
    }
    // Najpierw obszary, które dotyczą najwięcej powiatów.
    return [...byArea.values()].sort((a, b) => b.items.length - a.items.length);
  }, [challenges, powiat]);

  const sources = useMemo(
    () =>
      [...new Map((challenges ?? []).map((item) => [item.source, item])).values()].map((item) => ({
        source: item.source,
        years: [...new Set((challenges ?? []).filter((c) => c.source === item.source).map((c) => c.data_year))].sort(),
      })),
    [challenges],
  );

  if (failed) {
    return (
      <p role="alert" className="rounded-ui border-(length:--bw) border-alert bg-surface p-5 font-semibold text-alert">
        Nie udało się wczytać wyzwań. Spróbuj odświeżyć stronę za chwilę.
      </p>
    );
  }

  if (!challenges) {
    return (
      <div role="status" aria-label="Wczytuję wyzwania" className="grid gap-6 md:grid-cols-2">
        {[0, 1, 2, 3].map((index) => (
          <div key={index} className="h-64 animate-pulse border-(length:--bw) border-sage bg-paper" />
        ))}
      </div>
    );
  }

  if (!challenges.length) {
    return <p className="text-lg">Brak danych o wyzwaniach.</p>;
  }

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <label className="grid gap-1 font-bold text-deep">
          Pokaż dla powiatu
          <select
            value={powiat}
            onChange={(event) => setPowiat(event.target.value)}
            className="min-h-12 rounded-ui border-(length:--bw) border-deep bg-surface px-3 text-base font-normal text-ink"
          >
            <option value="">Cała Małopolska</option>
            {powiaty.map((name) => (
              <option key={name} value={name}>
                {powiatLabel(name)}
              </option>
            ))}
          </select>
        </label>
        <p aria-live="polite" className="text-muted">
          {groups.length} {groups.length === 1 ? "obszar" : groups.length < 5 ? "obszary" : "obszarów"} ·{" "}
          {groups.reduce((sum, group) => sum + group.items.length, 0)} wskaźników
        </p>
      </div>

      <ul className="mt-8 grid gap-6 md:grid-cols-2">
        {groups.map((group) => (
          <li
            key={group.area}
            className="hover-lift flex flex-col border-(length:--bw) border-deep bg-paper p-6 shadow-paper md:p-8"
          >
            <p className="text-sm font-semibold text-muted">{group.area}</p>
            <h3 className="mt-1 text-xl font-bold text-deep">{group.title}</h3>
            <p className="mt-3 max-w-[55ch]">{group.description}</p>

            <table className="mt-5 w-full text-left">
              <caption className="sr-only">
                {group.title}: {group.unit}, według powiatów
              </caption>
              <thead>
                <tr className="border-b-2 border-deep text-sm">
                  <th scope="col" className="py-2 pr-3 font-bold">
                    Powiat
                  </th>
                  <th scope="col" className="py-2 text-right font-bold">
                    Wartość
                  </th>
                </tr>
              </thead>
              <tbody>
                {group.items.slice(0, 6).map((item) => (
                  <tr key={item.id} className="border-b border-sage">
                    <th scope="row" className="py-2 pr-3 font-normal">
                      {powiatLabel(item.powiat)}
                    </th>
                    <td className="py-2 text-right font-bold text-deep tabular-nums">
                      {formatNumber(item.indicator_value)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-2 text-sm text-muted">
              {group.unit}
              {group.items.length > 6 && ` · pokazano 6 z ${group.items.length} powiatów`}
            </p>
            <p className="mt-3 text-sm">
              Źródło: <SourceLink source={group.items[0].source} year={group.items[0].data_year} />
            </p>

            <Link
              href={`/wyniki?q=${encodeURIComponent(group.title.toLowerCase())}`}
              className="mt-auto inline-flex min-h-12 items-center gap-2 pt-4 font-bold text-leaf underline underline-offset-4 hover:text-deep"
            >
              <Search aria-hidden="true" className="size-5" />
              Szukaj rozwiązań
              <span className="sr-only">: {group.title}</span>
            </Link>
          </li>
        ))}
      </ul>

      <section aria-labelledby="zrodla-tytul" className="mt-14">
        <h2 id="zrodla-tytul" className="text-2xl font-bold text-deep">
          Źródła danych i raporty
        </h2>
        <ul className="mt-4 grid gap-2">
          {sources.map((item) => (
            <li key={item.source}>
              <SourceLink source={item.source} />
              <span className="text-muted"> — dane z lat {item.years.join(", ")}</span>
            </li>
          ))}
          <li>
            <a
              href="https://rops.krakow.pl"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-semibold text-leaf underline underline-offset-4 hover:text-deep"
            >
              Raporty i diagnozy ROPS w Krakowie
              <ExternalLink aria-hidden="true" className="size-4 shrink-0" />
              <span className="sr-only">(otwiera się w nowej karcie)</span>
            </a>
          </li>
        </ul>
      </section>
    </>
  );
}
