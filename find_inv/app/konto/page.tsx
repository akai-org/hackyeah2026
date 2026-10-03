import Link from "next/link";
import { ArrowLeft, UserRound } from "lucide-react";

export default function AccountPage() {
  return (
    <main id="tresc" className="min-h-screen bg-background">
      <div className="mx-auto max-w-content px-4 py-16 sm:px-6 lg:py-24">
        <Link href="/" className="inline-flex min-h-12 items-center gap-2 font-semibold text-primary underline underline-offset-4 hover:text-primary-hover">
          <ArrowLeft aria-hidden="true" className="size-5" />
          Wróć na stronę główną
        </Link>
        <div className="mt-12 max-w-2xl">
          <UserRound aria-hidden="true" className="size-12 text-primary" />
          <h1 className="mt-6 text-hero font-bold text-foreground">Konto użytkownika</h1>
          <p className="mt-6 text-lg">
            Zaloguj się, aby zapisywać ulubione innowacje, obserwować wyzwania i wracać do swoich pomysłów.
          </p>
        </div>
        <div className="mt-12 border-(length:--bw) border-border bg-surface p-6 shadow-raised md:p-8">
          <h2 className="text-2xl font-bold text-foreground">Konto w przygotowaniu</h2>
          <p className="mt-3 max-w-[65ch]">Wkrótce będzie można utworzyć profil i zachować swoje wyszukiwania w jednym miejscu.</p>
        </div>
      </div>
    </main>
  );
}
