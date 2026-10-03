import Link from "next/link";
import { Archive, Coins, MapPin, Puzzle, Users } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { COST_LABELS, type InnovationCard } from "@/data/innovations";
import { TAG_LABELS, type Tag } from "@/data/mock";
import { cn, plural } from "@/lib/utils";

// Karta innowacji w wynikach matchmakingu (DESIGN.md 8): stoi prosto, taśma tylko dekoracją,
// „Dlaczego pasuje” w blockquote z lewą linią. „Nieaktualna” to szara plakietka z ikoną i słowem.

function tagLabel(tag: string): string {
  return TAG_LABELS[tag as Tag] ?? tag.replace(/_/g, " ");
}

type MatchCardProps = {
  innovation: InnovationCard;
  /** Tagi zapytania: wspólne trafiają do „Dlaczego pasuje”. */
  queryTags?: string[];
  /** Opis problemu przekazywany do Middlemana. */
  query?: string;
  /** Miejsce w wynikach; bez niego karta nie pokazuje numeru ani dopasowania (np. w Bibliotece). */
  rank?: number;
  headingLevel?: "h2" | "h3";
};

export function MatchCard({
  innovation,
  queryTags = [],
  query = "",
  rank,
  headingLevel: Heading = "h3",
}: MatchCardProps) {
  const titleId = `innowacja-${innovation.id}`;
  const unmaintained = innovation.is_unmaintained ?? innovation.status === "unmaintained";
  const shared = innovation.tags.filter((tag) => queryTags.includes(tag));
  const score = innovation.match_score ? Math.round(innovation.match_score * 100) : null;
  const deployHref = `/wdrozenie/${innovation.id}${query ? `?q=${encodeURIComponent(query)}` : ""}`;

  return (
    <article
      aria-labelledby={titleId}
      className={cn(
        "relative flex h-full flex-col border-(length:--bw) border-deep p-6 shadow-paper",
        unmaintained ? "bg-paper" : "bg-surface",
      )}
    >
      <span
        aria-hidden="true"
        className="simple-hidden absolute -top-3 right-6 h-6 w-20 rotate-[4deg] bg-butter [clip-path:polygon(0_8%,6%_0,100%_4%,95%_50%,100%_96%,4%_100%,0_55%)]"
      />

      {rank !== undefined && (
        <p className="mb-1 flex flex-wrap items-center gap-2 text-sm font-bold text-muted">
          <span>Wynik {rank}</span>
          {score !== null && <span>· dopasowanie {score}%</span>}
        </p>
      )}

      <Heading id={titleId} className="pr-16 text-xl font-bold text-deep">
        {innovation.title}
      </Heading>

      {unmaintained && (
        <p className="mt-3 inline-flex items-start gap-2 self-start rounded-ui border-2 border-muted bg-sage px-3 py-1 font-bold text-ink">
          <Archive aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
          Nieaktualna: nikt już jej nie prowadzi
        </p>
      )}

      <p className="mt-3 text-lg">{innovation.short_desc}</p>

      {shared.length > 0 && (
        <blockquote className="mt-4 border-l-4 border-leaf pl-4">
          <p className="text-sm font-bold text-muted">Dlaczego pasuje</p>
          <p>Wspólne tematy: {shared.map(tagLabel).join(", ").toLowerCase()}.</p>
        </blockquote>
      )}

      <dl className="mt-4 grid gap-2">
        {innovation.target_group && (
          <div>
            <dt className="sr-only">Dla kogo</dt>
            <dd className="flex items-start gap-2">
              <Users aria-hidden="true" className="mt-1 size-5 shrink-0 text-leaf" />
              <span>{innovation.target_group}</span>
            </dd>
          </div>
        )}
        {innovation.where_implemented && (
          <div>
            <dt className="sr-only">Gdzie działa</dt>
            <dd className="flex items-start gap-2">
              <MapPin aria-hidden="true" className="mt-1 size-5 shrink-0 text-leaf" />
              <span>{innovation.where_implemented}</span>
            </dd>
          </div>
        )}
        {innovation.cost_level && (
          <div>
            <dt className="sr-only">Koszt</dt>
            <dd className="flex items-start gap-2">
              <Coins aria-hidden="true" className="mt-1 size-5 shrink-0 text-leaf" />
              <span>
                {COST_LABELS[innovation.cost_level]}
                {innovation.implementation_time_months
                  ? `, start w ${innovation.implementation_time_months} ${plural(innovation.implementation_time_months, "miesiąc", "miesiące", "miesięcy")}`
                  : ""}
              </span>
            </dd>
          </div>
        )}
        {typeof innovation.testers_count === "number" && innovation.testers_count > 0 && (
          <div>
            <dt className="sr-only">Testy</dt>
            <dd className="flex items-start gap-2">
              <Puzzle aria-hidden="true" className="mt-1 size-5 shrink-0 text-leaf" />
              <span>
                Sprawdzona przez {innovation.testers_count}{" "}
                {plural(innovation.testers_count, "testera", "testerów", "testerów")}
              </span>
            </dd>
          </div>
        )}
      </dl>

      <div className="mt-auto flex flex-wrap gap-3 pt-6">
        <Link href={deployHref} className={buttonVariants({ variant: "primary" })}>
          Jak to wdrożyć?<span className="sr-only"> {innovation.title}</span>
        </Link>
        <Link href={`/innowacje/${innovation.id}`} className={buttonVariants({ variant: "secondary" })}>
          Zobacz kartę<span className="sr-only">: {innovation.title}</span>
        </Link>
      </div>
    </article>
  );
}
