"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useState, type RefObject } from "react";
import { BookOpen, Lightbulb, Loader2, MapPin, Search, Sparkles, type LucideIcon } from "lucide-react";

import { formatNumber } from "@/components/malopolska-stats";
import type { Challenge, InnovationCard } from "@/data/innovations";
import { API_URL, apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";

// Treść okna szybkiego wyszukiwania (Ctrl+K). Kategorie naprawdę filtrują: pod polem są wyniki na żywo
// z API danej kategorii, a „Szukaj” prowadzi na stronę tej kategorii (Wszystko → dopasowanie AI na /wyniki).

export type SearchCategory = "all" | "problems" | "innovations" | "articles";

const CATEGORIES: Array<{ value: SearchCategory; label: string; placeholder: string; icon: LucideIcon }> = [
  { value: "all", label: "Wszystko", placeholder: "Opisz problem własnymi słowami", icon: Sparkles },
  { value: "problems", label: "Problemy", placeholder: "Szukaj problemu, np. samotność, powiat nowotarski", icon: MapPin },
  { value: "innovations", label: "Innowacje", placeholder: "Szukaj innowacji, np. seniorzy", icon: Lightbulb },
  { value: "articles", label: "Artykuły", placeholder: "Szukaj artykułu, np. spółdzielnia", icon: BookOpen },
];

const SEARCH_TAGS = ["Aplikacja", "Małe firmy", "Niewidomi", "Seniorzy", "Transport", "Zdrowie"];
const LIMIT = 5;

type Hit = { key: string; kind: Exclude<SearchCategory, "all">; title: string; detail: string; href: string };

type Article = { id: number; title: string; summary: string };

// Wyzwania pobieramy raz (66 rekordów) i filtrujemy w przeglądarce.
let challengesCache: Promise<Challenge[]> | null = null;
function allChallenges() {
  challengesCache ??= apiFetch<Challenge[]>("/api/challenges").catch(() => {
    challengesCache = null;
    return [];
  });
  return challengesCache;
}

function normalize(text: string) {
  return text.toLocaleLowerCase("pl").normalize("NFD").replace(/\p{Diacritic}/gu, "");
}

async function searchProblems(query: string): Promise<Hit[]> {
  const words = normalize(query).split(/\s+/).filter(Boolean);
  const challenges = await allChallenges();
  return challenges
    .filter((item) => {
      const haystack = normalize(`${item.title} ${item.description} ${item.area} ${item.powiat}`);
      return words.every((word) => haystack.includes(word));
    })
    .slice(0, LIMIT)
    .map((item) => ({
      key: `p-${item.id}`,
      kind: "problems",
      title: item.title,
      detail: `${item.powiat.startsWith("m. ") ? item.powiat.slice(3) : `powiat ${item.powiat}`} · ${formatNumber(item.indicator_value)} ${item.indicator_unit}`,
      href: `/wyzwania?q=${encodeURIComponent(item.title)}&powiat=${encodeURIComponent(item.powiat)}`,
    }));
}

async function searchInnovations(query: string): Promise<Hit[]> {
  const params = new URLSearchParams({ limit: String(LIMIT), include_archived: "false" });
  if (query) params.set("search", query);
  const result = await apiFetch<{ innovations?: InnovationCard[] } | InnovationCard[]>(`/api/innovations?${params}`);
  const list = Array.isArray(result) ? result : (result.innovations ?? []);
  return list.slice(0, LIMIT).map((item) => ({
    key: `i-${item.id}`,
    kind: "innovations",
    title: item.title,
    detail: item.short_desc,
    href: `/innowacje/${item.id}`,
  }));
}

async function searchArticles(query: string): Promise<Hit[]> {
  const params = new URLSearchParams({ type: "education", limit: String(LIMIT) });
  if (query) params.set("q", query);
  // /api/resources zwraca { items, total } bez koperty { data }.
  const response = await fetch(`${API_URL}/api/resources?${params}`);
  if (!response.ok) return [];
  const body = (await response.json()) as { items?: Article[] };
  return (body.items ?? []).map((item) => ({
    key: `a-${item.id}`,
    kind: "articles",
    title: item.title,
    detail: item.summary,
    href: `/edukacja?q=${encodeURIComponent(item.title)}`,
  }));
}

const SEARCHERS = { problems: searchProblems, innovations: searchInnovations, articles: searchArticles };

const KIND_LABEL: Record<Hit["kind"], { label: string; icon: LucideIcon }> = {
  problems: { label: "Problem", icon: MapPin },
  innovations: { label: "Innowacja", icon: Lightbulb },
  articles: { label: "Artykuł", icon: BookOpen },
};

/** Adres strony wyników dla kategorii. */
export function searchHref(category: SearchCategory, query: string, tags: string[] = []) {
  const q = encodeURIComponent(query);
  switch (category) {
    case "problems":
      return `/wyzwania?q=${q}`;
    case "innovations":
      return `/biblioteka?q=${q}`;
    case "articles":
      return `/edukacja?q=${q}`;
    default:
      // Dopasowanie AI czyta tylko tekst — wybrane tagi dopisujemy do opisu.
      return `/wyniki?q=${encodeURIComponent([query, ...tags].filter(Boolean).join(", "))}`;
  }
}

export function QuickSearch({ inputRef, onNavigate }: { inputRef: RefObject<HTMLInputElement | null>; onNavigate: () => void }) {
  const router = useRouter();
  const ids = useId();
  const [category, setCategory] = useState<SearchCategory>("all");
  const [query, setQuery] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [hits, setHits] = useState<Hit[] | null>(null);
  const [loading, setLoading] = useState(false);

  const current = CATEGORIES.find((item) => item.value === category)!;
  const trimmed = query.trim();
  // „Wszystko” bez tekstu niczego nie pokazuje; konkretna kategoria pokazuje od razu pierwsze pozycje.
  const shouldSearch = category !== "all" || trimmed.length >= 2;

  useEffect(() => {
    if (!shouldSearch) return;
    let active = true;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const kinds = category === "all" ? (["problems", "innovations", "articles"] as const) : ([category] as const);
        const results = await Promise.all(kinds.map((kind) => SEARCHERS[kind](trimmed).catch(() => [] as Hit[])));
        // Przy „Wszystko” po 2 z każdej kategorii, żeby jedna nie zasłoniła reszty.
        const merged = category === "all" ? results.flatMap((list) => list.slice(0, 2)) : results.flat();
        if (active) setHits(merged);
      } finally {
        if (active) setLoading(false);
      }
    }, 250);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [category, trimmed, shouldSearch]);

  const visibleHits = shouldSearch ? hits : null;

  function chooseCategory(value: SearchCategory) {
    setCategory(value);
    setHits(null);
    inputRef.current?.focus();
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!trimmed && category === "all") {
      inputRef.current?.focus();
      return;
    }
    onNavigate();
    router.push(searchHref(category, trimmed, tags));
  }

  return (
    <>
      <div role="group" aria-label="Czego szukasz" className="mt-6 flex flex-wrap gap-2">
        {CATEGORIES.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            type="button"
            aria-pressed={category === value}
            onClick={() => chooseCategory(value)}
            className="inline-flex min-h-12 items-center gap-2 rounded-ui border-(length:--bw) border-deep bg-paper px-4 font-semibold text-deep hover:bg-sage aria-pressed:bg-deep aria-pressed:text-surface"
          >
            <Icon aria-hidden="true" className="size-5" />
            {label}
          </button>
        ))}
      </div>

      <form action="/wyniki" method="get" role="search" onSubmit={submit} className="mt-6 flex gap-3">
        <label htmlFor="quick-search" className="sr-only">
          {current.placeholder}
        </label>
        <div className="flex min-h-12 min-w-0 flex-1 flex-wrap items-center gap-2 rounded-ui border-(length:--bw) border-deep bg-paper px-3 py-2">
          {category === "all" &&
            tags.map((tag) => (
              <span key={tag} className="rounded-full bg-mint px-2 py-1 text-sm font-semibold text-deep">
                #{tag}
              </span>
            ))}
          <input
            ref={inputRef}
            id="quick-search"
            name="q"
            type="search"
            autoComplete="off"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={current.placeholder}
            aria-controls={`${ids}-wyniki`}
            className="min-w-[8rem] flex-1 bg-transparent px-1 text-base text-ink outline-none placeholder:text-muted"
          />
        </div>
        <button
          type="submit"
          className="inline-flex min-h-12 items-center gap-2 rounded-ui border-(length:--bw) border-deep bg-deep px-5 font-bold text-surface hover:bg-leaf"
        >
          <Search aria-hidden="true" className="size-5" />
          Szukaj
        </button>
      </form>

      <div id={`${ids}-wyniki`} className="mt-4">
        <p aria-live="polite" className="flex min-h-6 items-center gap-2 text-sm text-muted">
          {loading && <Loader2 aria-hidden="true" className="size-4 animate-spin" />}
          {!shouldSearch
            ? "Wpisz co najmniej 2 znaki albo wybierz kategorię."
            : visibleHits === null
              ? "Szukam…"
              : visibleHits.length === 0
                ? "Brak wyników w tej kategorii."
                : category !== "all" && visibleHits.length >= LIMIT
                  ? `Pierwsze ${LIMIT} wyników — „Szukaj” pokaże wszystkie.`
                  : `Znaleziono: ${visibleHits.length}`}
        </p>
        {visibleHits && visibleHits.length > 0 && (
          <ul className={cn("mt-2 grid gap-2", loading && "opacity-60")} aria-label={`Wyniki: ${current.label}`}>
            {visibleHits.map((hit) => {
              const kind = KIND_LABEL[hit.kind];
              const Icon = kind.icon;
              return (
                <li key={hit.key} className="appear">
                  <Link
                    href={hit.href}
                    onClick={onNavigate}
                    className="flex items-start gap-3 rounded-ui border-2 border-deep bg-surface p-3 hover:bg-mint"
                  >
                    <Icon aria-hidden="true" className="mt-1 size-5 shrink-0 text-leaf" />
                    <span className="min-w-0">
                      <span className="block font-bold text-deep">
                        <span className="sr-only">{kind.label}: </span>
                        {hit.title}
                      </span>
                      <span className="line-clamp-1 block text-sm text-muted">{hit.detail}</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {category === "all" && (
        <details className="mt-4 rounded-ui border-(length:--bw) border-sage bg-paper">
          <summary className="flex min-h-12 cursor-pointer items-center justify-between gap-4 px-4 font-semibold text-deep">
            Dodaj tagi do opisu
            <span className="text-sm text-muted">{tags.length ? `Wybrano: ${tags.length}` : "wielokrotny wybór"}</span>
          </summary>
          <div className="grid gap-1 border-t-(length:--bw) border-sage p-3 sm:grid-cols-2" aria-label="Lista tagów wyszukiwania">
            {SEARCH_TAGS.map((tag) => (
              <label key={tag} className="flex min-h-12 cursor-pointer items-center gap-3 rounded-ui px-3 hover:bg-sage">
                <input
                  type="checkbox"
                  checked={tags.includes(tag)}
                  onChange={() =>
                    setTags((list) => (list.includes(tag) ? list.filter((item) => item !== tag) : [...list, tag]))
                  }
                  className="size-5 accent-deep"
                />
                <span className="text-base text-deep">#{tag}</span>
              </label>
            ))}
          </div>
        </details>
      )}
    </>
  );
}
