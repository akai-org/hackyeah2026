import { ArrowRight, ClipboardCheck, MessageSquareText, ScanSearch, type LucideIcon } from "lucide-react";
import Link from "next/link";

import { CutoutText } from "@/components/cutout-text";
import { FeaturedInnovations } from "@/components/featured-innovations";
import { GapIndex } from "@/components/gap-index";
import { InnovationOfTheDaySection } from "@/components/innovation-of-the-day";
import { MalopolskaStatsTiles } from "@/components/malopolska-stats";
import { QuickNav } from "@/components/quick-nav";
import { PowiatMap } from "@/components/powiat-map";
import { RevealOnScroll } from "@/components/reveal-on-scroll";
import { SearchForm } from "@/components/search-form";
import { buttonVariants } from "@/components/ui/button";
import { getT } from "@/lib/i18n/server";

const STEP_ICONS: LucideIcon[] = [MessageSquareText, ScanSearch, ClipboardCheck];

export default async function HomePage() {
  const t = await getT();
  // Sekcje strony głównej w kolejności, w jakiej leżą na stronie.
  const sections = [
    { id: "jak-to-dziala", label: t.home.sections.how },
    { id: "kondycja-malopolski", label: t.home.sections.condition },
    { id: "co-juz-dziala", label: t.home.sections.popular },
    { id: "artykul-dnia", label: t.home.sections.article },
  ];
  return (
    <>
      <RevealOnScroll />
      {/* Hero */}
      <section aria-labelledby="hero-tytul" className="relative overflow-hidden bg-dots">
        <div className="relative mx-auto max-w-content px-4 pt-20 pb-16 sm:px-6 lg:pt-20 lg:pb-24">
          <div>
            <CutoutText id="hero-tytul" as="h1" size="hero" text={t.home.heroTitle} animate />
            <p className="mt-6 max-w-[38ch] text-lg">
              {t.home.heroLead}
            </p>
            <SearchForm />
            <QuickNav sections={sections} label={t.home.quickNav} />
          </div>

        </div>
      </section>

      {/* Jak to działa */}
      <section
        id="jak-to-dziala"
        data-reveal
        aria-labelledby="jak-to-dziala-tytul"
        className="relative"
      >
        <div className="relative mx-auto max-w-content px-4 py-16 sm:px-6 lg:py-20">
          <CutoutText id="jak-to-dziala-tytul" text={t.home.sections.how} />
          <ol className="mt-10 grid gap-6 md:grid-cols-3">
            {t.home.steps.map((step, index) => {
              const Icon = STEP_ICONS[index];
              return (
                <li key={step.title} className="hover-lift border-(length:--bw) border-border bg-surface p-6 shadow-raised">
                  <div className="flex items-center justify-between gap-4">
                    <p className="font-medium text-muted">{t.home.step(index + 1)}</p>
                    <Icon aria-hidden="true" className="size-8 text-primary" strokeWidth={1.75} />
                  </div>
                  <h3 className="mt-3 text-xl font-medium text-foreground">{step.title}</h3>
                  <p className="mt-2">{step.text}</p>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      {/* Kondycja Małopolski + Indeks Luki Innowacyjnej (Zasobnik wiedzy) */}
      <section id="kondycja-malopolski" data-reveal aria-labelledby="kondycja-tytul" className="bg-dots">
        <div className="mx-auto max-w-content px-4 py-16 sm:px-6 lg:py-20">
          <CutoutText id="kondycja-tytul" text={t.home.sections.condition} />
          <p className="mt-4 max-w-[60ch] text-lg">
            {t.home.conditionLead}
          </p>
          <Link
            href="/wyzwania"
            className="mt-4 inline-flex min-h-12 items-center gap-2 font-semibold text-primary underline underline-offset-4 hover:text-primary-hover"
          >
            {t.home.seeChallenges}
            <ArrowRight aria-hidden="true" className="size-5" />
          </Link>
          <div className="mt-10">
            <MalopolskaStatsTiles />
          </div>

          <h3 className="mt-14 text-xl font-bold text-foreground">{t.home.mapTitle}</h3>
          <p className="mt-2 max-w-[60ch]">
            {t.home.mapLead}
          </p>
          <div className="mt-6">
            <PowiatMap />
          </div>

          <h3 className="mt-14 text-xl font-bold text-foreground">{t.home.gapTitle}</h3>
          <div className="mt-4">
            <GapIndex limit={3} />
          </div>
        </div>
      </section>

      {/* Co już działa */}
      <section id="co-juz-dziala" data-reveal aria-labelledby="co-juz-dziala-tytul">
        <div className="relative mx-auto max-w-content px-4 py-16 sm:px-6 lg:py-20">
          <FeaturedInnovations headingId="co-juz-dziala-tytul">
            <p className="mt-4 max-w-[60ch] text-lg">
              {t.home.popularLead}
            </p>
          </FeaturedInnovations>
          <Link href="/biblioteka" className={buttonVariants({ variant: "secondary", className: "mt-10" })}>
            {t.home.seeLibrary}
          </Link>
        </div>
      </section>

      {/* Artykuł dnia — każdego dnia inna innowacja z katalogu; bez danych sekcja się chowa. */}
      <InnovationOfTheDaySection id="artykul-dnia" />

    </>
  );
}
