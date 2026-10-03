import Link from "next/link";
import { MessageSquareText, Puzzle, ScanSearch, type LucideIcon } from "lucide-react";

import { CutoutText } from "@/components/cutout-text";
import { FeaturedInnovations } from "@/components/featured-innovations";
import { Monstera } from "@/components/monstera";
import { SearchForm } from "@/components/search-form";
import { buttonVariants } from "@/components/ui/button";

const STEPS: Array<{ icon: LucideIcon; title: string; text: string }> = [
  {
    icon: MessageSquareText,
    title: "Opisz problem",
    text: "Napisz albo podyktuj, co się dzieje. Nie musisz znać fachowych słów.",
  },
  {
    icon: ScanSearch,
    title: "Zobacz, co już działa",
    text: "Pokażemy innowacje z Biblioteki, które pomogły w podobnej sytuacji. Przy każdej zobaczysz, czy ma dowody skuteczności.",
  },
  {
    icon: Puzzle,
    title: "Dostosuj do swojej instytucji",
    text: "Wybierz rozwiązanie i przygotuj szkic planu wdrożenia dla swojej gminy albo organizacji.",
  },
];

const AUDIENCES = [
  {
    title: "Mieszkańcy",
    text: "Opisujesz kłopot zwykłymi słowami i widzisz, kto w Małopolsce już sobie z nim poradził.",
  },
  {
    title: "Organizacje pozarządowe",
    text: "Znajdujesz sprawdzone pomysły na projekt i argumenty do wniosku o dofinansowanie.",
  },
  {
    title: "Samorządy (gminy i powiaty)",
    text: "Porównujesz rozwiązania z innych gmin i dostajesz szkic planu wdrożenia dla swojego urzędu.",
  },
  {
    title: "Eksperci i ROPS",
    text: "Widzisz, z czym ludzie szukają pomocy, i wiesz, gdzie w Bibliotece brakuje rozwiązań.",
  },
];

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section aria-labelledby="hero-tytul" className="relative overflow-hidden">
        {/* Mobile i tablet: jeden mały liść w rogu, nad nagłówkiem. */}
        <Monstera
          size="small"
          color="leaf"
          className="absolute -top-8 -right-10 w-28 rotate-[200deg] sm:w-32 lg:hidden"
        />

        <div className="relative mx-auto grid max-w-content gap-6 px-4 pt-20 pb-16 sm:px-6 lg:grid-cols-[minmax(0,40rem)_1fr] lg:gap-0 lg:pt-20 lg:pb-24">
          <div>
            <CutoutText id="hero-tytul" as="h1" size="hero" text="Z czym masz kłopot?" animate />
            <p className="mt-6 max-w-[38ch] text-lg">
              Opisz to własnymi słowami. Znajdziemy rozwiązania, które już działają w Małopolsce.
            </p>
            <SearchForm />
          </div>

          {/* Desktop: duży liść ucięty przez prawą krawędź ekranu, min. 24 px od treści. */}
          <div aria-hidden="true" className="relative hidden lg:block">
            <Monstera
              size="small"
              color="mint"
              className="simple-hidden absolute top-72 left-48 w-72 rotate-[150deg]"
            />
            <Monstera size="hero" color="leaf" outlined className="absolute -top-6 left-10 rotate-[-28deg]" />
          </div>
        </div>
      </section>

      {/* Jak to działa */}
      <section
        id="jak-to-dziala"
        aria-labelledby="jak-to-dziala-tytul"
        className="scroll-mt-6 border-y-(length:--bw) border-deep bg-sage"
      >
        <div className="mx-auto max-w-content px-4 py-16 sm:px-6 lg:py-20">
          <CutoutText id="jak-to-dziala-tytul" text="Jak to działa" />
          <ol className="mt-10 grid gap-6 md:grid-cols-3">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              return (
                <li key={step.title} className="border-(length:--bw) border-deep bg-surface p-6 shadow-paper">
                  <div className="flex items-center justify-between gap-4">
                    <p className="font-bold text-muted">Krok {index + 1}</p>
                    <Icon aria-hidden="true" className="size-8 text-leaf" strokeWidth={1.75} />
                  </div>
                  <h3 className="mt-3 text-xl font-bold text-deep">{step.title}</h3>
                  <p className="mt-2">{step.text}</p>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      {/* Co już działa */}
      <section id="co-juz-dziala" aria-labelledby="co-juz-dziala-tytul" className="scroll-mt-6">
        <div className="mx-auto max-w-content px-4 py-16 sm:px-6 lg:py-20">
          <CutoutText id="co-juz-dziala-tytul" text="Co już działa" />
          <p className="mt-4 max-w-[60ch] text-lg">
            Kilka innowacji z Biblioteki. Każda ma opis, informację, dla kogo jest, ile kosztuje i gdzie już działa.
          </p>
          <FeaturedInnovations />
          <Link href="/biblioteka" className={buttonVariants({ variant: "secondary", className: "mt-10" })}>
            Zobacz całą bibliotekę
          </Link>
        </div>
      </section>

      {/* Dla kogo */}
      <section
        id="dla-kogo"
        aria-labelledby="dla-kogo-tytul"
        className="scroll-mt-6 border-t-(length:--bw) border-deep bg-surface"
      >
        <div className="mx-auto max-w-content px-4 py-16 sm:px-6 lg:py-20">
          <CutoutText id="dla-kogo-tytul" text="Dla kogo" />
          <ul className="mt-10 grid gap-x-12 gap-y-8 md:grid-cols-2">
            {AUDIENCES.map((audience) => (
              <li key={audience.title} className="border-l-4 border-leaf pl-5">
                <h3 className="text-xl font-bold text-deep">{audience.title}</h3>
                <p className="mt-2 max-w-[48ch]">{audience.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
