import { ArrowRight, Frown, Meh, MessageSquareText, ScanSearch, Smile, type LucideIcon } from "lucide-react";
import Link from "next/link";

import { CutoutText } from "@/components/cutout-text";
import { FeaturedInnovations } from "@/components/featured-innovations";
import { GapIndex } from "@/components/gap-index";
import { InnovationOfTheDay } from "@/components/innovation-of-the-day";
import { MalopolskaStatsTiles } from "@/components/malopolska-stats";
import { PaperCloud } from "@/components/paper-cloud";
import { PowiatMap } from "@/components/powiat-map";
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
    icon: Smile,
    title: "Dostosuj do swojej instytucji",
    text: "Wybierz rozwiązanie i przygotuj szkic planu wdrożenia dla swojej gminy albo organizacji.",
  },
];

type RegionCondition = "happy" | "mid" | "sad";

const REGION_CONDITION: RegionCondition = "mid";

const CONDITION_LABELS: Record<RegionCondition, { icon: LucideIcon; status: string; detail: string }> = {
  happy: { icon: Smile, status: "Dobra kondycja", detail: "Wskaźniki społeczne są stabilne." },
  mid: { icon: Meh, status: "Wymaga uwagi", detail: "Część obszarów potrzebuje dodatkowego wsparcia." },
  sad: { icon: Frown, status: "Trudna sytuacja", detail: "Dane pokazują pilną potrzebę działania." },
};

