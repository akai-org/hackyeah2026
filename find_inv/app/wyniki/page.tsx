import type { Metadata } from "next";
import Link from "next/link";
import { Smile } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = { title: "Wyniki" };

export default async function ResultsPage({ searchParams }: PageProps<"/wyniki">) {
  const { q } = await searchParams;
  const query = (Array.isArray(q) ? q[0] : q)?.trim() ?? "";

  return (
    <div className="mx-auto max-w-content px-4 py-16 sm:px-6">
      <h1 className="text-2xl font-bold text-deep">Tu pojawią się wyniki</h1>
      <Smile aria-hidden="true" className="simple-hidden mt-4 size-20 text-leaf" />

      {query ? (
        <div className="mt-6 max-w-[65ch]">
          <p className="font-bold text-deep">Twój opis problemu</p>
          <blockquote className="mt-2 border-l-4 border-leaf bg-surface px-5 py-4 text-lg">{query}</blockquote>
        </div>
      ) : (
        <p className="mt-6 max-w-[65ch] text-lg">Nie podano opisu problemu.</p>
      )}

      <p className="mt-6 max-w-[65ch]">
        To prototyp. Wyszukiwanie w Bibliotece innowacji podłączymy w kolejnym kroku.
      </p>
      <Link href="/" className={buttonVariants({ variant: "secondary", className: "mt-8" })}>
        Zmień opis problemu
      </Link>
    </div>
  );
}
