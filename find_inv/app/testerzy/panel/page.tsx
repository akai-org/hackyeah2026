import type { Metadata } from "next";

import { CutoutText } from "@/components/cutout-text";
import { PageBackdrop } from "@/components/page-backdrop";
import { TesterPanel } from "@/components/tester-panel";

export const metadata: Metadata = { title: "Panel testera", robots: { index: false } };

export default function TesterPanelPage() {
  return (
    <PageBackdrop>
      <div className="mx-auto max-w-content px-4 py-16 sm:px-6">
        <CutoutText as="h1" size="section" text="Panel testera" />
        <p className="mt-4 mb-10 max-w-[60ch] text-lg">
          Wybierz innowację, sprawdź ją w praktyce i napisz, co działa. Twoja ocena pomoże innym gminom.
        </p>
        <TesterPanel />
      </div>
    </PageBackdrop>
  );
}
