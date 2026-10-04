"use client";

import { useEffect, useMemo, useState } from "react";
import { BookOpen, ExternalLink, FileText, PlayCircle, X } from "lucide-react";

import { API_URL } from "@/lib/api";
import { matchesSearchTags, normalizeText, parseSearchTags, queryStems, type SearchTag } from "@/lib/search-tags";
import { useI18n } from "@/lib/i18n/client";

// Materiały edukacyjne z GET /api/resources?type=education (Zasobnik). Ten endpoint zwraca { items, total }
// bez koperty { data }, dlatego zwykły fetch zamiast apiFetch.

export type EducationResource = {
  id: number;
  title: string;
  summary: string;
  content: string;
  tags: string[];
  url: string | null;
  video_url: string | null;
  attachment_url: string | null;
  source: string | null;
  areas: Array<{ slug: string; name: string }>;
};

async function loadEducation(): Promise<EducationResource[]> {
  const response = await fetch(`${API_URL}/api/resources?type=education&limit=100`);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const body = (await response.json()) as { items?: EducationResource[] };
  return body.items ?? [];
}

function MdContent({ content }: { content: string }) {
  const blocks = content.split(/\n(?=##\s)|\n{2,}/).filter(Boolean);
  return (
    <>
      {blocks.map((block, i) => {
        if (block.startsWith("## ")) {
          return (
            <h4 key={i} className="font-bold text-foreground">
              {block.slice(3).trim()}
            </h4>
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

function ResourceLink({ href, icon: Icon, children }: { href: string; icon: typeof ExternalLink; children: string }) {
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
      <span className="sr-only">{newTab}</span>
    </a>
  );
}

export function EducationList({ initialQuery = "", initialTags = "" }: { initialQuery?: string; initialTags?: string }) {
  const { t } = useI18n();
  const ed = t.region.education;
  const ch = t.region.challenges;
  const [items, setItems] = useState<EducationResource[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [area, setArea] = useState("");
  const [query, setQuery] = useState(initialQuery);
  const [tags, setTags] = useState<SearchTag[]>(() => parseSearchTags(initialTags));

  useEffect(() => {
    let active = true;
    loadEducation()
      .then((data) => active && setItems(data))
      .catch(() => active && setFailed(true));
    return () => {
      active = false;
    };
  }, []);

  const areas = useMemo(() => {
    const all = new Map<string, string>();
    for (const item of items ?? []) for (const entry of item.areas) all.set(entry.slug, entry.name);
    return [...all].sort((a, b) => a[1].localeCompare(b[1], "pl"));
  }, [items]);

  const words = queryStems(query);
  const visible = (items ?? []).filter((item) => {
    if (area && !item.areas.some((entry) => entry.slug === area)) return false;
    const text = `${item.title} ${item.summary} ${item.content} ${item.tags.join(" ")}`;
    const haystack = normalizeText(text);
    return words.every((word) => haystack.includes(word)) && matchesSearchTags(text, tags);
  });

  if (failed) {
    return (
      <p role="alert" className="rounded-ui border-(length:--bw) border-destructive bg-surface p-5 font-semibold text-destructive">
        {ed.loadFailed}
      </p>
    );
  }

  if (!items) {
    return (
      <div role="status" aria-label={ed.loading} className="grid gap-6 md:grid-cols-2">
        {[0, 1, 2, 3].map((index) => (
          <div key={index} className="h-48 animate-pulse border-(length:--bw) border-border/40 bg-background" />
        ))}
      </div>
    );
  }

  if (!items.length) {
    return <p className="text-lg">{ed.none}</p>;
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
      <label className="mb-6 grid max-w-md gap-1 font-bold text-foreground">
        {ed.search}
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={ed.searchPlaceholder}
          className="min-h-12 rounded-ui border-(length:--bw) border-border bg-surface px-3 text-base font-normal text-foreground placeholder:text-muted"
        />
      </label>
      {areas.length > 0 && (
        <fieldset>
          <legend className="font-bold text-foreground">{ed.topic}</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {[["", ed.all] as const, ...areas].map(([slug, name]) => (
              <button
                key={slug || "all"}
                type="button"
                aria-pressed={area === slug}
                onClick={() => setArea(slug)}
                className="min-h-12 rounded-ui border-(length:--bw) border-border bg-surface px-4 font-semibold text-foreground hover:bg-primary/10 aria-pressed:bg-primary aria-pressed:text-primary-foreground"
              >
                {name}
              </button>
            ))}
          </div>
        </fieldset>
      )}

      <p aria-live="polite" className="mt-6 text-muted">
        {ed.count(visible.length)}
      </p>

      <ul className="mt-4 grid gap-6 md:grid-cols-2">
        {visible.map((item) => (
          <li key={item.id} className="hover-lift flex">
            <article
              aria-labelledby={`material-${item.id}`}
              className="flex w-full flex-col border-(length:--bw) border-border bg-surface p-6 shadow-raised"
            >
              <BookOpen aria-hidden="true" className="size-8 text-primary" strokeWidth={1.75} />
              <h3 id={`material-${item.id}`} className="mt-3 text-xl font-bold text-foreground">
                {item.title}
              </h3>
              {item.summary && <p className="mt-2">{item.summary}</p>}

              {item.content && (
                <details className="mt-4 rounded-ui border-2 border-border/40">
                  <summary className="flex min-h-12 cursor-pointer items-center px-4 font-semibold text-foreground">
                    {ed.readMore}
                  </summary>
                  <div className="grid gap-3 border-t-2 border-border/40 p-4">
                    <MdContent content={item.content} />
                  </div>
                </details>
              )}

              {(item.areas.length > 0 || item.tags.length > 0) && (
                <ul className="mt-4 flex flex-wrap gap-2" aria-label={ed.topics}>
                  {item.areas.map((entry) => (
                    <li key={entry.slug} className="rounded-ui border-2 border-border bg-primary/10 px-2 py-0.5 text-sm font-semibold">
                      {entry.name}
                    </li>
                  ))}
                  {item.tags.map((tag) => (
                    <li key={tag} className="rounded-ui bg-background px-2 py-0.5 text-sm">
                      #{tag}
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-auto flex flex-wrap gap-x-6 pt-4">
                {item.url && (
                  <ResourceLink href={item.url} icon={ExternalLink}>
                    {ed.open}
                  </ResourceLink>
                )}
                {item.attachment_url && (
                  <ResourceLink href={item.attachment_url} icon={FileText}>
                    {ed.pdf}
                  </ResourceLink>
                )}
                {item.video_url && (
                  <ResourceLink href={item.video_url} icon={PlayCircle}>
                    {ed.video}
                  </ResourceLink>
                )}
              </div>
              {item.source && <p className="mt-2 text-sm text-muted">{t.region.source} {item.source}</p>}
            </article>
          </li>
        ))}
      </ul>
    </>
  );
}
