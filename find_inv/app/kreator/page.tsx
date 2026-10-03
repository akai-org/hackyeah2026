import Link from "next/link";
import { ArrowLeft, Lightbulb } from "lucide-react";

export default function IdeaCreatorPage() {
  return (
    <main id="tresc" className="min-h-screen bg-paper">
      <div className="mx-auto max-w-content px-4 py-16 sm:px-6 lg:py-24">
        <Link href="/" className="inline-flex min-h-12 items-center gap-2 font-semibold text-leaf underline underline-offset-4 hover:text-deep">
          <ArrowLeft aria-hidden="true" className="size-5" />
          Wróć na stronę główną
        </Link>
        <div className="mt-12 max-w-2xl">
          <Lightbulb aria-hidden="true" className="size-12 text-leaf" />
          <h1 className="mt-6 text-hero font-bold text-deep">Kreator pomysłów</h1>
          <p className="mt-6 text-lg">
            Zamień obserwację problemu w pomysł na innowację społeczną, którą można sprawdzić i wdrożyć lokalnie.
          </p>
        </div>
        <div className="mt-12 border-(length:--bw) border-deep bg-surface p-6 shadow-paper md:p-8">
          <h2 className="text-2xl font-bold text-deep">Kreator w przygotowaniu</h2>
          <p className="mt-3 max-w-[65ch]">Wkrótce przeprowadzimy Cię przez opis problemu, grupy odbiorców i pierwszych kroków wdrożenia.</p>
        </div>
      </div>
    </main>
  );
}
