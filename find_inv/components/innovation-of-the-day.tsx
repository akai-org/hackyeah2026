"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, BookOpen } from "lucide-react";

import { educationHref } from "@/components/education-material";
import { API_URL } from "@/lib/api";
import { useT } from "@/lib/i18n/client";
import { readLocaleCookie } from "@/lib/i18n/config";

// „Artykuł dnia”: jeden materiał z Edukacji (Zasobnik, GET /api/resources?type=education), losowany według
// daty — przez cały dzień ten sam dla wszystkich (nie skacze po odświeżeniu), następnego dnia inny.
// Link prowadzi do strony materiału /edukacja/{id}.

/** Numer dnia w kalendarzu lokalnym — zmienia się o północy, nie o północy UTC. */
function dayNumber(date: Date) {
  return Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000);
}

/** Rozrzuca kolejne dni po katalogu, żeby dzień po dniu nie trafiały sąsiednie materiały. */
function pickIndex(day: number, total: number) {
  return (day * 7919) % total;
}

function shorten(text: string, max: number) {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, clean.lastIndexOf(" ", max)).replace(/[,;:.]$/, "")}…`;
}

type EducationMaterial = {
  id: number;
  title: string;
  summary: string;
  tags: string[];
  areas: Array<{ slug: string; name: string }>;
};

type Page = { items?: EducationMaterial[]; total?: number };

/** /api/resources zwraca { items, total } bez koperty { data } — dlatego zwykły fetch. X-Lang: tłumaczenie. */
async function fetchPage(offset: number): Promise<Page> {
  const response = await fetch(`${API_URL}/api/resources?type=education&limit=1&offset=${offset}`, {
    headers: { "X-Lang": readLocaleCookie() },
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

async function materialOfTheDay(): Promise<EducationMaterial | null> {
  // Najpierw sama liczba materiałów, potem ten jeden — bez pobierania całej listy.
  const { total } = await fetchPage(0);
  if (!total) return null;
  const { items } = await fetchPage(pickIndex(dayNumber(new Date()), total));
  return items?.[0] ?? null;
}

/** Cała sekcja „Artykuł dnia”. Gdy API nie zwróci materiału — sekcja się chowa (nic nie zmyślamy). */
export function InnovationOfTheDaySection({ id }: { id: string }) {
  const t = useT();
  const headingId = `${id}-tytul`;
  const [material, setMaterial] = useState<EducationMaterial | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "empty">("loading");

  useEffect(() => {
    let active = true;
    materialOfTheDay()
      .then((found) => {
        if (!active) return;
        setMaterial(found);
        setState(found ? "ready" : "empty");
      })
      .catch(() => active && setState("empty"));
    return () => {
      active = false;
    };
  }, []);

  if (state === "empty") return null;

  return (
    <section id={id} data-reveal aria-labelledby={headingId} className="border-y-(length:--bw) border-border bg-dots">
      <div className="mx-auto max-w-content px-4 py-10 sm:px-6 lg:py-12">
        <article className="mx-auto max-w-3xl border-(length:--bw) border-border bg-surface p-6 shadow-raised md:p-8">
          <p className="text-sm font-medium text-muted">{t.home.articleOfTheDay}</p>
          {material ? <MaterialBody material={material} headingId={headingId} /> : <Skeleton headingId={headingId} />}
        </article>
      </div>
    </section>
  );
}

function Skeleton({ headingId }: { headingId: string }) {
  const t = useT();
  return (
    <div aria-busy="true">
      <h2 id={headingId} className="sr-only">
        {t.home.loadingArticle}
      </h2>
      <div aria-hidden="true" className="mt-2 h-8 w-3/4 animate-pulse rounded-ui bg-secondary" />
      <div aria-hidden="true" className="mt-4 h-5 w-full animate-pulse rounded-ui bg-secondary" />
      <div aria-hidden="true" className="mt-2 h-5 w-5/6 animate-pulse rounded-ui bg-secondary" />
    </div>
  );
}

function MaterialBody({ material, headingId }: { material: EducationMaterial; headingId: string }) {
  const t = useT();
  const area = material.areas[0]?.name;
  return (
    <>
      <h2 id={headingId} className="mt-2 flex items-start gap-3 text-2xl font-bold text-foreground">
        <BookOpen aria-hidden="true" className="mt-1 size-7 shrink-0 text-primary" strokeWidth={1.75} />
        {material.title}
      </h2>
      {area && (
        <p className="mt-2 inline-flex rounded-ui border-2 border-border bg-secondary/60 px-3 py-0.5 text-sm font-medium text-foreground">
          {area}
        </p>
      )}
      {material.summary && <p className="mt-3 max-w-[65ch] text-lg">{shorten(material.summary, 280)}</p>}
      {material.tags.length > 0 && (
        <ul aria-label={t.home.articleTags} className="mt-4 flex flex-wrap gap-2">
          {material.tags.slice(0, 5).map((tag) => (
            <li key={tag} className="rounded-full border-2 border-border px-3 py-0.5 text-sm text-foreground">
              {tag}
            </li>
          ))}
        </ul>
      )}
      <Link
        href={educationHref(material.id)}
        className="mt-5 inline-flex min-h-12 items-center gap-2 font-medium text-primary underline underline-offset-4 hover:text-primary-hover"
      >
        {t.home.readMaterial}
        <span className="sr-only">: {material.title}</span>
        <ArrowRight aria-hidden="true" className="size-5" />
      </Link>
    </>
  );
}
