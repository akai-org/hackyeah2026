import Link from "next/link";
import { Clock, Coins, MapPin, TriangleAlert } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { tagLabel, type CostLevel, type MatchedInnovation } from "@/lib/matchmaking-api";

// Karta innowacji z Biblioteki ROPS: wyniki matchmakingu (/wyniki) i Biblioteka (/biblioteka).
// Bez hooków, więc działa w komponentach serwerowych i klienckich.

export type InnovationSummary = Omit<MatchedInnovation, "full_desc" | "match_score"> &
  Partial<Pick<MatchedInnovation, "full_desc" | "match_score">>;

const COST_LABEL: Record<CostLevel, string> = { low: "niski", medium: "średni", high: "wysoki" };

export function RopsInnovationCard({
  innovation,
  query,
  headingLevel: Heading = "h3",
}: {
  innovation: InnovationSummary;
  /** Opis problemu z wyszukiwarki — trafia do planu wdrożenia (Middleman). */
  query?: string;
  headingLevel?: "h2" | "h3";
}) {
  const titleId = `wynik-${innovation.id}`;
  const middlemanHref = `/wdrozenie?innowacja=${innovation.id}${query ? `&problem=${encodeURIComponent(query)}` : ""}`;

  return (
    <article
      aria-labelledby={titleId}
      className="relative flex w-full flex-col border-(length:--bw) border-deep bg-surface p-6 shadow-paper"
    >
      <span
        aria-hidden="true"
        className="simple-hidden absolute -top-3 right-6 h-6 w-20 rotate-[4deg] bg-butter [clip-path:polygon(0_8%,6%_0,100%_4%,95%_50%,100%_96%,4%_100%,0_55%)]"
      />

      <Heading id={titleId} className="pr-16 text-xl font-bold text-deep">
        {innovation.title}
      </Heading>

      {innovation.is_unmaintained && (
        <p className="mt-3 inline-flex items-center gap-2 self-start rounded-ui border-2 border-muted bg-paper px-3 py-1 font-bold text-muted">
          <TriangleAlert aria-hidden="true" className="size-5 shrink-0" />
          Nieaktualna: sprawdź, czy nadal działa
        </p>
      )}

      <p className="mt-4 text-sm text-muted">{query ? "Dlaczego pasuje" : "Na czym polega"}</p>
      <blockquote className="mt-1 border-l-4 border-leaf pl-4 text-lg">{innovation.short_desc}</blockquote>

      <dl className="mt-4 space-y-3">
        {innovation.target_group && (
          <div>
            <dt className="text-sm text-muted">Dla kogo</dt>
            <dd className={detailClass(innovation.target_group)}>{innovation.target_group}</dd>
          </div>
        )}
        {innovation.where_implemented && (
          <div>
            <dt className="flex items-center gap-1 text-sm text-muted">
              <MapPin aria-hidden="true" className="size-4" />
              {/* W danych ROPS to pole bywa listą miejsc, a bywa opisem, kto może skorzystać. */}
              {isPlaceList(innovation.where_implemented) ? "Gdzie już działa" : "Kto może wdrożyć"}
            </dt>
            <dd className={detailClass(innovation.where_implemented)}>{innovation.where_implemented}</dd>
          </div>
        )}
      </dl>

      {(innovation.cost_level || innovation.implementation_time_months) && (
        <dl className="mt-3 flex flex-wrap gap-x-8 gap-y-3">
          {innovation.cost_level && (
            <div>
              <dt className="flex items-center gap-1 text-sm text-muted">
                <Coins aria-hidden="true" className="size-4" />
                Koszt
              </dt>
              <dd className="font-bold">{COST_LABEL[innovation.cost_level]}</dd>
            </div>
          )}
          {innovation.implementation_time_months && (
            <div>
              <dt className="flex items-center gap-1 text-sm text-muted">
                <Clock aria-hidden="true" className="size-4" />
                Czas wdrożenia
              </dt>
              <dd className="font-bold">{formatMonths(innovation.implementation_time_months)}</dd>
            </div>
          )}
        </dl>
      )}

      {innovation.tags.length > 0 && (
        <ul aria-label="Tagi" className="mt-4 flex flex-wrap gap-2">
          {innovation.tags.map((tag) => (
            <li key={tag} className="rounded-ui bg-sage px-3 py-1 text-sm text-ink">
              {tagLabel(tag)}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-auto flex flex-wrap gap-3 pt-6">
        <Link href={middlemanHref} className={buttonVariants()}>
          Dostosuj do mojej instytucji<span className="sr-only">: {innovation.title}</span>
        </Link>
        {innovation.source_url && (
          <a href={innovation.source_url} className={buttonVariants({ variant: "secondary" })}>
            Zobacz kartę<span className="sr-only">: {innovation.title} (strona ROPS)</span>
          </a>
        )}
      </div>
    </article>
  );
}

// Krótka wartość wyróżniona pogrubieniem, dłuższy opis zwykłym krojem — czytelniej.
function detailClass(value: string) {
  return value.length > 60 ? undefined : "font-bold";
}

function isPlaceList(value: string) {
  return value.length <= 60 && !/skorzysta|instytucj|organizacj|placówk/i.test(value);
}

function formatMonths(months: number) {
  if (months === 1) return "1 miesiąc";
  const lastDigit = months % 10;
  const lastTwo = months % 100;
  const few = lastDigit >= 2 && lastDigit <= 4 && (lastTwo < 12 || lastTwo > 14);
  return `${months} ${few ? "miesiące" : "miesięcy"}`;
}
