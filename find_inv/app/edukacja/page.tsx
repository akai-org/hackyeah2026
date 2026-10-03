import type { Metadata } from "next";

import { CutoutText } from "@/components/cutout-text";
import { EducationList } from "./education-list";

export const metadata: Metadata = {
  title: "Edukacja",
  description: "Przewodniki i materiały o innowacjach społecznych dla gmin, organizacji i mieszkańców Małopolski.",
};

export default function EducationPage() {
  return (
    <>
      <section aria-labelledby="edukacja-tytul" className="border-b-(length:--bw) border-deep bg-paper">
        <div className="mx-auto max-w-content px-4 py-16 sm:px-6 lg:py-20">
          <CutoutText id="edukacja-tytul" as="h1" size="hero" text="Edukacja" />
          <p className="mt-6 max-w-[60ch] text-lg">
            Przewodniki i materiały, które pomagają zrozumieć problem i przygotować się do wdrożenia rozwiązania.
          </p>
        </div>
      </section>

      <section aria-labelledby="materialy-tytul" className="bg-surface">
        <div className="mx-auto max-w-content px-4 py-16 sm:px-6 lg:py-20">
          <h2 id="materialy-tytul" className="sr-only">
            Materiały edukacyjne
          </h2>
          <EducationList />
        </div>
      </section>
    </>
  );
}
