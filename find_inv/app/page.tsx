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
      <section aria-labelledby="hero-tytul" className="relative overflow-hidden bg-glow">
        <div className="absolute inset-x-0 top-0 h-1 bg-primary" aria-hidden="true" />
        <div className="relative mx-auto max-w-content px-4 pt-24 pb-16 sm:px-6 lg:pt-32 lg:pb-24">
          <CutoutText id="hero-tytul" as="h1" size="hero" text={t.home.heroTitle} animate />
          <p className="anim-hero-lead mt-5 max-w-[44ch] text-xl leading-relaxed">
            {t.home.heroLead}
          </p>
          <SearchForm className="anim-hero-form" />
          <div className="anim-hero-nav">
            <QuickNav sections={sections} label={t.home.quickNav} />
          </div>
        </div>
      </section>

      {/* Jak to działa */}
      <section
        id="jak-to-dziala"
        data-reveal
        aria-labelledby="jak-to-dziala-tytul"
        className="relative bg-section-fade"
      >
        <div className="relative mx-auto max-w-content px-4 py-16 sm:px-6 lg:py-24">
          <CutoutText id="jak-to-dziala-tytul" text={t.home.sections.how} />
          <div className="mt-6 h-px bg-border" aria-hidden="true" />
          <ol className="mt-12 grid gap-12 md:grid-cols-3 md:gap-10">
            {t.home.steps.map((step, index) => {
              const Icon = STEP_ICONS[index];
              return (
                <li key={step.title} className="flex flex-col">
                  <div className="mb-5 flex items-center gap-3">
                    <span
                      aria-hidden="true"
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-xl font-bold tabular-nums text-primary-foreground"
                    >
                      {index + 1}
                    </span>
                    <Icon aria-hidden="true" className="size-6 text-primary" strokeWidth={1.75} />
                  </div>
                  <h3 className="text-xl font-bold text-foreground">{step.title}</h3>
                  <p className="mt-3 leading-relaxed text-muted">{step.text}</p>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      {/* Kondycja Małopolski + Indeks Luki Innowacyjnej */}
      <section id="kondycja-malopolski" data-reveal aria-labelledby="kondycja-tytul" className="bg-dots">
        <div className="mx-auto max-w-content px-4 py-16 sm:px-6 lg:py-24">
          <CutoutText id="kondycja-tytul" text={t.home.sections.condition} />
          <p className="mt-4 max-w-[60ch] text-lg">
            {t.home.conditionLead}
          </p>
          <Link
            href="/wyzwania"
            className="mt-5 inline-flex min-h-12 items-center gap-2 font-semibold text-primary underline underline-offset-4 hover:text-primary-hover"
          >
            {t.home.seeChallenges}
            <ArrowRight aria-hidden="true" className="size-5" />
          </Link>
          <div className="mt-12">
            <MalopolskaStatsTiles />
          </div>

          <h3 className="mt-16 text-xl font-bold text-foreground">{t.home.mapTitle}</h3>
          <p className="mt-2 max-w-[60ch]">
            {t.home.mapLead}
          </p>
          <div className="mt-6">
            <PowiatMap />
          </div>

          <h3 className="mt-16 text-xl font-bold text-foreground">{t.home.gapTitle}</h3>
          <div className="mt-5">
            <GapIndex limit={3} />
          </div>
        </div>
      </section>

      {/* Co już działa */}
      <section id="co-juz-dziala" data-reveal aria-labelledby="co-juz-dziala-tytul">
        <div className="relative mx-auto max-w-content px-4 py-16 sm:px-6 lg:py-24">
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

      {/* Artykuł dnia */}
      <InnovationOfTheDaySection id="artykul-dnia" />
    </>
  );
}
