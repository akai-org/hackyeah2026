import type { Metadata } from "next";

import { CutoutText } from "@/components/cutout-text";
import { IdeaCreator } from "@/components/idea-creator";
import { PageBackdrop } from "@/components/page-backdrop";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t.pages.titles.creator };
}

export default async function CreatorPage() {
  const t = await getT();
  return (
    <PageBackdrop layout="side">
      <div className="mx-auto max-w-content px-4 py-16 sm:px-6">
        <CutoutText as="h1" size="section" text={t.pages.creator.heading} />
        <p className="mt-4 max-w-[60ch] text-lg">
          {t.pages.creator.lead}
        </p>
        <IdeaCreator />
      </div>
    </PageBackdrop>
  );
}
