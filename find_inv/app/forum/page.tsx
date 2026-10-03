import type { Metadata } from "next";

import { CutoutText } from "@/components/cutout-text";
import { ForumBoard } from "@/components/forum-board";
import { PageBackdrop } from "@/components/page-backdrop";

export const metadata: Metadata = { title: "Forum" };

export default function ForumPage() {
  return (
    <PageBackdrop layout="corner-left">
      <div className="mx-auto max-w-content px-4 py-16 sm:px-6">
        <CutoutText as="h1" size="section" text="Zapytaj innych" />
        <p className="mt-4 max-w-[60ch] text-lg">
          Pytaj o wdrażanie innowacji i dziel się doświadczeniem. Odpowiadają mieszkańcy, testerzy, konsultanci i zespół
          ROPS. Plakietka przy imieniu pokazuje, kto pisze.
        </p>
        <ForumBoard />
      </div>
    </PageBackdrop>
  );
}
