import Link from "next/link";
import { MessageSquareText, Puzzle, ScanSearch, TrendingUp, AlertTriangle, type LucideIcon } from "lucide-react";

import { CutoutText } from "@/components/cutout-text";
import { BackendInnovationCard, type BackendInnovation } from "@/components/backend-innovation-card";
import { InnovationCard } from "@/components/innovation-card";
import { Monstera } from "@/components/monstera";
import { SearchForm } from "@/components/search-form";
import { buttonVariants } from "@/components/ui/button";
import { innovations } from "@/data/innovations.mock";

async function getShowcaseInnovations(): Promise<BackendInnovation[] | null> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/api/innovations?limit=3&status=active`,
      { next: { revalidate: 120 } },
    );
    if (!res.ok) return null;
    const json = await res.json();
    return (json.data ?? []).slice(0, 3) as BackendInnovation[];
  } catch {
    return null;
  }
}

const STATS = [
  { value: "22,4%", label: "osób 65+ w Małopolsce", source: "GUS 2024" },
  { value: "31%", label: "seniorów bez umiejętności cyfrowych", source: "GUS 2023" },
  { value: "18%", label: "gospodarstw z samotnością", source: "NSP 2021" },
  { value: "187 tys.", label: "osób z niepełnosprawnością", source: "ROPS 2024" },
];

const GAP_DATA = [
  { powiat: "limanowski", gap: 5.9, area: "dostęp do usług" },
  { powiat: "nowosądecki", gap: 4.7, area: "wykluczenie cyfrowe" },
  { powiat: "tarnowski", gap: 3.1, area: "samotność" },
  { powiat: "myślenicki", gap: 2.4, area: "zdrowie psychiczne" },
  { powiat: "krakowski", gap: 1.2, area: "starzenie" },
];

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

export default async function HomePage() {
  const liveInnovations = await getShowcaseInnovations();
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
            <Monstera
              size="hero"
              color="leaf"
              outlined
              className="absolute -top-6 left-10 rotate-[-28deg]"
            />
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
            Kilka innowacji z Biblioteki. Każda ma opis, informację, dla kogo jest, i ocenę dowodów skuteczności.
          </p>
          <ul className="mt-10 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {liveInnovations
              ? liveInnovations.map((inn) => (
                  <li key={inn.id} className="flex">
                    <BackendInnovationCard innovation={inn} headingLevel="h3" />
                  </li>
                ))
              : innovations.slice(0, 3).map((innovation) => (
                  <li key={innovation.id} className="flex">
                    <InnovationCard innovation={innovation} />
                  </li>
                ))
            }
          </ul>
          <Link href="/biblioteka" className={buttonVariants({ variant: "secondary", className: "mt-10" })}>
            Zobacz całą bibliotekę
          </Link>
        </div>
      </section>

      {/* Kondycja Małopolski */}
      <section
        id="kondycja"
        aria-labelledby="kondycja-tytul"
        className="scroll-mt-6 border-y-(length:--bw) border-deep bg-paper"
      >
        <div className="mx-auto max-w-content px-4 py-16 sm:px-6 lg:py-20">
          <CutoutText id="kondycja-tytul" text="Kondycja Małopolski" />
          <p className="mt-4 max-w-[60ch] text-lg">
            Dane społeczne, które stoją za innowacjami w naszej Bibliotece.
          </p>
          <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STATS.map(({ value, label, source }) => (
              <li key={label} className="border-(length:--bw) border-deep bg-surface p-6 shadow-paper">
                <p className="text-3xl font-bold text-deep tabular-nums">{value}</p>
                <p className="mt-2">{label}</p>
                <p className="mt-1 text-sm text-muted">{source}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Indeks Luki Innowacyjnej */}
      <section
        id="luka-innowacyjna"
        aria-labelledby="luka-tytul"
        className="scroll-mt-6"
      >
        <div className="mx-auto max-w-content px-4 py-16 sm:px-6 lg:py-20">
          <div className="flex items-start gap-4">
            <TrendingUp className="mt-1 size-8 shrink-0 text-leaf" aria-hidden="true" />
            <div>
              <CutoutText id="luka-tytul" text="Indeks Luki Innowacyjnej" />
              <p className="mt-4 max-w-[60ch] text-lg">
                Gdzie w Małopolsce jest problem, ale brakuje odpowiedzi? Wyższy wynik = więcej potrzeby, mniej rozwiązań.
              </p>
            </div>
          </div>
          <ul className="mt-10 space-y-3" aria-label="Indeks luki innowacyjnej per powiat">
            {GAP_DATA.map(({ powiat, gap, area }) => (
              <li key={powiat} className="flex items-center gap-4 border-(length:--bw) border-deep bg-surface px-5 py-4 shadow-paper">
                <div className="w-32 shrink-0">
                  <p className="font-bold text-deep capitalize">{powiat}</p>
                  <p className="text-sm text-muted">{area}</p>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div
                      className="h-4 rounded-ui bg-leaf"
                      style={{ width: `${(gap / 6) * 100}%` }}
                      role="presentation"
                      aria-hidden="true"
                    />
                    <span className="text-sm font-bold tabular-nums text-deep">{gap.toFixed(1)}</span>
                  </div>
                </div>
                {gap > 4 && (
                  <AlertTriangle className="size-5 shrink-0 text-alert" aria-label="Wysoki priorytet" />
                )}
              </li>
            ))}
          </ul>
          <p className="mt-6 text-sm text-muted">
            Dane: ROPS Kraków, OZPS 2023–2024. Wyższy wynik = większa luka między problemem a dostępnymi innowacjami.
          </p>
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

      {/* Kontakt */}
      <section
        id="kontakt"
        aria-labelledby="kontakt-tytul"
        className="scroll-mt-6 border-t-(length:--bw) border-deep bg-sage"
      >
        <div className="mx-auto max-w-content px-4 py-16 sm:px-6 lg:py-20">
          <CutoutText id="kontakt-tytul" text="Kontakt" />
          <div className="mt-6 grid gap-8 md:grid-cols-2">
            <div>
              <h3 className="text-xl font-bold text-deep">ROPS Kraków</h3>
              <p className="mt-2 text-muted">Regionalny Ośrodek Polityki Społecznej w Krakowie</p>
              <p className="mt-1">ul. Piastowska 32, 30-070 Kraków</p>
              <p className="mt-1">
                <a href="https://rops.krakow.pl" className="underline text-leaf font-bold">
                  rops.krakow.pl
                </a>
              </p>
            </div>
            <div>
              <h3 className="text-xl font-bold text-deep">HubMI.pl</h3>
              <p className="mt-2 text-muted">
                Platforma budowana w ramach projektu HackYeah 2026 dla Województwa Małopolskiego.
              </p>
              <Link href="/biblioteka" className={buttonVariants({ variant: "secondary", className: "mt-4" })}>
                Przeglądaj Bibliotekę innowacji
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
