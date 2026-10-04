"use client";

import { useRouter } from "next/navigation";
import { useState, type RefObject } from "react";
import { BookOpen, Lightbulb, MapPin, Search, Sparkles, type LucideIcon } from "lucide-react";

import { useT } from "@/lib/i18n/client";
import { SEARCH_TAGS } from "@/lib/search-tags";

// Treść okna szybkiego wyszukiwania (Ctrl+K). Kategoria mówi, GDZIE szukać: „Szukaj” prowadzi na stronę
// kategorii z wpisanym tekstem i wybranymi tagami. Układ okna jest taki sam dla każdej kategorii
// (zmienia się tylko podpowiedź w polu), więc przełączanie niczego nie przesuwa.

export type SearchCategory = "all" | "problems" | "innovations" | "articles";

const CATEGORIES: Array<{ value: SearchCategory; icon: LucideIcon }> = [
  { value: "all", icon: Sparkles },
  { value: "problems", icon: MapPin },
  { value: "innovations", icon: Lightbulb },
  { value: "articles", icon: BookOpen },
];

/** Adres strony wyników dla kategorii, tekstu i tagów (etykiet z SEARCH_TAGS). */
export function searchHref(category: SearchCategory, query: string, labels: string[] = []) {
  const params = new URLSearchParams();
  if (category === "all") {
    // Dopasowanie AI czyta tylko tekst — tagi dopisujemy do opisu.
    params.set("q", [query, ...labels].filter(Boolean).join(", "));
    return `/wyniki?${params}`;
  }
  if (query) params.set("q", query);
  if (category === "innovations") {
    const taxonomy = SEARCH_TAGS.filter((tag) => labels.includes(tag.label)).map((tag) => tag.taxonomy);
    if (taxonomy.length) params.set("tags", taxonomy.join(","));
  } else if (labels.length) {
    params.set("tagi", labels.join(","));
  }
  const path = { problems: "/wyzwania", innovations: "/biblioteka", articles: "/edukacja" }[category];
  const search = params.toString();
  return search ? `${path}?${search}` : path;
}

export function QuickSearch({ inputRef, onNavigate }: { inputRef: RefObject<HTMLInputElement | null>; onNavigate: () => void }) {
  const router = useRouter();
  const t = useT();
  const [category, setCategory] = useState<SearchCategory>("all");
  const [query, setQuery] = useState("");
  const [tags, setTags] = useState<string[]>([]);

  const current = t.quickSearch.categories[category];

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = query.trim();
    // „Wszystko” to dopasowanie AI — potrzebuje opisu albo choć jednego tagu. Kategorie działają też bez tekstu.
    if (category === "all" && !trimmed && !tags.length) {
      inputRef.current?.focus();
      return;
    }
    onNavigate();
    router.push(searchHref(category, trimmed, tags));
  }

  return (
    <>
      <div role="group" aria-label={t.quickSearch.where} className="mt-6 flex flex-wrap gap-2">
        {CATEGORIES.map(({ value, icon: Icon }) => (
          <button
            key={value}
            type="button"
            aria-pressed={category === value}
            onClick={() => {
              setCategory(value);
              inputRef.current?.focus();
            }}
            className="inline-flex min-h-12 items-center gap-2 rounded-ui border-(length:--bw) border-border bg-background px-4 font-semibold text-foreground hover:bg-primary/10 aria-pressed:bg-primary aria-pressed:text-primary-foreground"
          >
            <Icon aria-hidden="true" className="size-5" />
            {t.quickSearch.categories[value].label}
          </button>
        ))}
      </div>

      <form action="/wyniki" method="get" role="search" onSubmit={submit} className="mt-6 flex gap-3">
        <label htmlFor="quick-search" className="sr-only">
          {current.placeholder}
        </label>
        <div className="flex min-h-12 min-w-0 flex-1 flex-wrap items-center gap-2 rounded-ui border-(length:--bw) border-border bg-background px-3 py-2">
          {tags.map((tag) => (
            <span key={tag} className="rounded-full bg-primary/10 px-2 py-1 text-sm font-semibold text-foreground">
              #{t.quickSearch.tagLabels[tag] ?? tag}
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
            className="min-w-[8rem] flex-1 bg-transparent px-1 text-base text-foreground outline-none placeholder:text-muted"
          />
        </div>
        <button
          type="submit"
          className="inline-flex min-h-12 items-center gap-2 rounded-ui border-(length:--bw) border-border bg-primary px-5 font-bold text-primary-foreground hover:bg-primary-hover"
        >
          <Search aria-hidden="true" className="size-5" />
          {t.common.search}
        </button>
      </form>

      <details className="mt-4 rounded-ui border-(length:--bw) border-border/40 bg-background">
        <summary className="flex min-h-12 cursor-pointer items-center justify-between gap-4 px-4 font-semibold text-foreground">
          {t.quickSearch.chooseTags}
          <span className="text-sm text-muted">{tags.length ? t.quickSearch.selected(tags.length) : t.quickSearch.multiSelect}</span>
        </summary>
        <div className="grid gap-1 border-t-(length:--bw) border-border/40 p-3 sm:grid-cols-2" aria-label={t.quickSearch.tagList}>
          {SEARCH_TAGS.map(({ label }) => (
            <label key={label} className="flex min-h-12 cursor-pointer items-center gap-3 rounded-ui px-3 hover:bg-primary/10">
              <input
                type="checkbox"
                checked={tags.includes(label)}
                onChange={() =>
                  setTags((list) => (list.includes(label) ? list.filter((item) => item !== label) : [...list, label]))
                }
                className="size-5 accent-primary"
              />
              <span className="text-base text-foreground">#{t.quickSearch.tagLabels[label] ?? label}</span>
            </label>
          ))}
        </div>
      </details>
    </>
  );
}
