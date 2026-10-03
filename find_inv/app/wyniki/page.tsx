import type { Metadata } from "next";

import { isCrisis } from "@/components/crisis-panel";
import { CutoutText } from "@/components/cutout-text";
import { MatchResults } from "@/components/match-results";
import { PageBackdrop } from "@/components/page-backdrop";
import { SearchForm } from "@/components/search-form";

export const metadata: Metadata = { title: "Wyniki" };

export default async function ResultsPage({ searchParams }: PageProps<"/wyniki">) {
  const { q } = await searchParams;
  const query = (Array.isArray(q) ? q[0] : q)?.trim() ?? "";
  const crisis = isCrisis(query);

  const content = (
    <div className="mx-auto max-w-content px-4 py-16 sm:px-6">
      {/* Przy opisie kryzysowym bez kolażu i ozdób (DESIGN.md 8, „Komunikaty”). */}
      {crisis ? (
        <h1 className="text-2xl font-bold text-deep">Wyniki</h1>
      ) : (
        <CutoutText as="h1" size="section" text="Co już działa" />
      )}
      {/* key: nowy opis = nowy stan formularza i wyników (ta sama trasa nie odmontowuje komponentów). */}
      <SearchForm key={`form-${query}`} initialText={query} showExamples={!query} className="mt-6 max-w-4xl" />
      <MatchResults key={`wyniki-${query}`} query={query} />
    </div>
  );

  return crisis ? content : <PageBackdrop>{content}</PageBackdrop>;
}