export default function HomePage() {
  const condition = CONDITION_LABELS[REGION_CONDITION];
  const ConditionIcon = condition.icon;

  return (
    <>
      {/* Hero */}
      <section aria-labelledby="hero-tytul" className="relative overflow-hidden">
        <div className="relative mx-auto max-w-content px-4 pt-20 pb-16 sm:px-6 lg:pt-20 lg:pb-24">
          <div>
            <CutoutText id="hero-tytul" as="h1" size="hero" text="Z czym masz kłopot?" animate />
            <p className="mt-6 max-w-[38ch] text-lg">
              Opisz to własnymi słowami. Znajdziemy rozwiązania, które już działają w Małopolsce.
            </p>
            <SearchForm />
            <nav aria-label="Szybki dostęp" className="mt-6 flex flex-wrap gap-x-6 gap-y-1">
              <a href="#artykul-dnia" className="inline-flex min-h-12 items-center gap-2 font-medium text-leaf underline underline-offset-4 hover:text-deep">
                Sprawdź artykuł dnia
                <ArrowRight aria-hidden="true" className="size-5" />
              </a>
              <a href="#co-juz-dziala" className="inline-flex min-h-12 items-center gap-2 font-medium text-leaf underline underline-offset-4 hover:text-deep">
                Popularne innowacje
                <ArrowRight aria-hidden="true" className="size-5" />
              </a>
              <a href="#kondycja-malopolski" className="inline-flex min-h-12 items-center gap-2 font-medium text-leaf underline underline-offset-4 hover:text-deep">
                Kondycja Małopolski
                <ArrowRight aria-hidden="true" className="size-5" />
              </a>
              <a href="#jak-to-dziala" className="inline-flex min-h-12 items-center gap-2 font-medium text-leaf underline underline-offset-4 hover:text-deep">
                Jak to działa
                <ArrowRight aria-hidden="true" className="size-5" />
              </a>
            </nav>
          </div>

        </div>
      </section>

      {/* Jak to działa */}
      <section
        id="jak-to-dziala"
        aria-labelledby="jak-to-dziala-tytul"
        className="scroll-mt-6 border-y-(length:--bw) border-deep bg-sage"
      >
        <div className="relative mx-auto max-w-content px-4 py-16 sm:px-6 lg:py-20">
          <PaperCloud shape="tall" className="absolute top-8 right-10 hidden w-44 rotate-2 lg:block" />
          <CutoutText id="jak-to-dziala-tytul" text="Jak to działa" />
          <ol className="mt-10 grid gap-6 md:grid-cols-3">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              return (
                <li key={step.title} className="border-(length:--bw) border-deep bg-surface p-6 shadow-paper">
                  <div className="flex items-center justify-between gap-4">
                    <p className="font-medium text-muted">Krok {index + 1}</p>
                    <Icon aria-hidden="true" className="size-8 text-leaf" strokeWidth={1.75} />
                  </div>
                  <h3 className="mt-3 text-xl font-medium text-deep">{step.title}</h3>
                  <p className="mt-2">{step.text}</p>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      {/* Kondycja Małopolski + Indeks Luki Innowacyjnej (Zasobnik wiedzy) */}
      <section id="kondycja-malopolski" aria-labelledby="kondycja-tytul" className="scroll-mt-6">
        <div className="mx-auto max-w-content px-4 py-16 sm:px-6 lg:py-20">
          <CutoutText id="kondycja-tytul" text="Kondycja Małopolski" />
          <p className="mt-4 max-w-[60ch] text-lg">
            Z czym mierzą się mieszkańcy regionu. Te liczby pomagają zdecydować, od czego zacząć.
          </p>
          <div className="mt-8 grid items-center gap-4 rounded-ui border-(length:--bw) border-deep bg-surface p-5 md:grid-cols-[auto_1fr_auto]">
            <ConditionIcon aria-hidden="true" strokeWidth={1.5} className="size-16 text-leaf" />
            <span>
              <span className="block text-xl font-bold text-deep">{condition.status}</span>
              <span className="mt-1 block">{condition.detail}</span>
            </span>
            <Link href="/wyzwania" className="inline-flex min-h-12 items-center gap-2 font-semibold text-leaf underline underline-offset-4 hover:text-deep">
              Zobacz badania i wyzwania
              <ArrowRight aria-hidden="true" className="size-5" />
            </Link>
          </div>
          <div className="mt-10">
            <MalopolskaStatsTiles />
          </div>

          <h3 className="mt-14 text-xl font-bold text-deep">Mapa powiatów</h3>
          <p className="mt-2 max-w-[60ch]">
            Kliknij powiat, żeby zobaczyć jego najważniejsze wyzwania i innowacje, które mogą pomóc.
          </p>
          <div className="mt-6">
            <PowiatMap />
          </div>

          <h3 className="mt-14 text-xl font-bold text-deep">Gdzie najbardziej brakuje rozwiązań</h3>
          <div className="mt-4">
            <GapIndex limit={3} />
          </div>
        </div>
      </section>

      {/* Co już działa */}
      <section id="co-juz-dziala" aria-labelledby="co-juz-dziala-tytul" className="scroll-mt-6">
        <div className="relative mx-auto max-w-content px-4 py-16 sm:px-6 lg:py-20">
          <PaperCloud className="absolute -top-6 right-24 hidden w-52 -rotate-1 lg:block" />
          <FeaturedInnovations headingId="co-juz-dziala-tytul">
            <p className="mt-4 max-w-[60ch] text-lg">
              Kilka innowacji z Biblioteki. Każda ma opis, informację, dla kogo jest, ile kosztuje i gdzie już działa.
            </p>
          </FeaturedInnovations>
          <Link href="/biblioteka" className={buttonVariants({ variant: "secondary", className: "mt-10" })}>
            Zobacz całą bibliotekę
          </Link>
        </div>
      </section>

      {/* Artykuł dnia */}
      <section id="artykul-dnia" aria-labelledby="artykul-dnia-tytul" className="scroll-mt-6 border-y-(length:--bw) border-deep bg-sage">
        <div className="mx-auto max-w-content px-4 py-10 sm:px-6 lg:py-12">
          <article className="mx-auto max-w-3xl border-(length:--bw) border-deep bg-surface p-6 shadow-paper md:p-8">
            <p className="text-sm font-medium text-muted">Artykuł dnia z Biblioteki Innowacji ROPS</p>
            {/* Każdego dnia inna innowacja z katalogu, ta sama dla wszystkich przez cały dzień. */}
            <InnovationOfTheDay headingId="artykul-dnia-tytul" />
          </article>
        </div>
      </section>

    </>
  );
}
