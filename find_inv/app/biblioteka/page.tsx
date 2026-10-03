import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, CircleAlert, Search, X } from "lucide-react";

import { CutoutText } from "@/components/cutout-text";
import { RopsInnovationCard } from "@/components/rops-innovation-card";
import { Button, buttonVariants } from "@/components/ui/button";
import { fetchInnovations, type InnovationPage } from "@/lib/knowledge-api";
import { TAXONOMY_TAGS, tagLabel } from "@/lib/matchmaking-api";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Biblioteka innowacji" };

const PAGE_SIZE = 12;

function first(value: string | string[] | undefined) {
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
}

/** Adres Biblioteki z podanymi filtrami. Pusta wartość usuwa parametr. */
function libraryHref({ q, tags, page }: { q: string; tags: string[]; page?: number }) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (tags.length) params.set("tags", tags.join(","));
  if (page && page > 1) params.set("strona", String(page));
  const query = params.toString();
  return query ? `/biblioteka?${query}` : "/biblioteka";
}

export default async function LibraryPage({ searchParams }: PageProps<"/biblioteka">) {
  const params = await searchParams;
  const q = first(params.q);
  const tags = first(params.tags)
    .split(",")
    .map((tag) => tag.trim())
    .filter((tag): tag is (typeof TAXONOMY_TAGS)[number] => (TAXONOMY_TAGS as readonly string[]).includes(tag));
  const page = Math.max(1, Number.parseInt(first(params.strona), 10) || 1);

  let result: InnovationPage | null = null;
  try {
    result = await fetchInnovations({ search: q, tags, limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE });
  } catch (error) {
    console.error(error);
  }

  const pages = result ? Math.max(1, Math.ceil(result.total / PAGE_SIZE)) : 1;
  const filtered = Boolean(q || tags.length);

  return (
    <div className="mx-auto max-w-content px-4 py-16 sm:px-6">
      <CutoutText as="h1" size="section" text="Biblioteka innowacji" />
      <p className="mt-4 max-w-[60ch] text-lg">
        Innowacje społeczne z Biblioteki Innowacji Regionalnego Ośrodka Polityki Społecznej w Krakowie. Każda karta
        prowadzi do pełnego opisu na stronie ROPS.
      </p>

      <form action="/biblioteka" method="get" role="search" className="mt-8 max-w-[65ch]">
        <label htmlFor="szukaj-w-bibliotece" className="block text-lg font-bold text-deep">
          Szukaj w Bibliotece
        </label>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row">
          <input
            id="szukaj-w-bibliotece"
            name="q"
            type="search"
            defaultValue={q}
            placeholder="Na przykład: seniorzy, autyzm, transport"
            className="min-h-12 w-full rounded-ui border-(length:--bw) border-deep bg-surface px-4 text-base text-ink placeholder:text-muted sm:flex-1"
          />
          {tags.length > 0 && <input type="hidden" name="tags" value={tags.join(",")} />}
          <Button type="submit">
            <Search aria-hidden="true" />
            Szukaj
          </Button>
        </div>
      </form>

      <details open={tags.length > 0} className="group mt-6">
        <summary className="inline-flex min-h-12 cursor-pointer list-none items-center gap-2 font-bold text-deep [&::-webkit-details-marker]:hidden">
          <ChevronRight aria-hidden="true" className="size-5 transition-transform group-open:rotate-90" />
          Filtruj według tematu{tags.length > 0 && ` (wybrane: ${tags.length})`}
        </summary>
        <ul className="mt-3 flex flex-wrap gap-2">
          {TAXONOMY_TAGS.map((tag) => {
            const active = tags.includes(tag);
            const next = active ? tags.filter((t) => t !== tag) : [...tags, tag];
            return (
              <li key={tag}>
                <Link
                  href={libraryHref({ q, tags: next })}
                  aria-current={active ? "true" : undefined}
                  className={cn(
                    "inline-flex min-h-12 items-center gap-1 rounded-ui border-(length:--bw) border-deep px-4 text-base text-ink",
                    active ? "bg-mint font-bold" : "bg-surface hover:bg-sage",
                  )}
                >
                  {tagLabel(tag)}
                  {active && <X aria-hidden="true" className="size-4" />}
                  <span className="sr-only">{active ? " (wybrany, kliknij, żeby usunąć)" : ""}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </details>

      {!result ? (
        <p
          role="alert"
          className="mt-8 flex max-w-[65ch] items-start gap-2 rounded-ui border-2 border-alert bg-surface px-4 py-3 font-bold text-alert"
        >
          <CircleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
          Nie udało się wczytać Biblioteki. Odśwież stronę za chwilę.
        </p>
      ) : (
        <>
          <p className="mt-8 font-bold text-deep">
            {filtered ? `Znaleziono ${result.total} ${innovationsWord(result.total)}` : `${result.total} ${innovationsWord(result.total)} w Bibliotece`}
            {pages > 1 && ` · strona ${page} z ${pages}`}
          </p>
          {filtered && (
            <Link href="/biblioteka" className={buttonVariants({ variant: "secondary", className: "mt-3" })}>
              Wyczyść filtry
            </Link>
          )}

          {result.innovations.length === 0 ? (
            <p className="mt-6 max-w-[65ch] text-lg">
              Nie ma innowacji pasujących do tych filtrów. Usuń część tematów albo wpisz inne słowo.
            </p>
          ) : (
            <ul className="mt-8 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {result.innovations.map((innovation) => (
                <li key={innovation.id} className="flex">
                  <RopsInnovationCard innovation={innovation} headingLevel="h2" />
                </li>
              ))}
            </ul>
          )}

          {pages > 1 && (
            <nav aria-label="Strony wyników" className="mt-10 flex flex-wrap items-center gap-3">
              {page > 1 && (
                <Link href={libraryHref({ q, tags, page: page - 1 })} className={buttonVariants({ variant: "secondary" })}>
                  Poprzednia strona
                </Link>
              )}
              {page < pages && (
                <Link href={libraryHref({ q, tags, page: page + 1 })} className={buttonVariants({ variant: "secondary" })}>
                  Następna strona
                </Link>
              )}
            </nav>
          )}
        </>
      )}
    </div>
  );
}

function innovationsWord(count: number) {
  if (count === 1) return "innowacja";
  const lastDigit = count % 10;
  const lastTwo = count % 100;
  return lastDigit >= 2 && lastDigit <= 4 && (lastTwo < 12 || lastTwo > 14) ? "innowacje" : "innowacji";
}
