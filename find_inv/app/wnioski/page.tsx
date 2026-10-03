import type { Metadata } from "next";

import { CutoutText } from "@/components/cutout-text";
import { GrantGenerator } from "@/components/grant-generator";
import { PageBackdrop } from "@/components/page-backdrop";

export const metadata: Metadata = { title: "Generator wniosków" };

export default function GrantsPage() {
  return (
    <PageBackdrop layout="side" leafColor="leaf">
      <div className="mx-auto max-w-content px-4 py-16 sm:px-6 print:p-0">
        <div className="print:hidden">
          <CutoutText as="h1" size="section" text="Napisz wniosek" />
          <p className="mt-4 max-w-[60ch] text-lg">
            Wybierz nabór, a AI rozpisze Twoją fiszkę pomysłu na sekcje wniosku o dofinansowanie. Poprawisz każde pole
            i wydrukujesz albo zapiszesz wniosek jako PDF.
          </p>
        </div>
        <GrantGenerator />
      </div>
    </PageBackdrop>
  );
}
