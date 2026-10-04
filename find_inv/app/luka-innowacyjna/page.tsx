import type { Metadata } from "next";

import { CutoutText } from "@/components/cutout-text";
import { GapIndex } from "@/components/gap-index";
import { PageBackdrop } from "@/components/page-backdrop";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t.pages.titles.gap };
}

export default async function GapPage() {
  const t = await getT();
  return (
    <PageBackdrop layout="corner-left">
      <div className="mx-auto max-w-content px-4 py-16 sm:px-6">
        <CutoutText as="h1" size="section" text={t.pages.gap.heading} />
        <p className="mt-4 max-w-[62ch] text-lg">
          {t.pages.gap.lead}
        </p>
        <div className="mt-10">
          <GapIndex level={2} />
        </div>
      </div>
    </PageBackdrop>
  );
}
