import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { ChallengesView } from "./challenges-view";

export const metadata: Metadata = {
  title: "Wyzwania społeczne",
  description: "Wskaźniki wyzwań społecznych w powiatach Małopolski — z danymi źródłowymi GUS i raportami ROPS.",
};

function first(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

export default async function ChallengesPage({ searchParams }: PageProps<"/wyzwania">) {
  const params = await searchParams;
  const initial = { query: first(params.q), powiat: first(params.powiat), tags: first(params.tagi) };

  return (
    <div className="min-h-screen">
      <section aria-labelledby="wyzwania-tytul" className="border-b-(length:--bw) border-deep bg-paper">
        <div className="mx-auto max-w-content px-4 py-16 sm:px-6 lg:py-20">
          <Link
            href="/"
            className="inline-flex min-h-12 items-center gap-2 font-semibold text-leaf underline underline-offset-4 hover:text-deep"
          >
            <ArrowLeft aria-hidden="true" className="size-5" />
            Wróć na stronę główną
          </Link>
          <h1 id="wyzwania-tytul" className="mt-10 max-w-[18ch] text-hero font-bold text-deep">
            Wyzwania społeczne Małopolski
          </h1>
          <p className="mt-6 max-w-[62ch] text-lg">
            Wskaźniki, które pokazują, z czym mierzą się mieszkańcy poszczególnych powiatów. Przy każdej liczbie
            jest rok i źródło. Wybierz obszar i poszukaj rozwiązań, które już działają.
          </p>
        </div>
      </section>

      <section aria-labelledby="obszary-tytul" className="bg-surface">
        <div className="mx-auto max-w-content px-4 py-16 sm:px-6 lg:py-20">
          <h2 id="obszary-tytul" className="sr-only">
            Obszary wyzwań
          </h2>
          {/* key: nowe wyszukiwanie z nagłówka na tej samej stronie zaczyna od nowa. */}
          <ChallengesView
            key={JSON.stringify(initial)}
            initialQuery={initial.query}
            initialPowiat={initial.powiat}
            initialTags={initial.tags}
          />
        </div>
      </section>
    </div>
  );
}
