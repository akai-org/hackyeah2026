import type { Metadata } from "next";

import { CutoutText } from "@/components/cutout-text";
import { IdeaCreator } from "@/components/idea-creator";
import { PageBackdrop } from "@/components/page-backdrop";

export const metadata: Metadata = { title: "Kreator pomysłów" };

export default function CreatorPage() {
  return (
    <PageBackdrop layout="side">
      <div className="mx-auto max-w-content px-4 py-16 sm:px-6">
        <CutoutText as="h1" size="section" text="Masz pomysł?" />
        <p className="mt-4 max-w-[60ch] text-lg">
          Opisz go własnymi słowami. AI ułoży z niego fiszkę, którą pokażesz w gminie, organizacji albo ekspertom ROPS.
        </p>
        <IdeaCreator />
      </div>
    </PageBackdrop>
  );
}
