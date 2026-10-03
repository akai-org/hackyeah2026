import type { Metadata } from "next";
import Link from "next/link";

import { CutoutText } from "@/components/cutout-text";
import { Monstera } from "@/components/monstera";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = { title: "Wyniki" };

export default async function ResultsPage({ searchParams }: PageProps<"/wyniki">) {
  const { q } = await searchParams;
  const query = (Array.isArray(q) ? q[0] : q)?.trim() ?? "";

  return (
    <div className="mx-auto max-w-content px-4 py-16 sm:px-6">
      <CutoutText as="h1" size="section" text="Tu pojawią się wyniki" />
      <Monstera size="small" color="sage" className="simple-hidden mt-4 w-24 rotate-[160deg]" />

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
