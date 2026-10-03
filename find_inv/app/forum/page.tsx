import Link from "next/link";
import { ArrowLeft, MessageCircle } from "lucide-react";

export default function ForumPage() {
  return (
    <main id="tresc" className="min-h-screen bg-paper">
      <div className="mx-auto max-w-content px-4 py-16 sm:px-6 lg:py-24">
        <Link href="/" className="inline-flex min-h-12 items-center gap-2 font-semibold text-leaf underline underline-offset-4 hover:text-deep">
          <ArrowLeft aria-hidden="true" className="size-5" />
          Wróć na stronę główną
        </Link>
        <div className="mt-12 max-w-2xl">
          <MessageCircle aria-hidden="true" className="size-12 text-leaf" />
          <h1 className="mt-6 text-hero font-bold text-deep">Forum</h1>
          <p className="mt-6 text-lg">
            Miejsce na rozmowy o tym, co działa w gminach, organizacjach i lokalnych społecznościach.
          </p>
        </div>
        <div className="mt-12 border-(length:--bw) border-deep bg-surface p-6 shadow-paper md:p-8">
          <h2 className="text-2xl font-bold text-deep">Forum w przygotowaniu</h2>
          <p className="mt-3 max-w-[65ch]">Wkrótce będzie można zadawać pytania, dzielić się doświadczeniami i szukać partnerów do wdrażania innowacji.</p>
        </div>
      </div>
    </main>
  );
}
