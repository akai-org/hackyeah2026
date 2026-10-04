import type { Metadata } from "next";

import { CutoutText } from "@/components/cutout-text";
import { PageBackdrop } from "@/components/page-backdrop";
import { TesterPanel } from "@/components/tester-panel";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t.pages.titles.testerPanel, robots: { index: false } };
}

export default async function TesterPanelPage() {
  const t = await getT();
  return (
    <PageBackdrop>
      <div className="mx-auto max-w-content px-4 py-16 sm:px-6">
        <CutoutText as="h1" size="section" text={t.pages.testerPanel.heading} />
        <p className="mt-4 mb-10 max-w-[60ch] text-lg">
          {t.pages.testerPanel.lead}
        </p>
        <TesterPanel />
      </div>
    </PageBackdrop>
  );
}
