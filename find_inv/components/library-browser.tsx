"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { Lightbulb, Loader2, Search, X } from "lucide-react";

import { CutoutText } from "@/components/cutout-text";
import { MatchCard } from "@/components/match-card";
import { Button, buttonVariants } from "@/components/ui/button";
import type { InnovationCard } from "@/data/innovations";
import { TAG_LABELS, TAXONOMY_TAGS, type Tag } from "@/data/mock";
import { listInnovations } from "@/lib/knowledge";
import { cn, plural } from "@/lib/utils";

// Biblioteka innowacji: wyszukiwanie na żywo i filtry. Stan filtrów jest w adresie strony,
// więc link „Zobacz więcej” z wyników (?tags=...) otwiera Bibliotekę już przefiltrowaną.

const PAGE_SIZE = 12;
const DEBOUNCE_MS = 300;

const COSTS = [
  { value: "", label: "Każdy koszt" },
  { value: "low", label: "Niski" },
  { value: "medium", label: "Średni" },
  { value: "high", label: "Wysoki" },
];

type Filters = { search: string; tags: Tag[]; cost: string; archived: boolean };

function syncUrl({ search, tags, cost, archived }: Filters) {
  const params = new URLSearchParams();
  if (search.trim()) params.set("q", search.trim());
  if (tags.length) params.set("tags", tags.join(","));
  if (cost) params.set("koszt", cost);
  if (archived) params.set("archiwalne", "1");
  const query = params.toString();
  window.history.replaceState(null, "", query ? `?${query}` : window.location.pathname);
}

const fieldClass = "min-h-12 rounded-ui border-(length:--bw) border-field bg-surface px-4 text-base text-ink";

