import type { Metadata } from "next";

import { CutoutText } from "@/components/cutout-text";
import { EducationList } from "./education-list";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t.pages.titles.education, description: t.pages.education.description };
}

function first(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

export default async function EducationPage({ searchParams }: PageProps<"/edukacja">) {
  const params = await searchParams;
  const t = await getT();
  const query = first(params.q);
  const tags = first(params.tagi);

  return (
    <>
      <section aria-labelledby="edukacja-tytul" className="border-b-(length:--bw) border-border bg-background">
        <div className="mx-auto max-w-content px-4 py-16 sm:px-6 lg:py-20">
          <CutoutText id="edukacja-tytul" as="h1" size="hero" text={t.pages.education.heading} />
          <p className="mt-6 max-w-[60ch] text-lg">
            {t.pages.education.lead}
          </p>
        </div>
      </section>

      <section aria-labelledby="materialy-tytul" className="bg-surface">
        <div className="mx-auto max-w-content px-4 py-16 sm:px-6 lg:py-20">
          <h2 id="materialy-tytul" className="sr-only">
            {t.pages.education.materials}
          </h2>
          <EducationList key={`${query}|${tags}`} initialQuery={query} initialTags={tags} />
        </div>
      </section>
    </>
  );
}
