import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Deklaracja dostępności" };

export default function AccessibilityStatementPage() {
  return (
    <div className="mx-auto max-w-content px-4 py-16 sm:px-6">
      <h1 className="text-2xl font-bold text-deep">Deklaracja dostępności</h1>
      <p className="mt-4 max-w-[65ch] text-lg">
        Przygotowujemy deklarację dostępności. Opublikujemy ją przed uruchomieniem serwisu.
      </p>
      <p className="mt-4 max-w-[65ch]">
        Serwis projektujemy zgodnie z wytycznymi WCAG 2.1 na poziomie AA.
      </p>
      <Link href="/" className="mt-6 inline-flex min-h-12 items-center font-bold text-leaf underline underline-offset-4">
        Wróć na stronę główną
      </Link>
    </div>
  );
}
