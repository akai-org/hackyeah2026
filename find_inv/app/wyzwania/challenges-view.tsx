"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ExternalLink, Search, X } from "lucide-react";

import { formatNumber } from "@/components/malopolska-stats";
import type { Challenge } from "@/data/innovations";
import { apiFetch } from "@/lib/api";
import { matchesSearchTags, normalizeText, parseSearchTags, queryStems, type SearchTag } from "@/lib/search-tags";
import { useI18n } from "@/lib/i18n/client";
import type { RegionMessages } from "@/lib/i18n/ns/region";

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

function powiatLabel(powiat: string, r: RegionMessages) {
  return powiat.startsWith("m. ") ? r.city(powiat.slice(3)) : r.powiat(powiat);
}

function SourceLink({ source, year }: { source: string; year?: number }) {
  const r = useI18n().t.region;
  const url = sourceUrl(source);
  const text = `${sourceName(source)}${year ? `, ${r.year(year)}` : ""}`;
  if (!url) return <span>{text}</span>;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 font-semibold text-primary underline underline-offset-4 hover:text-primary-hover"
    >
      {text}
      <ExternalLink aria-hidden="true" className="size-4 shrink-0" />
      <span className="sr-only">{r.newTab}</span>
    </a>
  );
}

export function ChallengesView({
  initialQuery = "",
  initialPowiat = "",
  initialTags = "",
}: {
  initialQuery?: string;
  initialPowiat?: string;
  initialTags?: string;
}) {
  const { t, locale } = useI18n();
  const r = t.region;
  const ch = r.challenges;
  const [challenges, setChallenges] = useState<ApiChallenge[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [powiat, setPowiat] = useState(initialPowiat);
  const [query, setQuery] = useState(initialQuery);
  const [tags, setTags] = useState<SearchTag[]>(() => parseSearchTags(initialTags));

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
    const words = queryStems(query);
    for (const item of challenges ?? []) {
      if (powiat && item.powiat !== powiat) continue;
      const text = `${item.title} ${item.description} ${item.area} ${item.indicator_unit} ${item.powiat}`;
      const haystack = normalizeText(text);
      if (!words.every((word) => haystack.includes(word))) continue;
      if (!matchesSearchTags(text, tags)) continue;
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
  }, [challenges, powiat, query, tags]);

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
      <p role="alert" className="rounded-ui border-(length:--bw) border-destructive bg-surface p-5 font-semibold text-destructive">
        {ch.loadFailed}
      </p>
    );
  }

  if (!challenges) {
    return (
      <div role="status" aria-label={ch.loading} className="grid gap-6 md:grid-cols-2">
        {[0, 1, 2, 3].map((index) => (
          <div key={index} className="h-64 animate-pulse border-(length:--bw) border-border/40 bg-background" />
        ))}
      </div>
    );
  }

  if (!challenges.length) {
    return <p className="text-lg">{ch.none}</p>;
  }

  return (
    <>
      {tags.length > 0 && (
        <div className="mb-6 flex flex-wrap items-center gap-2" aria-label={ch.selectedTags}>
          <span className="font-bold text-foreground">{ch.tags}</span>
          {tags.map((tag) => (
            <button
              key={tag.label}
              type="button"
              onClick={() => setTags((list) => list.filter((item) => item !== tag))}
              aria-label={ch.removeTag(t.quickSearch.tagLabels[tag.label] ?? tag.label)}
              className="inline-flex min-h-10 items-center gap-1 rounded-full border-2 border-border bg-primary/10 px-3 text-sm font-semibold text-foreground hover:bg-primary/10"
            >
              #{t.quickSearch.tagLabels[tag.label] ?? tag.label}
              <X aria-hidden="true" className="size-4" />
            </button>
          ))}
        </div>
      )}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-wrap items-end gap-4">
          <label className="grid gap-1 font-bold text-foreground">
            {ch.search}
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={ch.searchPlaceholder}
              className="min-h-12 w-72 max-w-full rounded-ui border-(length:--bw) border-border bg-surface px-3 text-base font-normal text-foreground placeholder:text-muted"
            />
          </label>
          <label className="grid gap-1 font-bold text-foreground">
            {ch.forPowiat}
            <select
              value={powiat}
              onChange={(event) => setPowiat(event.target.value)}
              className="min-h-12 rounded-ui border-(length:--bw) border-border bg-surface px-3 text-base font-normal text-foreground"
            >
              <option value="">{ch.allRegion}</option>
              {powiaty.map((name) => (
                <option key={name} value={name}>
                  {powiatLabel(name, r)}
                </option>
              ))}
            </select>
          </label>
        </div>
        <p aria-live="polite" className="text-muted">
          {ch.summary(groups.length, groups.reduce((sum, group) => sum + group.items.length, 0))}
        </p>
      </div>

      {groups.length === 0 && (
        <p className="mt-8 text-lg">
          {ch.nothing}{" "}
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setPowiat("");
              setTags([]);
            }}
            className="font-bold text-primary underline underline-offset-4 hover:text-primary-hover"
          >
            {ch.showAll}
          </button>
        </p>
      )}

      <ul className="mt-8 grid gap-6 md:grid-cols-2">
        {groups.map((group) => (
          <li
            key={group.area}
            className="hover-lift flex flex-col border-(length:--bw) border-border bg-background p-6 shadow-raised md:p-8"
          >
            <p className="text-sm font-semibold text-muted">{group.area}</p>
            <h3 className="mt-1 text-xl font-bold text-foreground">{group.title}</h3>
            <p className="mt-3 max-w-[55ch]">{group.description}</p>

            <table className="mt-5 w-full text-left">
              <caption className="sr-only">
                {ch.caption(group.title, group.unit)}
              </caption>
              <thead>
                <tr className="border-b-2 border-border text-sm">
                  <th scope="col" className="py-2 pr-3 font-bold">
                    {ch.powiatCol}
                  </th>
                  <th scope="col" className="py-2 text-right font-bold">
                    {ch.valueCol}
                  </th>
                </tr>
              </thead>
              <tbody>
                {group.items.slice(0, 6).map((item) => (
                  <tr key={item.id} className="border-b border-border/40">
                    <th scope="row" className="py-2 pr-3 font-normal">
                      {powiatLabel(item.powiat, r)}
                    </th>
                    <td className="py-2 text-right font-bold text-foreground tabular-nums">
                      {formatNumber(item.indicator_value, locale)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-2 text-sm text-muted">
              {group.unit}
              {group.items.length > 6 && ch.shownOf(group.items.length)}
            </p>
            <p className="mt-3 text-sm">
              {r.source} <SourceLink source={group.items[0].source} year={group.items[0].data_year} />
            </p>

            <Link
              href={`/wyniki?q=${encodeURIComponent(group.title.toLowerCase())}`}
              className="mt-auto inline-flex min-h-12 items-center gap-2 pt-4 font-bold text-primary underline underline-offset-4 hover:text-primary-hover"
            >
              <Search aria-hidden="true" className="size-5" />
              {ch.findSolutions}
              <span className="sr-only">: {group.title}</span>
            </Link>
          </li>
        ))}
      </ul>

      <section aria-labelledby="zrodla-tytul" className="mt-14">
        <h2 id="zrodla-tytul" className="text-2xl font-bold text-foreground">
          {ch.sources}
        </h2>
        <ul className="mt-4 grid gap-2">
          {sources.map((item) => (
            <li key={item.source}>
              <SourceLink source={item.source} />
              <span className="text-muted">{ch.years(item.years.join(", "))}</span>
            </li>
          ))}
          <li>
            <a
              href="https://rops.krakow.pl"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-semibold text-primary underline underline-offset-4 hover:text-primary-hover"
            >
              {ch.ropsReports}
              <ExternalLink aria-hidden="true" className="size-4 shrink-0" />
              <span className="sr-only">{r.newTab}</span>
            </a>
          </li>
        </ul>
      </section>
    </>
  );
}
