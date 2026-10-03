import Link from "next/link";
import { ArrowLeft, ArrowRight, Frown, HeartHandshake, MapPin, Meh, Smile, Users, Wifi } from "lucide-react";

const CHALLENGES = [
  {
    icon: Users,
    title: "Samotność i izolacja seniorów",
    text: "Wiele starszych osób potrzebuje regularnego kontaktu, łatwego dostępu do pomocy i bezpiecznych miejsc spotkań blisko domu.",
    accent: "bg-mint",
  },
  {
    icon: MapPin,
    title: "Dostęp do transportu i usług",
    text: "Mieszkańcy mniejszych miejscowości często mają trudności z dojazdem do lekarza, urzędu, szkoły lub centrum aktywności.",
    accent: "bg-butter",
  },
  {
    icon: Wifi,
    title: "Wykluczenie cyfrowe",
    text: "Internet coraz częściej jest bramą do usług publicznych i zdrowotnych, ale nie każdy ma sprzęt, kompetencje albo kogoś, kto pomoże.",
    accent: "bg-sage",
  },
  {
    icon: HeartHandshake,
    title: "Wsparcie opiekunów i rodzin",
    text: "Rodziny opiekujące się osobami zależnymi potrzebują wytchnienia, praktycznej wiedzy i rozwiązań, które da się wdrożyć lokalnie.",
    accent: "bg-surface",
  },
];

const CONDITION_LEVELS = [
  { icon: Smile, label: "Dobra", text: "stabilne wskaźniki" },
  { icon: Meh, label: "Wymaga uwagi", text: "obszar do obserwacji" },
  { icon: Frown, label: "Trudna", text: "pilna potrzeba działania" },
];

export default function ChallengesPage() {
  return (
    <main id="tresc" className="min-h-screen">
      <section aria-labelledby="wyzwania-tytul" className="border-b-(length:--bw) border-deep bg-paper">
        <div className="mx-auto max-w-content px-4 py-16 sm:px-6 lg:py-24">
          <Link href="/" className="inline-flex min-h-12 items-center gap-2 font-semibold text-leaf underline underline-offset-4 hover:text-deep">
            <ArrowLeft aria-hidden="true" className="size-5" />
            Wróć na stronę główną
          </Link>
          <p className="mt-12 text-sm font-semibold uppercase tracking-[0.12em] text-muted">Małopolska 2026</p>
          <h1 id="wyzwania-tytul" className="mt-3 max-w-[18ch] text-hero font-bold text-deep">
            Najważniejsze wyzwania społeczne
          </h1>
          <p className="mt-6 max-w-[62ch] text-lg">
            Zebraliśmy obszary, które warto śledzić w badaniach społecznych i w których lokalne działania mogą realnie poprawić codzienne życie mieszkańców Małopolski.
          </p>
          <div className="mt-10 flex flex-wrap gap-3" aria-label="Warianty wskaźnika kondycji Małopolski">
            {CONDITION_LEVELS.map((level) => {
              const Icon = level.icon;
              return (
                <div key={level.label} className="inline-flex min-h-12 items-center gap-2 rounded-ui border-(length:--bw) border-deep bg-surface px-3 py-2">
                  <Icon aria-hidden="true" className="size-5 text-leaf" />
                  <span className="font-semibold text-deep">{level.label}</span>
                  <span className="text-sm text-muted">({level.text})</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section aria-labelledby="obszary-tytul" className="bg-surface">
        <div className="mx-auto max-w-content px-4 py-16 sm:px-6 lg:py-20">
          <div className="flex flex-col gap-4 border-b-(length:--bw) border-deep pb-8 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 id="obszary-tytul" className="text-2xl font-bold text-deep">Obszary, które wymagają uwagi</h2>
              <p className="mt-3 max-w-[58ch] text-lg">Każde wyzwanie może stać się punktem wyjścia do znalezienia rozwiązania, które już działa gdzie indziej.</p>
            </div>
            <Link href="/#co-juz-dziala" className="inline-flex min-h-12 shrink-0 items-center gap-2 font-semibold text-leaf underline underline-offset-4 hover:text-deep">
              Zobacz innowacje
              <ArrowRight aria-hidden="true" className="size-5" />
            </Link>
          </div>

          <ul className="mt-10 grid gap-6 md:grid-cols-2">
            {CHALLENGES.map((challenge) => {
              const Icon = challenge.icon;
              return (
                <li key={challenge.title} className="border-(length:--bw) border-deep bg-paper p-6 shadow-paper md:p-8">
                  <div className={`flex size-14 items-center justify-center rounded-ui border-(length:--bw) border-deep ${challenge.accent}`}>
                    <Icon aria-hidden="true" className="size-7 text-deep" />
                  </div>
                  <h3 className="mt-6 text-xl font-bold text-deep">{challenge.title}</h3>
                  <p className="mt-3 max-w-[55ch]">{challenge.text}</p>
                </li>
              );
            })}
          </ul>
        </div>
      </section>
    </main>
  );
}
