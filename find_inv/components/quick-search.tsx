"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type RefObject } from "react";
import { BookOpen, Lightbulb, MapPin, Search, Sparkles, type LucideIcon } from "lucide-react";

import { useT } from "@/lib/i18n/client";
import type { Tag } from "@/data/mock";
import { loadTags, type TagCount } from "@/lib/search-tags";

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

/** Adres strony wyników dla kategorii, tekstu i tagów taksonomii. `labelOf` — nazwa tagu do opisu dla AI. */
export function searchHref(category: SearchCategory, query: string, tags: Tag[] = [], labelOf: (tag: Tag) => string = String) {
  const params = new URLSearchParams();
  if (category === "all") {
    // Dopasowanie AI czyta tylko tekst — nazwy tagów dopisujemy do opisu.
    params.set("q", [query, ...tags.map(labelOf)].filter(Boolean).join(", "));
    return `/wyniki?${params}`;
  }
  if (query) params.set("q", query);
  if (tags.length) params.set(category === "innovations" ? "tags" : "tagi", tags.join(","));
  const path = { problems: "/wyzwania", innovations: "/biblioteka", articles: "/edukacja" }[category];
  const search = params.toString();
  return search ? `${path}?${search}` : path;
}

export function QuickSearch({ inputRef, onNavigate }: { inputRef: RefObject<HTMLInputElement | null>; onNavigate: () => void }) {
  const router = useRouter();
  const t = useT();
  const [category, setCategory] = useState<SearchCategory>("all");
  const [query, setQuery] = useState("");
  const [tags, setTags] = useState<Tag[]>([]);
  // Tagi do wyboru z backendu (GET /api/tags), najczęstsze na górze.
  const [available, setAvailable] = useState<TagCount[] | null>(null);

  useEffect(() => {
    let active = true;
    loadTags().then((list) => active && setAvailable(list));
    return () => {
      active = false;
    };
  }, []);

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
    router.push(searchHref(category, trimmed, tags, (tag) => t.tags[tag]));
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
              #{t.tags[tag]}
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
        {/* Przewijana lista wszystkich tagów (nie skacze wysokość okna przy 25 pozycjach). */}
        <div
          role="group"
          aria-label={t.quickSearch.tagList}
          className="grid max-h-64 gap-1 overflow-y-auto overscroll-contain border-t-(length:--bw) border-border/40 p-3 sm:grid-cols-2"
        >
          {available === null ? (
            <p className="px-3 py-2 text-muted">{t.quickSearch.loadingTags}</p>
          ) : (
            available.map(({ tag, count }) => (
              <label key={tag} className="flex min-h-12 cursor-pointer items-center gap-3 rounded-ui px-3 hover:bg-primary/10">
                <input
                  type="checkbox"
                  checked={tags.includes(tag)}
                  onChange={() => setTags((list) => (list.includes(tag) ? list.filter((item) => item !== tag) : [...list, tag]))}
                  className="size-5 shrink-0 accent-primary"
                />
                <span className="min-w-0 flex-1 text-base text-foreground">#{t.tags[tag]}</span>
                {count > 0 && (
                  <span className="text-sm text-muted tabular-nums" aria-label={t.quickSearch.innovationCount(count)}>
                    {count}
                  </span>
                )}
              </label>
            ))
          )}
        </div>
      </details>
    </>
  );
}
