"use client";

import { useEffect, useMemo, useState } from "react";
import { BookOpen, ExternalLink, FileText, PlayCircle } from "lucide-react";

import { API_URL } from "@/lib/api";

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

function ResourceLink({ href, icon: Icon, children }: { href: string; icon: typeof ExternalLink; children: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex min-h-12 items-center gap-2 font-bold text-leaf underline underline-offset-4 hover:text-deep"
    >
      <Icon aria-hidden="true" className="size-5 shrink-0" />
      {children}
      <span className="sr-only">(otwiera się w nowej karcie)</span>
    </a>
  );
}

export function EducationList() {
  const [items, setItems] = useState<EducationResource[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [area, setArea] = useState("");

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

  const visible = (items ?? []).filter((item) => !area || item.areas.some((entry) => entry.slug === area));

  if (failed) {
    return (
      <p role="alert" className="rounded-ui border-(length:--bw) border-alert bg-surface p-5 font-semibold text-alert">
        Nie udało się wczytać materiałów. Spróbuj odświeżyć stronę za chwilę.
      </p>
    );
  }

  if (!items) {
    return (
      <div role="status" aria-label="Wczytuję materiały" className="grid gap-6 md:grid-cols-2">
        {[0, 1, 2, 3].map((index) => (
          <div key={index} className="h-48 animate-pulse border-(length:--bw) border-sage bg-paper" />
        ))}
      </div>
    );
  }

  if (!items.length) {
    return <p className="text-lg">Nie ma jeszcze materiałów edukacyjnych. Zajrzyj tu wkrótce.</p>;
  }

  return (
    <>
      {areas.length > 0 && (
        <fieldset>
          <legend className="font-bold text-deep">Temat</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {[["", "Wszystkie"] as const, ...areas].map(([slug, name]) => (
              <button
                key={slug || "all"}
                type="button"
                aria-pressed={area === slug}
                onClick={() => setArea(slug)}
                className="min-h-12 rounded-ui border-(length:--bw) border-deep bg-surface px-4 font-semibold text-deep hover:bg-sage aria-pressed:bg-deep aria-pressed:text-surface"
              >
                {name}
              </button>
            ))}
          </div>
        </fieldset>
      )}

      <p aria-live="polite" className="mt-6 text-muted">
        {visible.length} {visible.length === 1 ? "materiał" : visible.length < 5 ? "materiały" : "materiałów"}
      </p>

      <ul className="mt-4 grid gap-6 md:grid-cols-2">
        {visible.map((item) => (
          <li key={item.id} className="hover-lift flex">
            <article
              aria-labelledby={`material-${item.id}`}
              className="flex w-full flex-col border-(length:--bw) border-deep bg-surface p-6 shadow-paper"
            >
              <BookOpen aria-hidden="true" className="size-8 text-leaf" strokeWidth={1.75} />
              <h3 id={`material-${item.id}`} className="mt-3 text-xl font-bold text-deep">
                {item.title}
              </h3>
              {item.summary && <p className="mt-2">{item.summary}</p>}

              {item.content && (
                <details className="mt-4 rounded-ui border-2 border-sage">
                  <summary className="flex min-h-12 cursor-pointer items-center px-4 font-semibold text-deep">
                    Czytaj więcej
                  </summary>
                  <div className="grid gap-3 border-t-2 border-sage p-4">
                    {item.content
                      .split(/\n{2,}/)
                      .filter(Boolean)
                      .map((paragraph, index) => (
                        <p key={index} className="whitespace-pre-line">
                          {paragraph}
                        </p>
                      ))}
                  </div>
                </details>
              )}

              {(item.areas.length > 0 || item.tags.length > 0) && (
                <ul className="mt-4 flex flex-wrap gap-2" aria-label="Tematy">
                  {item.areas.map((entry) => (
                    <li key={entry.slug} className="rounded-ui border-2 border-deep bg-mint px-2 py-0.5 text-sm font-semibold">
                      {entry.name}
                    </li>
                  ))}
                  {item.tags.map((tag) => (
                    <li key={tag} className="rounded-ui bg-paper px-2 py-0.5 text-sm">
                      #{tag}
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-auto flex flex-wrap gap-x-6 pt-4">
                {item.url && (
                  <ResourceLink href={item.url} icon={ExternalLink}>
                    Otwórz materiał
                  </ResourceLink>
                )}
                {item.attachment_url && (
                  <ResourceLink href={item.attachment_url} icon={FileText}>
                    Pobierz PDF
                  </ResourceLink>
                )}
                {item.video_url && (
                  <ResourceLink href={item.video_url} icon={PlayCircle}>
                    Obejrzyj film
                  </ResourceLink>
                )}
              </div>
              {item.source && <p className="mt-2 text-sm text-muted">Źródło: {item.source}</p>}
            </article>
          </li>
        ))}
      </ul>
    </>
  );
}
