"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, BookOpen, CircleAlert, ExternalLink, FileText, Loader2, PlayCircle } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { API_URL } from "@/lib/api";
import { useI18n } from "@/lib/i18n/client";
import { readLocaleCookie } from "@/lib/i18n/config";

// Materiał edukacyjny (Zasobnik): wspólne elementy listy /edukacja i strony /edukacja/[id].
// Endpointy /api/resources zwracają obiekty bez koperty { data } — dlatego zwykły fetch, z X-Lang (tłumaczenie).

export type EducationResource = {
  id: number;
  title: string;
  summary: string;
  content: string;
  facts?: Array<{ label: string; value: string }>;
  tags: string[];
  url: string | null;
  video_url: string | null;
  attachment_url: string | null;
  image_url?: string | null;
  source: string | null;
  areas: Array<{ slug: string; name: string }>;
};

export const educationHref = (id: number) => `/edukacja/${id}`;

/** Prosty markdown z bazy: nagłówki „## ”, listy „- ” i akapity. `heading` — poziom nagłówków sekcji. */
export function MdContent({ content, heading: Heading = "h4" }: { content: string; heading?: "h2" | "h3" | "h4" }) {
  const blocks = content.split(/\n(?=##\s)|\n{2,}/).filter(Boolean);
  return (
    <>
      {blocks.map((block, i) => {
        if (block.startsWith("## ")) {
          return (
            <Heading key={i} className="font-bold text-foreground">
              {block.slice(3).trim()}
            </Heading>
          );
        }
        const lines = block.split("\n");
        const isList = lines.some((l) => l.trimStart().startsWith("- "));
        if (isList) {
          return (
            <ul key={i} className="ml-4 list-disc space-y-0.5">
              {lines
                .filter((l) => l.trimStart().startsWith("- "))
                .map((l, j) => (
                  <li key={j}>{l.replace(/^\s*-\s/, "")}</li>
                ))}
            </ul>
          );
        }
        return <p key={i}>{block.trim()}</p>;
      })}
    </>
  );
}

export function ResourceLink({
  href,
  icon: Icon,
  children,
  title,
}: {
  href: string;
  icon: typeof ExternalLink;
  children: string;
  title: string;
}) {
  const newTab = useI18n().t.region.newTab;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex min-h-12 items-center gap-2 font-bold text-primary underline underline-offset-4 hover:text-primary-hover"
    >
      <Icon aria-hidden="true" className="size-5 shrink-0" />
      {children}
      <span className="sr-only">: {title} ({newTab})</span>
    </a>
  );
}

async function loadMaterial(id: number): Promise<EducationResource | null> {
  const response = await fetch(`${API_URL}/api/resources/${id}`, { headers: { "X-Lang": readLocaleCookie() } });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const material = (await response.json()) as EducationResource & { type?: string };
  // Pod tym adresem pokazujemy tylko materiały edukacyjne, nie inne zasoby Zasobnika.
  return material.type && material.type !== "education" ? null : material;
}

/** Strona jednego materiału — odpowiednik karty innowacji. */
export function EducationDetail({ id }: { id: number }) {
  const { t } = useI18n();
  const ed = t.region.education;
  const [material, setMaterial] = useState<EducationResource | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "missing" | "failed">("loading");

  useEffect(() => {
    let active = true;
    loadMaterial(id)
      .then((found) => {
        if (!active) return;
        setMaterial(found);
        setState(found ? "ready" : "missing");
      })
      .catch(() => active && setState("failed"));
    return () => {
      active = false;
    };
  }, [id]);

  const back = (
    <Link
      href="/edukacja"
      className="inline-flex min-h-12 items-center gap-2 font-medium text-primary underline underline-offset-4 hover:text-primary-hover"
    >
      <ArrowLeft aria-hidden="true" className="size-5" />
      {ed.back}
    </Link>
  );

  if (state === "loading") {
    return (
      <div>
        {back}
        <p role="status" className="mt-8 flex items-center gap-2 text-muted">
          <Loader2 aria-hidden="true" className="size-5 animate-spin" />
          {ed.loadingOne}
        </p>
      </div>
    );
  }

  if (state !== "ready" || !material) {
    return (
      <div>
        {back}
        <p role="alert" className="mt-8 flex max-w-2xl items-start gap-2 rounded-ui border-2 border-border bg-surface px-4 py-3 font-bold">
          <CircleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-destructive" />
          {state === "missing" ? ed.notFound : ed.loadOneFailed}
        </p>
      </div>
    );
  }

  const facts = (material.facts ?? []).filter((fact) => fact.label && fact.value);
  const hasLinks = material.url || material.attachment_url || material.video_url;

  return (
    <article aria-labelledby="material-tytul" className="max-w-4xl">
      {back}
      <p className="mt-6 flex items-center gap-2 font-bold text-muted">
        <BookOpen aria-hidden="true" className="size-5" />
        {ed.label}
      </p>
      <h1 id="material-tytul" className="mt-1 text-2xl font-bold text-foreground">
        {material.title}
      </h1>

      {(material.areas.length > 0 || material.tags.length > 0) && (
        <ul className="mt-4 flex flex-wrap gap-2" aria-label={ed.topics}>
          {material.areas.map((entry) => (
            <li key={entry.slug} className="rounded-ui border-(length:--bw) border-border bg-primary/10 px-2 py-0.5 text-sm font-semibold">
              {entry.name}
            </li>
          ))}
          {material.tags.map((tag) => (
            <li key={tag} className="rounded-ui border-(length:--bw) border-border/40 bg-background px-2 py-0.5 text-sm">
              #{tag}
            </li>
          ))}
        </ul>
      )}

      {material.summary && <p className="mt-4 max-w-[60ch] text-lg">{material.summary}</p>}

      {(material.content || facts.length > 0 || material.image_url) && (
        <div className="relative mt-8 border-(length:--bw) border-border bg-surface p-6 shadow-raised sm:p-8">
          {material.image_url && (
            // Obraz z zewnętrznego źródła materiału — bez optymalizacji Next (nieznane domeny).
            // eslint-disable-next-line @next/next/no-img-element
            <img src={material.image_url} alt="" className="mb-6 max-h-80 w-full rounded-ui object-cover" />
          )}
          {material.content && (
            <div className="grid max-w-[70ch] gap-3 [&_h2]:mt-3 [&_h2]:text-xl">
              <MdContent content={material.content} heading="h2" />
            </div>
          )}
          {facts.length > 0 && (
            <>
              <h2 className="mt-8 text-xl font-bold text-foreground">{ed.facts}</h2>
              <dl className="mt-3 grid gap-3 sm:grid-cols-[minmax(10rem,auto)_1fr]">
                {facts.map((fact) => (
                  <div key={fact.label} className="contents">
                    <dt className="font-bold text-foreground">{fact.label}</dt>
                    <dd>{fact.value}</dd>
                  </div>
                ))}
              </dl>
            </>
          )}
        </div>
      )}

      {hasLinks && (
        <section aria-labelledby="material-linki" className="mt-8">
          <h2 id="material-linki" className="text-xl font-bold text-foreground">
            {ed.links}
          </h2>
          <div className="mt-2 flex flex-wrap gap-x-6">
            {material.url && (
              <ResourceLink href={material.url} icon={ExternalLink} title={material.title}>
                {ed.open}
              </ResourceLink>
            )}
            {material.attachment_url && (
              <ResourceLink href={material.attachment_url} icon={FileText} title={material.title}>
                {ed.pdf}
              </ResourceLink>
            )}
            {material.video_url && (
              <ResourceLink href={material.video_url} icon={PlayCircle} title={material.title}>
                {ed.video}
              </ResourceLink>
            )}
          </div>
        </section>
      )}

      {material.source && (
        <p className="mt-6 text-sm text-muted">
          {t.region.source} {material.source}
        </p>
      )}

      <Link href="/edukacja" className={buttonVariants({ variant: "secondary", className: "mt-8" })}>
        <ArrowLeft aria-hidden="true" />
        {ed.back}
      </Link>
    </article>
  );
}
