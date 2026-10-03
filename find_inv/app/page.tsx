import { ArrowRight, MessageSquareText, ScanSearch, Smile, type LucideIcon } from "lucide-react";
import Link from "next/link";

import { InnovationCard } from "@/components/innovation-card";
import { SearchForm } from "@/components/search-form";
import { innovations } from "@/data/innovations.mock";

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

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section aria-labelledby="hero-tytul" className="relative overflow-hidden">
        <div className="relative mx-auto grid max-w-content gap-6 px-4 pt-20 pb-16 sm:px-6 lg:grid-cols-[minmax(0,40rem)_1fr] lg:gap-0 lg:pt-20 lg:pb-24">
          <div>
            <h1 id="hero-tytul" className="text-hero font-medium text-deep">Z czym masz kłopot?</h1>
            <p className="mt-6 max-w-[38ch] text-lg">
              Opisz to własnymi słowami. Znajdziemy rozwiązania, które już działają w Małopolsce.
            </p>
            <SearchForm />
            <a href="#artykul-dnia" className="mt-6 inline-flex min-h-12 items-center gap-2 font-medium text-leaf underline underline-offset-4 hover:text-deep">
              Sprawdź artykuł dnia
              <ArrowRight aria-hidden="true" className="size-5" />
            </a>
          </div>

          <div className="relative hidden lg:block">
            <Smile aria-hidden="true" strokeWidth={1.25} className="absolute top-12 left-1/2 size-72 -translate-x-1/2 text-leaf" />
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
          <h2 id="jak-to-dziala-tytul" className="text-2xl font-medium text-deep">Jak to działa</h2>
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

      {/* Co już działa */}
      <section id="co-juz-dziala" aria-labelledby="co-juz-dziala-tytul" className="scroll-mt-6">
        <div className="mx-auto max-w-content px-4 py-16 sm:px-6 lg:py-20">
          <h2 id="co-juz-dziala-tytul" className="text-2xl font-medium text-deep">Popularne innowacje dla: <span className="text-3xl font-black">Seniora</span></h2>
          <p className="mt-4 max-w-[60ch] text-lg">
            Sprawdzone pomysły, które pomagają seniorom być w kontakcie, łatwiej docierać do lekarza i korzystać z internetu.
          </p>
          <ul className="mt-10 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {innovations.slice(0, 3).map((innovation) => (
              <li key={innovation.id} className="flex">
                <InnovationCard innovation={innovation} />
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Artykuł dnia */}
      <section id="artykul-dnia" aria-labelledby="artykul-dnia-tytul" className="scroll-mt-6 border-y-(length:--bw) border-deep bg-sage">
        <div className="mx-auto max-w-content px-4 py-10 sm:px-6 lg:py-12">
          <article className="mx-auto max-w-3xl border-(length:--bw) border-deep bg-surface p-6 shadow-paper md:p-8">
            <p className="text-sm font-medium text-muted">Artykuł dnia</p>
            <h2 id="artykul-dnia-tytul" className="mt-2 text-2xl font-medium text-deep">
              Jak wspierać seniora, który mieszka sam?
            </h2>
            <p className="mt-3 max-w-[65ch] text-lg">
              Kilka prostych działań może pomóc budować codzienny kontakt i szybciej zauważyć, że potrzebna jest pomoc.
            </p>
            <Link href="/biblioteka" className="mt-5 inline-flex min-h-12 items-center gap-2 font-medium text-leaf underline underline-offset-4 hover:text-deep">
              Czytaj w bibliotece
              <ArrowRight aria-hidden="true" className="size-5" />
            </Link>
          </article>
        </div>
      </section>

    </>
  );
}
