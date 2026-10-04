import type { Metadata } from "next";

import { CutoutText } from "@/components/cutout-text";
import { LibraryBrowser } from "@/components/library-browser";
import { PageBackdrop } from "@/components/page-backdrop";
import { TAXONOMY_TAGS, type Tag } from "@/data/mock";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t.pages.titles.library };
}

const KNOWN_TAGS = new Set<string>(TAXONOMY_TAGS);

function first(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

export default async function LibraryPage({ searchParams }: PageProps<"/biblioteka">) {
  const params = await searchParams;
  const t = await getT();
  const tags = first(params.tags)
    .split(",")
    .filter((tag): tag is Tag => KNOWN_TAGS.has(tag));

  const initial = {
    search: first(params.q),
    tags: [...new Set(tags)],
    cost: ["low", "medium", "high"].includes(first(params.koszt)) ? first(params.koszt) : "",
    archived: first(params.archiwalne) === "1",
  };

  return (
    <PageBackdrop>
      <div className="mx-auto max-w-content px-4 py-16 sm:px-6">
        <CutoutText as="h1" size="section" text={t.pages.library.heading} />
        <p className="mt-4 max-w-[60ch] text-lg">
          {t.pages.library.lead}
        </p>
        {/* key: przejście na ten sam adres z innymi filtrami (np. link w nagłówku) zaczyna od nowa. */}
        <LibraryBrowser key={JSON.stringify(initial)} initial={initial} />
      </div>
    </PageBackdrop>
  );
}
