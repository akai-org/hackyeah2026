"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, BookOpen } from "lucide-react";

import { CutoutText } from "@/components/cutout-text";
import { educationHref, loadEducationMaterials, type EducationResource } from "@/components/education-material";
import { buttonVariants } from "@/components/ui/button";
import type { Tag } from "@/data/mock";
import { useT } from "@/lib/i18n/client";
import { normalizeText, queryStems, searchTag } from "@/lib/search-tags";

// „Artykuły z Edukacji” pod wynikami wyszukiwania „Wszystko” (/wyniki): materiały pasujące do tagów
// (zaznaczonych w Ctrl+K i wykrytych przez AI) i do słów zapytania. Nic nie pasuje — sekcja się nie pokazuje.

const LIMIT = 4;

function rank(materials: EducationResource[], query: string, tags: Tag[]) {
  const patterns = tags.map((tag) => searchTag(tag).pattern);
  // Krótkie słowa („na”, „wsi”) trafiałyby wszędzie — liczą się rdzenie od 4 znaków.
  const stems = [...new Set(queryStems(query).filter((stem) => stem.length >= 4))];
  return materials
    .map((material) => {
      const text = [material.title, material.summary, material.content, material.tags.join(" "), material.areas.map((a) => a.name).join(" ")].join(" ");
      const lower = text.toLocaleLowerCase("pl");
      const plain = normalizeText(text);
      const score =
        2 * patterns.filter((pattern) => pattern.test(lower)).length + stems.filter((stem) => plain.includes(stem)).length;
      return { material, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, LIMIT)
    .map((entry) => entry.material);
}

export function EducationMatches({ query, tags }: { query: string; tags: Tag[] }) {
  const t = useT();
  const [materials, setMaterials] = useState<EducationResource[] | null>(null);

  useEffect(() => {
    let active = true;
    loadEducationMaterials()
      .then((list) => active && setMaterials(list))
      .catch(() => active && setMaterials([]));
    return () => {
      active = false;
    };
  }, []);

  if (!materials) return null;
  const found = rank(materials, query, tags);
  if (!found.length) return null;

  const allHref = tags.length ? `/edukacja?tagi=${tags.join(",")}` : "/edukacja";

  return (
    <section aria-labelledby="wyniki-artykuly" className="mt-14 border-t-2 border-border/40 pt-10">
      <CutoutText id="wyniki-artykuly" as="h2" size="section" text={t.results.articles} />
      <p className="mt-2 text-muted">{t.results.articlesLead}</p>
      <ul className="mt-8 grid gap-6 md:grid-cols-2">
        {found.map((material) => (
          <li key={material.id} className="hover-lift flex">
            <article
              aria-labelledby={`wynik-material-${material.id}`}
              className="flex w-full flex-col border-(length:--bw) border-border bg-surface p-6 shadow-raised"
            >
              <BookOpen aria-hidden="true" className="size-7 text-primary" strokeWidth={1.75} />
              <h3 id={`wynik-material-${material.id}`} className="mt-3 text-xl font-bold text-foreground">
                {material.title}
              </h3>
              {material.areas[0] && (
                <p className="mt-2 inline-flex self-start rounded-ui border-2 border-border bg-secondary/60 px-3 py-0.5 text-sm font-medium text-foreground">
                  {material.areas[0].name}
                </p>
              )}
              {material.summary && <p className="mt-3">{material.summary}</p>}
              <Link
                href={educationHref(material.id)}
                className="mt-auto inline-flex min-h-12 items-center gap-2 pt-4 font-bold text-primary underline underline-offset-4 hover:text-primary-hover"
              >
                {t.region.education.details}
                <span className="sr-only">: {material.title}</span>
                <ArrowRight aria-hidden="true" className="size-5 shrink-0" />
              </Link>
            </article>
          </li>
        ))}
      </ul>
      <Link href={allHref} className={buttonVariants({ variant: "secondary", className: "mt-8" })}>
        {t.results.allArticles}
      </Link>
    </section>
  );
}
