import type { Metadata } from "next";

import { CutoutText } from "@/components/cutout-text";
import { GrantGenerator } from "@/components/grant-generator";
import { PageBackdrop } from "@/components/page-backdrop";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t.pages.titles.grants };
}

export default async function GrantsPage() {
  const t = await getT();
  return (
    <PageBackdrop layout="side">
      <div className="mx-auto max-w-content px-4 py-16 sm:px-6 print:p-0">
        <div className="print:hidden">
          <CutoutText as="h1" size="section" text={t.pages.grants.heading} />
          <p className="mt-4 max-w-[60ch] text-lg">
            {t.pages.grants.lead}
          </p>
        </div>
        <GrantGenerator />
      </div>
    </PageBackdrop>
  );
}
