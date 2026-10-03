import type { Metadata } from "next";

import { CutoutText } from "@/components/cutout-text";
import { GapIndex } from "@/components/gap-index";

export const metadata: Metadata = { title: "Indeks Luki Innowacyjnej" };

export default function GapPage() {
  return (
    <div className="mx-auto max-w-content px-4 py-16 sm:px-6">
      <CutoutText as="h1" size="section" text="Gdzie brakuje rozwiązań" />
      <p className="mt-4 max-w-[62ch] text-lg">
        Indeks Luki Innowacyjnej łączy dane o problemach społecznych z liczbą innowacji w Bibliotece. Wysoki wynik
        oznacza białą plamę: ludzie potrzebują pomocy, a sprawdzonych rozwiązań jest mało. Otwórz „Puls powiatu”, żeby
        zobaczyć wyzwania i to, co może pomóc.
      </p>
      <div className="mt-10">
        <GapIndex />
      </div>
    </div>
  );
}
