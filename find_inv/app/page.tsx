import { ArrowRight, Frown, Meh, MessageSquareText, ScanSearch, Smile, type LucideIcon } from "lucide-react";
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
            <h1 id="hero-tytul" className="text-hero font-medium text-deep">Z czym masz kłopot?</h1>
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

      {/* Kondycja regionu */}
      <section id="kondycja-malopolski" aria-labelledby="kondycja-tytul" className="scroll-mt-6 border-b-(length:--bw) border-deep bg-paper">
        <div className="mx-auto max-w-content px-4 py-8 sm:px-6">
          <div className="grid max-w-3xl items-center gap-4 rounded-ui border-(length:--bw) border-deep bg-surface p-5 md:grid-cols-[auto_1fr_auto]">
            <ConditionIcon aria-hidden="true" strokeWidth={1.5} className="size-16 text-leaf" />
            <span>
              <span id="kondycja-tytul" className="block text-sm font-semibold uppercase tracking-[0.12em] text-leaf">Kondycja Małopolski</span>
              <span id="kondycja-status" className="mt-1 block text-xl font-bold text-deep">{condition.status}</span>
              <span className="mt-1 block">{condition.detail}</span>
            </span>
            <Link href="/wyzwania" className="inline-flex min-h-12 items-center gap-2 font-semibold text-leaf underline underline-offset-4 hover:text-deep">
              Zobacz badania i wyzwania
              <ArrowRight aria-hidden="true" className="size-5" />
            </Link>
          </div>
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