export function LibraryBrowser({ initial }: { initial: Filters }) {
  const ids = useId();
  const [filters, setFilters] = useState<Filters>(initial);
  const [innovations, setInnovations] = useState<InnovationCard[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const requestRef = useRef(0);

  // Nowe filtry: pobierz pierwszą stronę (tekst z opóźnieniem, żeby nie pytać przy każdej literze).
  useEffect(() => {
    const request = ++requestRef.current;
    const timer = window.setTimeout(async () => {
      syncUrl(filters);
      const result = await listInnovations({
        search: filters.search,
        tags: filters.tags,
        cost: filters.cost,
        includeArchived: filters.archived,
        limit: PAGE_SIZE,
      });
      if (request !== requestRef.current) return;
      setInnovations(result.innovations);
      setTotal(result.total);
      setLoading(false);
    }, DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [filters]);

  async function loadMore() {
    setLoadingMore(true);
    const result = await listInnovations({
      search: filters.search,
      tags: filters.tags,
      cost: filters.cost,
      includeArchived: filters.archived,
      limit: PAGE_SIZE,
      offset: innovations.length,
    });
    setInnovations((current) => [...current, ...result.innovations]);
    setLoadingMore(false);
  }

  // „Szukam…” włączamy przy zmianie filtrów, a wyłącza je efekt po odpowiedzi.
  function update(patch: Partial<Filters>) {
    setLoading(true);
    setFilters((current) => ({ ...current, ...patch }));
  }

  const remainingTags = TAXONOMY_TAGS.filter((tag) => !filters.tags.includes(tag));
  const hasFilters = filters.search.trim() || filters.tags.length || filters.cost || filters.archived;

  return (
    <>
      <form role="search" onSubmit={(event) => event.preventDefault()} className="mt-8 grid max-w-4xl gap-6">
        <div>
          <label htmlFor={`${ids}-szukaj`} className="block text-lg font-bold text-deep">
            Szukaj w Bibliotece
          </label>
          <div className="relative mt-2">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted"
            />
            <input
              id={`${ids}-szukaj`}
              type="search"
              value={filters.search}
              onChange={(event) => update({ search: event.target.value })}
              placeholder="Na przykład: seniorzy, transport, wolontariat"
              className={cn(fieldClass, "w-full pl-12 placeholder:text-muted")}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label htmlFor={`${ids}-temat`} className="block font-bold text-deep">
              Temat
            </label>
            <select
              id={`${ids}-temat`}
              value=""
              onChange={(event) => event.target.value && update({ tags: [...filters.tags, event.target.value as Tag] })}
              className={cn(fieldClass, "mt-2 cursor-pointer")}
            >
              <option value="">Dodaj temat</option>
              {remainingTags.map((tag) => (
                <option key={tag} value={tag}>
                  {TAG_LABELS[tag]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor={`${ids}-koszt`} className="block font-bold text-deep">
              Koszt
            </label>
            <select
              id={`${ids}-koszt`}
              value={filters.cost}
              onChange={(event) => update({ cost: event.target.value })}
              className={cn(fieldClass, "mt-2 cursor-pointer")}
            >
              {COSTS.map((cost) => (
                <option key={cost.value} value={cost.value}>
                  {cost.label}
                </option>
              ))}
            </select>
          </div>
          <label className="flex min-h-12 cursor-pointer items-center gap-3 font-bold text-deep">
            <input
              type="checkbox"
              checked={filters.archived}
              onChange={(event) => update({ archived: event.target.checked })}
              className="size-6 cursor-pointer accent-deep"
            />
            Pokaż też archiwalne
          </label>
        </div>

        {filters.tags.length > 0 && (
          <div role="group" aria-labelledby={`${ids}-wybrane`} className="flex flex-wrap items-center gap-2">
            <p id={`${ids}-wybrane`} className="font-bold text-deep">
              Wybrane tematy:
            </p>
            <ul className="flex flex-wrap gap-2">
              {filters.tags.map((tag) => (
                <li
                  key={tag}
                  className="inline-flex min-h-10 items-center gap-1 rounded-ui border-(length:--bw) border-line bg-mint py-0.5 pr-0.5 pl-3 text-base text-ink"
                >
                  {TAG_LABELS[tag]}
                  <button
                    type="button"
                    onClick={() => update({ tags: filters.tags.filter((item) => item !== tag) })}
                    aria-label={`Usuń temat ${TAG_LABELS[tag].toLowerCase()}`}
                    className="inline-flex size-10 cursor-pointer items-center justify-center rounded-ui hover:bg-sage"
                  >
                    <X aria-hidden="true" className="size-4" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </form>

      <p role="status" aria-live="polite" className="mt-8 flex min-h-8 items-center gap-2 font-bold text-deep">
        {loading ? (
          <>
            <Loader2 aria-hidden="true" className="size-5 animate-spin" />
            Szukam…
          </>
        ) : (
          `Znaleziono ${total} ${plural(total, "innowację", "innowacje", "innowacji")}`
        )}
      </p>

      {!loading && innovations.length === 0 ? (
        <div className="mt-6 max-w-3xl">
          <CutoutText as="h2" text="Nic tu jeszcze nie ma" />
          <p className="mt-4 text-lg">
            Żadna innowacja nie pasuje do tych filtrów. Zmień słowa albo usuń część tematów. Masz własny pomysł na to,
            czego brakuje? Opisz go w Kreatorze.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            {hasFilters && (
              <Button
                type="button"
                variant="secondary"
                onClick={() => update({ search: "", tags: [], cost: "", archived: false })}
              >
                Wyczyść filtry
              </Button>
            )}
            <Link href="/kreator" className={buttonVariants({ variant: "primary" })}>
              <Lightbulb aria-hidden="true" />
              Zgłoś pomysł
            </Link>
          </div>
        </div>
      ) : (
        <ul
          aria-busy={loading}
          className={cn("mt-6 grid gap-8 md:grid-cols-2 lg:grid-cols-3", loading && "opacity-60")}
        >
          {innovations.map((innovation) => (
            <li key={innovation.id} className="flex">
              <MatchCard innovation={innovation} queryTags={filters.tags} headingLevel="h2" />
            </li>
          ))}
        </ul>
      )}

      {!loading && innovations.length > 0 && innovations.length < total && (
        <div className="mt-10 flex flex-wrap items-center gap-4">
          <Button type="button" variant="secondary" onClick={loadMore} disabled={loadingMore}>
            {loadingMore && <Loader2 aria-hidden="true" className="animate-spin" />}
            Pokaż więcej
          </Button>
          {/* aria-live: czytnik ekranu słyszy, że doszły nowe karty. */}
          <p role="status" aria-live="polite" className="text-muted">
            Pokazano {innovations.length} z {total}
          </p>
        </div>
      )}
    </>
  );
}
